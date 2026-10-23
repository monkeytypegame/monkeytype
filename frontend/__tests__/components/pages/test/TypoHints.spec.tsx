import "../../../__harness__/mock-static";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setConfigStore } from "../../../../src/ts/config/store";
import { getDefaultConfig } from "../../../../src/ts/constants/default-config";
import {
  appendRenderedWord,
  invalidateTypoHintsLayout,
  resetWordsRender,
  setActiveWord,
  setWordInput,
} from "../../../../src/ts/states/words-render";
import { renderWords } from "../../../__harness__/render-words";

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function flush(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const cb of pending) cb(0);
}

// jsdom has no layout: letters are 10px wide in one line, hints `hintWidth`
let hintWidth = 6;

function fakeLayout(): void {
  const indexInParent = (el: HTMLElement): number =>
    [...(el.parentElement?.children ?? [])].indexOf(el);
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.tagName === "LETTER" ? indexInParent(this) * 10 : 0;
    },
  );
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      if (this.tagName === "LETTER") return 10;
      if (this.tagName === "HINT") return hintWidth;
      return 0;
    },
  );
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(0);
}

function renderWord(text: string): HTMLElement {
  const container = renderWords();
  appendRenderedWord(text);
  setActiveWord(0);
  flush();
  return container;
}

function hintsOf(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(".word > .hints > hint")];
}

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
  hintWidth = 6;
  fakeLayout();
});

afterEach(() => {
  const defaults = getDefaultConfig();
  setConfigStore("indicateTypos", defaults.indicateTypos);
  resetWordsRender();
  frames.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TypoHints", () => {
  it("shows the typed char under a mistyped letter in the next frame", () => {
    setConfigStore("indicateTypos", "below");
    const container = renderWord("word");

    setWordInput(0, "wx");
    expect(hintsOf(container)).toHaveLength(0);

    flush();
    const hints = hintsOf(container);
    expect(hints.map((hint) => hint.textContent)).toEqual(["x"]);
    expect(hints[0]?.style.left).toBe("15px");
  });

  it("merges overlapping hints of adjacent letters into one", () => {
    setConfigStore("indicateTypos", "below");
    hintWidth = 12;
    const container = renderWord("word");

    setWordInput(0, "wxy");
    flush();

    const hints = hintsOf(container);
    expect(hints.map((hint) => hint.textContent)).toEqual(["xy"]);
    expect(hints[0]?.style.left).toBe("20px");
  });

  it("keeps the hints container and updates its hints as the input changes", () => {
    setConfigStore("indicateTypos", "below");
    const container = renderWord("word");
    const hintsContainer = container.querySelector(".word > .hints");

    setWordInput(0, "wxy");
    flush();
    expect(hintsOf(container).map((hint) => hint.textContent)).toEqual([
      "x",
      "y",
    ]);

    setWordInput(0, "wo");
    flush();
    expect(container.querySelector(".word > .hints")).toBe(hintsContainer);
    expect(hintsOf(container)).toHaveLength(0);
  });

  it("re-measures when the typo hints layout is invalidated", () => {
    setConfigStore("indicateTypos", "below");
    const container = renderWord("word");
    setWordInput(0, "wxy");
    flush();
    expect(hintsOf(container)).toHaveLength(2);

    // eg. a bigger font
    hintWidth = 12;
    invalidateTypoHintsLayout();

    expect(hintsOf(container).map((hint) => hint.textContent)).toEqual(["xy"]);
  });

  it("follows the indicate typos setting", () => {
    setConfigStore("indicateTypos", "below");
    const container = renderWord("word");
    setWordInput(0, "wx");
    flush();

    setConfigStore("indicateTypos", "both");
    expect(hintsOf(container).map((hint) => hint.textContent)).toEqual(["o"]);

    setConfigStore("indicateTypos", "off");
    expect(hintsOf(container)).toHaveLength(0);
  });

  it("shows no hints in zen", () => {
    setConfigStore("indicateTypos", "below");
    resetWordsRender({ zen: true });
    const container = renderWord("");
    setWordInput(0, "abc");
    flush();
    expect(hintsOf(container)).toHaveLength(0);
  });
});
