import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// opens indexedDB on import, which jsdom lacks
vi.mock("../../src/ts/controllers/theme-controller", () => ({
  randomizeTheme: vi.fn(),
}));

import { __testing as configTesting } from "../../src/ts/config/testing";
import {
  registerWordElement,
  unregisterWordElement,
} from "../../src/ts/states/word-elements";
import {
  createWordsLayout,
  WordsLayout,
} from "../../src/ts/components/pages/test/words-layout";

// jsdom has no layout: words get a fake one, 5 per line
const wordsPerLine = 5;
const wordHeight = 30;
const wordMargin = 2; // top and bottom
const lineHeight = wordHeight + wordMargin * 2;

function isWord(el: HTMLElement): boolean {
  return el.classList.contains("word");
}

function fakeLayout(): void {
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(
    function (this: HTMLElement) {
      if (!isWord(this)) return 0;
      const index = Number(this.dataset["wordindex"]);
      // below the word's top margin, like in the browser
      return wordMargin + Math.floor(index / wordsPerLine) * lineHeight;
    },
  );
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      return isWord(this) ? wordHeight : 0;
    },
  );
  const getComputedStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
    const style = getComputedStyle(el);
    if (!(el instanceof HTMLElement) || !isWord(el)) return style;
    return {
      ...style,
      marginTop: `${wordMargin}px`,
      marginBottom: `${wordMargin}px`,
    };
  });
}

/** Renders #wordsWrapper > #words with `count` words, and their layout. */
function renderWords(count: number): {
  wordsWrapper: HTMLElement;
  layout: WordsLayout;
} {
  const wordsWrapper = document.createElement("div");
  const words = document.createElement("div");
  for (let i = 0; i < count; i++) {
    words.insertAdjacentHTML(
      "beforeend",
      `<div class="word" data-wordindex="${i}"><letter>a</letter></div>`,
    );
    registerWordElement(i, words.lastElementChild as HTMLElement);
  }
  wordsWrapper.append(words);
  document.body.append(wordsWrapper);

  const layout = createWordsLayout({
    words: () => words,
    wordsWrapper: () => wordsWrapper,
    onActiveWordLaidOut: () => undefined,
  });
  cleanups.push(() => {
    layout.reset();
    for (const el of words.children) {
      unregisterWordElement(
        Number((el as HTMLElement).dataset["wordindex"]),
        el as HTMLElement,
      );
    }
    wordsWrapper.remove();
  });
  return { wordsWrapper, layout };
}

const cleanups: Array<() => void> = [];

describe("words wrapper height", () => {
  beforeEach(() => {
    fakeLayout();
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    vi.restoreAllMocks();
    configTesting.replaceConfig({});
  });

  it("shows three lines in a timed test", () => {
    configTesting.replaceConfig({ mode: "time", tapeMode: "off" });
    // 10 lines of words
    const { wordsWrapper, layout } = renderWords(wordsPerLine * 10);

    layout.relayout();

    expect(wordsWrapper.style.height).toBe(`${lineHeight * 3}px`);
  });

  it("shows three lines in a timed test with show all lines on", () => {
    configTesting.replaceConfig({
      mode: "time",
      tapeMode: "off",
      showAllLines: true,
    });
    const { wordsWrapper, layout } = renderWords(wordsPerLine * 10);

    layout.relayout();

    expect(wordsWrapper.style.height).toBe(`${lineHeight * 3}px`);
  });

  it("keeps three lines' height when the words fill fewer lines", () => {
    configTesting.replaceConfig({ mode: "words", tapeMode: "off" });
    // one line of words
    const { wordsWrapper, layout } = renderWords(wordsPerLine);

    layout.relayout();

    expect(wordsWrapper.style.height).toBe(`${lineHeight * 3}px`);
  });
});
