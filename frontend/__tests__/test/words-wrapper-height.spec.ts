import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// opens indexedDB on import, which jsdom lacks
vi.mock("../../src/ts/controllers/theme-controller", () => ({
  randomizeTheme: vi.fn(),
}));

import { __testing as configTesting } from "../../src/ts/config/testing";
import {
  registerWordElement,
  unregisterWordElement,
} from "../../src/ts/states/words-render";
import * as TestUI from "../../src/ts/test/test-ui";
import { ElementWithUtils } from "../../src/ts/utils/dom";

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

/** Renders #typingTest > #wordsWrapper > #words with `count` words. */
function renderWords(count: number): HTMLElement {
  const typingTest = document.createElement("div");
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
  typingTest.append(wordsWrapper);
  document.body.append(typingTest);

  const controller = new AbortController();
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
      for (const el of words.children) {
        unregisterWordElement(
          Number((el as HTMLElement).dataset["wordindex"]),
          el as HTMLElement,
        );
      }
      typingTest.remove();
    });
  });
  return wordsWrapper;
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
    const wordsWrapper = renderWords(wordsPerLine * 10);

    TestUI.__testing.updateWordsWrapperHeight(true);

    expect(wordsWrapper.style.height).toBe(`${lineHeight * 3}px`);
  });

  it("shows three lines in a timed test with show all lines on", () => {
    configTesting.replaceConfig({
      mode: "time",
      tapeMode: "off",
      showAllLines: true,
    });
    const wordsWrapper = renderWords(wordsPerLine * 10);

    TestUI.__testing.updateWordsWrapperHeight(true);

    expect(wordsWrapper.style.height).toBe(`${lineHeight * 3}px`);
  });

  it("keeps three lines' height when the words fill fewer lines", () => {
    configTesting.replaceConfig({ mode: "words", tapeMode: "off" });
    // one line of words
    const wordsWrapper = renderWords(wordsPerLine);

    TestUI.__testing.updateWordsWrapperHeight(true);

    expect(wordsWrapper.style.height).toBe(`${lineHeight * 3}px`);
  });
});
