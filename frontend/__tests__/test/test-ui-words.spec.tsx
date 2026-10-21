import { createRoot } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// opens indexedDB on import, which jsdom lacks
vi.mock("../../src/ts/controllers/theme-controller", () => ({
  randomizeTheme: vi.fn(),
}));
// uses matchMedia on import, which jsdom lacks
vi.mock("../../src/ts/controllers/ad-controller", () => ({
  destroyResult: vi.fn(),
}));
// funbox functions pull in test state, which fetches keyboard layouts on load
vi.mock("../../src/ts/utils/json-data", async (importOriginal) => ({
  ...(await importOriginal()),
  getLayout: vi.fn(async () => new Promise(() => undefined)),
}));
// input source for test-ui's letter updates
let currentInput = "";
vi.mock("../../src/ts/test/events/data", async (importOriginal) => ({
  ...(await importOriginal()),
  getCurrentInput: (): string => currentInput,
}));

import { Words } from "../../src/ts/components/pages/test/Words";
import { __testing as configTesting } from "../../src/ts/config/testing";
import { registerInputElement } from "../../src/ts/input/input-element";
import {
  increaseActiveWordIndex,
  resetActiveWordIndex,
} from "../../src/ts/states/test";
import * as WordsRender from "../../src/ts/states/words-render";
import * as TestUI from "../../src/ts/test/test-ui";
import { ElementWithUtils } from "../../src/ts/utils/dom";

// jsdom has no layout: words get a fake one, 5 per line
const wordsPerLine = 5;
const lineHeight = 30;

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function runFrames(): void {
  while (frames.size > 0) {
    const pending = [...frames.values()];
    frames.clear();
    for (const cb of pending) cb(0);
  }
}

const cleanups: (() => void)[] = [];

/** Mounts #words with Words inside, bound to test-ui like TestPage does. */
function mount(): { words: HTMLElement; input: HTMLTextAreaElement } {
  const typingTest = document.createElement("div");
  const wordsWrapper = document.createElement("div");
  const words = document.createElement("div");
  const input = document.createElement("textarea");
  wordsWrapper.append(input, words);
  typingTest.append(wordsWrapper);
  document.body.append(typingTest);

  const controller = new AbortController();
  registerInputElement(input, controller.signal);
  const disposeWords = render(() => <Words />, words);
  createRoot((dispose) => {
    TestUI.init(
      {
        words: new ElementWithUtils(words),
        wordsWrapper: new ElementWithUtils(wordsWrapper),
        typingTest: new ElementWithUtils(typingTest),
      },
      controller.signal,
    );
    cleanups.push(() => {
      controller.abort();
      dispose();
      disposeWords();
      typingTest.remove();
    });
  });
  return { words, input };
}

function activeWordIndex(words: HTMLElement): string | undefined {
  return words.querySelector<HTMLElement>(".word.active")?.dataset["wordindex"];
}

describe("test-ui words rendering", () => {
  beforeEach(() => {
    frames = new Map();
    nextFrameId = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = nextFrameId++;
      frames.set(id, cb);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames.delete(id);
    });
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(
      function (this: HTMLElement) {
        if (!this.classList.contains("word")) return 0;
        const index = Number(this.dataset["wordindex"]);
        return Math.floor(index / wordsPerLine) * lineHeight;
      },
    );
    configTesting.replaceConfig({
      mode: "words",
      tapeMode: "off",
      showAllLines: true,
      fontSize: 1,
    });
    resetActiveWordIndex();
    currentInput = "";
    // jsdom has no default font size, the words input is sized in rem
    document.documentElement.style.fontSize = "16px";
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    WordsRender.reset();
    resetActiveWordIndex();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    configTesting.replaceConfig({});
    document.documentElement.style.fontSize = "";
  });

  it("renders a word change only in the next frame, then lays out against the new active word", () => {
    const { words, input } = mount();
    for (let i = 0; i < 10; i++) WordsRender.appendWord("word");
    WordsRender.setActiveWord(0);
    runFrames();
    // to the last word of the first line
    for (let i = 0; i < 4; i++) {
      increaseActiveWordIndex();
      void TestUI.afterTestWordChange("forward");
    }
    runFrames();
    increaseActiveWordIndex();
    const topBefore = input.style.top;

    void TestUI.afterTestWordChange("forward");

    // nothing rendered or laid out synchronously
    expect(activeWordIndex(words)).toBe("4");
    expect(input.style.top).toBe(topBefore);

    runFrames();

    expect(activeWordIndex(words)).toBe("5");
    // previously active word is marked typed
    expect(
      words
        .querySelector(".word[data-wordindex='4']")
        ?.classList.contains("typed"),
    ).toBe(true);
    // words input moved down to the active word's line
    expect(parseFloat(input.style.top) - parseFloat(topBefore)).toBe(
      lineHeight,
    );
  });

  it("marks the previous word typed and a bad word as error on the next frame", () => {
    const { words } = mount();
    for (let i = 0; i < 3; i++) WordsRender.appendWord("word");
    WordsRender.setActiveWord(0);
    runFrames();

    TestUI.beforeTestWordChange("forward", false);
    increaseActiveWordIndex();
    void TestUI.afterTestWordChange("forward");

    const first = (): Element | null =>
      words.querySelector(".word[data-wordindex='0']");
    expect(first()?.classList.contains("error")).toBe(false);

    runFrames();

    expect(first()?.classList.contains("typed")).toBe(true);
    expect(first()?.classList.contains("error")).toBe(true);
    expect(activeWordIndex(words)).toBe("1");
  });

  it("removes the word left behind when going back in zen mode", () => {
    configTesting.replaceConfig({ mode: "zen", showAllLines: true });
    const { words } = mount();
    WordsRender.appendWord("");
    WordsRender.setActiveWord(0);
    runFrames();
    increaseActiveWordIndex();
    TestUI.appendEmptyWord();
    void TestUI.afterTestWordChange("forward");
    runFrames();
    expect(words.querySelectorAll(".word")).toHaveLength(2);

    resetActiveWordIndex();
    void TestUI.afterTestWordChange("back");
    expect(words.querySelectorAll(".word")).toHaveLength(2);

    runFrames();

    expect(words.querySelectorAll(".word")).toHaveLength(1);
    expect(activeWordIndex(words)).toBe("0");
  });

  describe("typo hints", () => {
    function hintsOf(words: HTMLElement, index: number): HTMLElement[] {
      const container = words.querySelector(
        `.word[data-wordindex='${index}'] > .hints`,
      );
      return [...(container?.children ?? [])] as HTMLElement[];
    }

    function mountWord(): HTMLElement {
      const { words } = mount();
      WordsRender.appendWord("word");
      WordsRender.setActiveWord(0);
      runFrames();
      return words;
    }

    function typeIntoActiveWord(input: string): void {
      currentInput = input;
      TestUI.afterTestDelete();
    }

    it("fills the word's hints container with the typed char only in the next frame", () => {
      configTesting.replaceConfig({ indicateTypos: "below" });
      const words = mountWord();

      typeIntoActiveWord("wx");

      expect(hintsOf(words, 0)).toHaveLength(0);

      runFrames();

      const hints = hintsOf(words, 0);
      expect(hints.map((hint) => hint.tagName.toLowerCase())).toEqual(["hint"]);
      expect(hints[0]?.textContent).toBe("x");
      expect(hints[0]?.dataset["charsIndex"]).toBe("1");
    });

    it("shows the expected char when indicating typos both ways", () => {
      configTesting.replaceConfig({ indicateTypos: "both" });
      const words = mountWord();

      typeIntoActiveWord("wx");
      runFrames();

      expect(hintsOf(words, 0).map((hint) => hint.textContent)).toEqual(["o"]);
    });

    it("keeps the hints container across letter re-renders and updates its hints", () => {
      configTesting.replaceConfig({ indicateTypos: "below" });
      const words = mountWord();
      const container = words.querySelector(".word > .hints");

      typeIntoActiveWord("wx");
      runFrames();
      typeIntoActiveWord("wxy");
      runFrames();

      expect(words.querySelector(".word > .hints")).toBe(container);
      expect(hintsOf(words, 0).map((hint) => hint.textContent)).toEqual([
        "x",
        "y",
      ]);

      typeIntoActiveWord("wo");
      runFrames();

      expect(words.querySelector(".word > .hints")).toBe(container);
      expect(hintsOf(words, 0)).toHaveLength(0);
    });

    it("adds no hints for extra letters or when typos are not indicated below", () => {
      configTesting.replaceConfig({ indicateTypos: "below" });
      const words = mountWord();
      typeIntoActiveWord("wordz");
      runFrames();
      expect(hintsOf(words, 0)).toHaveLength(0);

      configTesting.replaceConfig({ indicateTypos: "replace" });
      typeIntoActiveWord("wx");
      runFrames();
      expect(hintsOf(words, 0)).toHaveLength(0);
    });
  });
});
