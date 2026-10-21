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

// records which words get their joining broken
const joiningSet = vi.hoisted(() => vi.fn());
vi.mock("../../src/ts/test/break-joining", async (importOriginal) => ({
  ...(await importOriginal()),
  set: joiningSet,
}));
const caretUpdatePosition = vi.hoisted(() => vi.fn());
vi.mock("../../src/ts/test/caret", async (importOriginal) => ({
  ...(await importOriginal()),
  updatePosition: caretUpdatePosition,
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
import * as TestWords from "../../src/ts/test/test-words";
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

function childClasses(words: HTMLElement): string[] {
  return [...words.children].map((el) =>
    el.classList.contains("word")
      ? `word${(el as HTMLElement).dataset["wordindex"]}`
      : el.className,
  );
}

/** Goes to the next word and runs the words frame and its layout. */
async function goForward(): Promise<void> {
  increaseActiveWordIndex();
  void TestUI.afterTestWordChange("forward");
  runFrames();
  // layout (line jump, tape scroll) continues asynchronously
  await new Promise((resolve) => setTimeout(resolve, 0));
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
    joiningSet.mockClear();
    caretUpdatePosition.mockClear();
    // jsdom has no default font size, the words input is sized in rem
    document.documentElement.style.fontSize = "16px";
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    WordsRender.reset();
    TestWords.words.reset();
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
    WordsRender.reset({ zen: true });
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

  it("breaks the joining of every word passed within one frame", () => {
    const { words } = mount();
    for (let i = 0; i < 5; i++) WordsRender.appendWord("word");
    WordsRender.setActiveWord(0);
    runFrames();
    joiningSet.mockClear();

    for (let i = 0; i < 2; i++) {
      increaseActiveWordIndex();
      void TestUI.afterTestWordChange("forward");
    }
    runFrames();

    const brokenWords = joiningSet.mock.calls
      .filter(([, broken]) => broken === true)
      .map(([el]) => (el as ElementWithUtils).native.dataset["wordindex"]);
    expect(brokenWords).toEqual(["0", "1"]);
    expect(activeWordIndex(words)).toBe("2");
  });

  describe("restart", () => {
    beforeEach(() => {
      // jsdom lacks it, focusing the words scrolls them into view
      Element.prototype.scrollIntoView = vi.fn();
    });

    function startTest(count: number): void {
      TestWords.words.reset();
      for (let i = 0; i < count; i++) TestWords.words.push("word", 0);
      resetActiveWordIndex();
      TestUI.onTestRestart("testPage");
    }

    it("snaps the caret to the new words instead of animating", () => {
      mount();
      caretUpdatePosition.mockClear();

      startTest(10);

      expect(caretUpdatePosition).toHaveBeenCalledWith(true);
      expect(caretUpdatePosition).not.toHaveBeenCalledWith(false);
    });

    it("drops a line jump still animating when the test restarts", async () => {
      configTesting.replaceConfig({
        mode: "words",
        tapeMode: "off",
        showAllLines: false,
        smoothLineScroll: true,
      });
      const completions: (() => void)[] = [];
      const cancel = vi.fn();
      vi.spyOn(ElementWithUtils.prototype, "animate").mockImplementation(
        (params) => {
          completions.push(() => {
            params.onComplete?.({} as never, {} as never);
          });
          return { cancel } as never;
        },
      );
      const { words } = mount();
      startTest(20);

      // to the third line: starts the animated jump hiding the first line
      for (let i = 0; i < 10; i++) await goForward();
      expect(completions).toHaveLength(1);

      startTest(20);
      expect(cancel).toHaveBeenCalled();
      // the stale animation completes anyway
      for (const complete of completions) complete();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(childClasses(words)[0]).toBe("word0");
      expect(TestUI.isWordRendered(0)).toBe(true);
      expect(activeWordIndex(words)).toBe("0");
      expect(words.style.marginTop).toBe("0px");
    });
  });

  describe("overflow guard", () => {
    function mountTwoLetterWords(count: number): HTMLElement {
      const { words } = mount();
      for (let i = 0; i < count; i++) WordsRender.appendWord("ab");
      WordsRender.setActiveWord(0);
      runFrames();
      return words;
    }

    it("measures the active word itself while its word change isn't laid out", async () => {
      mountTwoLetterWords(10);
      // to the last word of the first line, laid out
      for (let i = 0; i < 4; i++) await goForward();
      expect(TestUI.wouldActiveWordOverflow("ab", "c")).toBe(false);

      // to the first word of the second line, same frame
      increaseActiveWordIndex();
      void TestUI.afterTestWordChange("forward");

      expect(TestUI.wouldActiveWordOverflow("ab", "c")).toBe(false);
    });

    it("blocks the extra letter while the active word isn't rendered yet", () => {
      mountTwoLetterWords(3);
      for (let i = 0; i < 3; i++) increaseActiveWordIndex();
      TestUI.addWord("ab");
      void TestUI.afterTestWordChange("forward");

      expect(TestUI.wouldActiveWordOverflow("ab", "c")).toBe(true);
    });
  });

  describe("removing passed words", () => {
    it("line jump stops rendering the hidden line, newline siblings included", async () => {
      configTesting.replaceConfig({
        mode: "words",
        tapeMode: "off",
        showAllLines: false,
        smoothLineScroll: false,
      });
      const { words } = mount();
      for (let i = 0; i < 15; i++) {
        WordsRender.appendWord(i === 4 ? "word\n" : "word");
      }
      WordsRender.setActiveWord(0);
      runFrames();

      // to the third line: the first line scrolls out of view
      for (let i = 0; i < 10; i++) await goForward();

      expect(childClasses(words).slice(0, 2)).toEqual(["word5", "word6"]);
      expect(TestUI.isWordRendered(4)).toBe(false);
      expect(TestUI.isWordRendered(5)).toBe(true);
    });

    it("line jump hides every passed line when several lines are crossed within one frame", async () => {
      configTesting.replaceConfig({
        mode: "words",
        tapeMode: "off",
        showAllLines: false,
        smoothLineScroll: false,
      });
      const { words } = mount();
      for (let i = 0; i < 20; i++) WordsRender.appendWord("word");
      WordsRender.setActiveWord(0);
      runFrames();

      await goForward();
      // first line to third line in a single frame
      for (let i = 0; i < 9; i++) {
        increaseActiveWordIndex();
        void TestUI.afterTestWordChange("forward");
      }
      runFrames();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(childClasses(words)[0]).toBe("word5");
      expect(activeWordIndex(words)).toBe("10");
    });

    describe("tape mode", () => {
      const wordWidth = 50;
      const wrapperWidth = 500;

      function fakeTapeLayout(wordsWrapper: HTMLElement): void {
        // a single row: words are laid out left to right after #words' margin
        vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(0);
        vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(
          function (this: HTMLElement) {
            const parent = this.parentElement;
            if (!this.classList.contains("word") || parent === null) return 0;
            const position = [
              ...parent.querySelectorAll(":scope > .word"),
            ].indexOf(this);
            return (
              (parseFloat(parent.style.marginLeft) || 0) + position * wordWidth
            );
          },
        );
        vi.spyOn(
          HTMLElement.prototype,
          "offsetWidth",
          "get",
        ).mockImplementation(function (this: HTMLElement) {
          // #words fills the wrapper
          if (this === wordsWrapper || this.parentElement === wordsWrapper) {
            return wrapperWidth;
          }
          return this.classList.contains("word") ? wordWidth : 0;
        });
        vi.spyOn(
          HTMLElement.prototype,
          "getBoundingClientRect",
        ).mockImplementation(function (this: HTMLElement) {
          const width = this.classList.contains("word") ? wordWidth : 0;
          return new DOMRect(0, 0, width, 0);
        });
        const getComputedStyle = window.getComputedStyle.bind(window);
        vi.spyOn(window, "getComputedStyle").mockImplementation((el) => ({
          ...getComputedStyle(el),
          marginLeft: "0px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
        }));
      }

      beforeEach(() => {
        configTesting.replaceConfig({
          mode: "words",
          tapeMode: "word",
          tapeMargin: 50,
          showAllLines: false,
          smoothLineScroll: false,
        });
      });

      it("stops rendering words scrolled off the left edge", async () => {
        const { words } = mount();
        fakeTapeLayout(words.parentElement as HTMLElement);
        for (let i = 0; i < 20; i++) WordsRender.appendWord("word");
        WordsRender.setActiveWord(0);
        runFrames();

        for (let i = 0; i < 10; i++) await goForward();

        // the previous scroll put word 9 at the tape margin (250px), so words
        // 0-2 ended up left of -50px
        expect(childClasses(words)[0]).toBe("word3");
        expect(TestUI.isWordRendered(2)).toBe(false);
        expect(TestUI.isWordRendered(3)).toBe(true);
        // removing words doesn't move the tape
        const active = words.querySelector<HTMLElement>(".word.active");
        expect(active?.offsetLeft).toBe(wrapperWidth / 2);
      });

      it("keeps a word ending a line rendered, so the line break stays, still removing overflown words after it", async () => {
        const { words } = mount();
        fakeTapeLayout(words.parentElement as HTMLElement);
        for (let i = 0; i < 20; i++) {
          WordsRender.appendWord(i === 2 ? "word\n" : "word");
        }
        WordsRender.setActiveWord(0);
        runFrames();

        // word 10 at the tape margin (250px) leaves words 0-3 left of -50px
        for (let i = 0; i < 11; i++) await goForward();

        expect(childClasses(words).slice(0, 5)).toEqual([
          "word2",
          "beforeNewline",
          "newline",
          "afterNewline",
          "word4",
        ]);
        expect(TestUI.isWordRendered(1)).toBe(false);
        expect(TestUI.isWordRendered(2)).toBe(true);
        expect(TestUI.isWordRendered(3)).toBe(false);
      });
    });
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

    it("leaves the hints container alone while there are no hints to add or clear", () => {
      configTesting.replaceConfig({ indicateTypos: "off" });
      const words = mountWord();
      const setHtml = vi.spyOn(ElementWithUtils.prototype, "setHtml");

      typeIntoActiveWord("wx");
      runFrames();

      expect(setHtml).not.toHaveBeenCalled();
      expect(hintsOf(words, 0)).toHaveLength(0);
    });

    it("clears the hints once typos are no longer indicated below", () => {
      configTesting.replaceConfig({ indicateTypos: "below" });
      const words = mountWord();
      typeIntoActiveWord("wx");
      runFrames();
      expect(hintsOf(words, 0)).toHaveLength(1);

      configTesting.replaceConfig({ indicateTypos: "off" });
      typeIntoActiveWord("wxy");
      runFrames();

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
