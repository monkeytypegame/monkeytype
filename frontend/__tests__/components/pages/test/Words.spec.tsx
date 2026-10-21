import { render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getWordElement } from "../../../../src/ts/components/pages/test/word-elements";
import { Words } from "../../../../src/ts/components/pages/test/Words";
import { setConfigStore } from "../../../../src/ts/config/store";
import { getDefaultConfig } from "../../../../src/ts/constants/default-config";
import {
  appendWord,
  reset,
  setActiveWord,
  setFirstRenderedWordIndex,
  setLayoutHook,
  setWordFlags,
  setWordInput,
  truncateWords,
} from "../../../../src/ts/states/words-render";

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function flush(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const cb of pending) cb(0);
}

function renderWords(): HTMLElement {
  const { container } = render(() => <Words />);
  return container;
}

function wordEls(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(".word")];
}

/** sorted class names per letter */
function letterClasses(word: HTMLElement | undefined): string[] {
  return [...(word?.querySelectorAll("letter") ?? [])].map((l) =>
    [...l.classList].sort().join(" "),
  );
}

/** sorted icon classes per letter, "" for letters without an icon */
function letterIcons(word: HTMLElement | undefined): string[] {
  return [...(word?.querySelectorAll("letter") ?? [])].map((l) =>
    [...(l.querySelector("i")?.classList ?? [])].sort().join(" "),
  );
}

function letterTexts(word: HTMLElement | undefined): string[] {
  return [...(word?.querySelectorAll("letter") ?? [])].map(
    (l) => l.textContent ?? "",
  );
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
});

afterEach(() => {
  const defaults = getDefaultConfig();
  setConfigStore("mode", defaults.mode);
  setConfigStore("indicateTypos", defaults.indicateTypos);
  setConfigStore("compositionDisplay", defaults.compositionDisplay);
  reset();
  frames.clear();
  vi.unstubAllGlobals();
});

describe("Words", () => {
  it("renders appended words with letters after flush", () => {
    const container = renderWords();
    appendWord("hello");
    appendWord("world");
    flush();

    const words = wordEls(container);
    expect(words).toHaveLength(2);
    expect(words[0]?.dataset["wordindex"]).toBe("0");
    expect(words[1]?.dataset["wordindex"]).toBe("1");
    expect(letterTexts(words[0])).toEqual(["h", "e", "l", "l", "o"]);
    expect(letterClasses(words[1])).toEqual(["", "", "", "", ""]);
  });

  describe("flush", () => {
    it("renders nothing before the frame runs", () => {
      const container = renderWords();
      appendWord("hello");
      setWordInput(0, "he");
      setActiveWord(0);

      expect(wordEls(container)).toHaveLength(0);
    });

    it("coalesces multiple writes into one frame", () => {
      const container = renderWords();
      appendWord("hello");
      setWordInput(0, "h");
      setWordInput(0, "he");
      setActiveWord(0);

      expect(frames.size).toBe(1);
      flush();
      expect(letterClasses(wordEls(container)[0])).toEqual([
        "correct",
        "correct",
        "",
        "",
        "",
      ]);
    });

    it("runs the layout hook once per flush, after the DOM is updated", () => {
      const container = renderWords();
      const seen: (string | undefined)[] = [];
      const hook = vi.fn(() => {
        seen.push(
          container.querySelector<HTMLElement>(".word.active")?.dataset[
            "wordindex"
          ],
        );
      });
      setLayoutHook(hook);
      appendWord("a");
      appendWord("b");
      setActiveWord(1);
      setWordInput(1, "b");

      expect(hook).not.toHaveBeenCalled();
      flush();
      expect(hook).toHaveBeenCalledTimes(1);
      expect(seen).toEqual(["1"]);
      setLayoutHook(undefined);
    });
  });

  describe("letters", () => {
    function renderWord(
      text: string,
      input: string,
      composition = "",
    ): HTMLElement | undefined {
      const container = renderWords();
      appendWord(text);
      setWordInput(0, input, composition);
      flush();
      return wordEls(container)[0];
    }

    it("marks correct, incorrect and extra letters", () => {
      const word = renderWord("abc", "axcde");
      expect(letterClasses(word)).toEqual([
        "correct",
        "incorrect",
        "correct",
        "extra incorrect",
        "extra incorrect",
      ]);
      // incorrect shows the expected letter, extra shows the typed one
      expect(letterTexts(word)).toEqual(["a", "b", "c", "d", "e"]);
    });

    it("shows extra spaces as underscores", () => {
      const word = renderWord("a", "a ");
      expect(letterTexts(word)).toEqual(["a", "_"]);
    });

    it("shows the typed letter for typos with indicate typos replace", () => {
      setConfigStore("indicateTypos", "replace");
      const word = renderWord("abc", "ax ");
      expect(letterClasses(word)).toEqual([
        "correct",
        "incorrect",
        "incorrect",
      ]);
      expect(letterTexts(word)).toEqual(["a", "x", "_"]);
    });

    it("shows composition as dead letters", () => {
      setConfigStore("compositionDisplay", "off");
      const word = renderWord("abcd", "a", "bx");
      expect(letterClasses(word)).toEqual([
        "correct",
        "correct dead",
        "dead",
        "",
      ]);
      expect(letterTexts(word)).toEqual(["a", "b", "c", "d"]);
    });

    it("shows composition characters with composition display replace", () => {
      setConfigStore("compositionDisplay", "replace");
      const word = renderWord("abcd", "a", "x ");
      expect(letterTexts(word)).toEqual(["a", "x", "_", "d"]);
    });

    it("marks tab and newline letters", () => {
      const word = renderWord("a\tb\n", "a\tx");
      expect(letterClasses(word)).toEqual([
        "correct",
        "correct tabChar",
        "incorrect",
        "nlChar",
      ]);
    });

    it("renders tab and newline letters as icons", () => {
      const word = renderWord("a\tb\n", "a\t");
      expect(letterIcons(word)).toEqual([
        "",
        "fa-fw fa-long-arrow-alt-right fas",
        "",
        "fa-fw fa-level-down-alt fa-rotate-90 fas",
      ]);
    });

    it("renders arrow characters as arrow icons", () => {
      const word = renderWord("↑↓←→", "↑←");
      expect(letterIcons(word)).toEqual([
        "fa-arrow-up fas",
        "fa-arrow-down fas",
        "fa-arrow-left fas",
        "fa-arrow-right fas",
      ]);
      expect(letterClasses(word)).toEqual(["correct", "incorrect", "", ""]);
    });

    it("shows the typed letter instead of an icon with indicate typos replace", () => {
      setConfigStore("indicateTypos", "replace");
      const word = renderWord("↑\t", "xy");
      expect(letterIcons(word)).toEqual(["", ""]);
      expect(letterTexts(word)).toEqual(["x", "y"]);
      expect(letterClasses(word)).toEqual(["incorrect", "incorrect tabChar"]);
    });

    it("reuses letter nodes when input changes", () => {
      const container = renderWords();
      appendWord("abc");
      flush();
      const before = [
        ...(wordEls(container)[0]?.querySelectorAll("letter") ?? []),
      ];
      setWordInput(0, "ab");
      flush();
      const after = [
        ...(wordEls(container)[0]?.querySelectorAll("letter") ?? []),
      ];
      expect(after).toEqual(before);
      expect(after.every((l, i) => l === before[i])).toBe(true);
    });
  });

  describe("structure", () => {
    function childClasses(container: HTMLElement): string[] {
      return [...container.children].map((el) =>
        el.classList.contains("word")
          ? `word${(el as HTMLElement).dataset["wordindex"]}`
          : el.className,
      );
    }

    it("follows words containing a newline with newline siblings", () => {
      const container = renderWords();
      appendWord("a\n");
      appendWord("b");
      flush();
      expect(childClasses(container)).toEqual([
        "word0",
        "beforeNewline",
        "newline",
        "afterNewline",
        "word1",
      ]);
    });

    it("renders each word with an empty hints container", () => {
      const container = renderWords();
      appendWord("a");
      flush();
      const hints = wordEls(container)[0]?.querySelector(".hints");
      expect(hints).not.toBeNull();
      expect(hints?.childNodes).toHaveLength(0);
    });

    it("registers rendered word elements by index", () => {
      const container = renderWords();
      appendWord("a");
      appendWord("b");
      flush();
      expect(getWordElement(1)).toBe(wordEls(container)[1]);

      setFirstRenderedWordIndex(1);
      expect(getWordElement(0)).toBeUndefined();
      expect(getWordElement(1)).toBe(wordEls(container)[0]);

      reset();
      expect(getWordElement(1)).toBeUndefined();
    });

    it("does not render words below the first rendered index", () => {
      const container = renderWords();
      appendWord("a\n");
      appendWord("b\n");
      appendWord("c");
      flush();
      setFirstRenderedWordIndex(1);
      flush();
      expect(childClasses(container)).toEqual([
        "word1",
        "beforeNewline",
        "newline",
        "afterNewline",
        "word2",
      ]);
    });
  });

  describe("flags", () => {
    it("marks the active word", () => {
      const container = renderWords();
      appendWord("a");
      appendWord("b");
      setActiveWord(0);
      flush();
      setActiveWord(1);
      flush();
      const [first, second] = wordEls(container);
      expect(first?.classList.contains("active")).toBe(false);
      expect(second?.classList.contains("active")).toBe(true);
    });

    it("marks typed and error words", () => {
      const container = renderWords();
      appendWord("a");
      setWordFlags(0, { isTyped: true });
      setWordFlags(0, { isIncorrect: true });
      flush();
      const word = wordEls(container)[0];
      expect(word?.classList.contains("typed")).toBe(true);
      expect(word?.classList.contains("error")).toBe(true);
      setWordFlags(0, { isIncorrect: false });
      flush();
      expect(word?.classList.contains("error")).toBe(false);
      expect(word?.classList.contains("typed")).toBe(true);
    });

    it("shows all letters as correct for allCorrect words", () => {
      const container = renderWords();
      appendWord("abc");
      setWordInput(0, "xb");
      setWordFlags(0, { allCorrect: true });
      flush();
      expect(letterClasses(wordEls(container)[0])).toEqual([
        "correct incorrect",
        "correct",
        "correct",
      ]);
    });

    it("keeps imperatively added classes and styles across re-renders", () => {
      const container = renderWords();
      appendWord("abc");
      setActiveWord(0);
      flush();
      const word = wordEls(container)[0] as HTMLElement;
      word.classList.add("broken-joining", "wordRtl");
      word.style.width = "10px";

      setWordInput(0, "ab");
      setWordFlags(0, { isTyped: true, isIncorrect: true });
      setActiveWord(1);
      flush();

      expect(wordEls(container)[0]).toBe(word);
      expect(word.classList.contains("broken-joining")).toBe(true);
      expect(word.classList.contains("wordRtl")).toBe(true);
      expect(word.style.width).toBe("10px");
    });
  });

  describe("zen", () => {
    beforeEach(() => {
      reset({ zen: true });
    });

    it("keeps zen letters when the mode changes before the restart", () => {
      setConfigStore("mode", "zen");
      const container = renderWords();
      appendWord("");
      flush();

      setConfigStore("mode", "words");

      const word = wordEls(container)[0];
      expect(letterTexts(word)).toEqual(["_"]);
      expect(letterClasses(word)).toEqual(["invisible"]);
    });

    it("shows an invisible placeholder for an empty word", () => {
      const container = renderWords();
      appendWord("");
      flush();
      const word = wordEls(container)[0];
      expect(letterClasses(word)).toEqual(["invisible"]);
      expect(letterTexts(word)).toEqual(["_"]);
    });

    it("shows typed letters as correct and composition as dead", () => {
      const container = renderWords();
      appendWord("");
      setWordInput(0, "ab", "c");
      flush();
      const word = wordEls(container)[0];
      expect(letterClasses(word)).toEqual(["correct", "correct", "dead"]);
      expect(letterTexts(word)).toEqual(["a", "b", "c"]);
    });

    it("renders typed newlines invisibly, followed by newline siblings", () => {
      const container = renderWords();
      appendWord("");
      setWordInput(0, "a\n");
      flush();
      expect(letterClasses(wordEls(container)[0])).toEqual([
        "correct",
        "correct invisible nlChar",
      ]);
      expect(container.querySelectorAll(".newline")).toHaveLength(1);
    });

    it("appends and truncates words", () => {
      const container = renderWords();
      appendWord("");
      setWordInput(0, "a");
      appendWord("");
      appendWord("");
      flush();
      expect(wordEls(container)).toHaveLength(3);

      truncateWords(1);
      flush();
      expect(wordEls(container)).toHaveLength(1);
      expect(letterTexts(wordEls(container)[0])).toEqual(["a"]);
    });

    it("truncates words appended in the same frame", () => {
      const container = renderWords();
      appendWord("");
      flush();
      appendWord("");
      appendWord("");
      truncateWords(2);
      flush();
      expect(wordEls(container).map((w) => w.dataset["wordindex"])).toEqual([
        "0",
        "1",
      ]);
    });
  });

  describe("reset", () => {
    it("clears all words", () => {
      const container = renderWords();
      appendWord("a");
      setFirstRenderedWordIndex(0);
      flush();
      reset();
      expect(container.children).toHaveLength(0);
    });

    it("cancels a pending flush", () => {
      const container = renderWords();
      const hook = vi.fn();
      setLayoutHook(hook);
      appendWord("a");
      reset();
      flush();
      expect(container.children).toHaveLength(0);
      expect(hook).not.toHaveBeenCalled();
      setLayoutHook(undefined);
    });

    it("renders new words from index 0 after reset", () => {
      const container = renderWords();
      appendWord("a");
      appendWord("b");
      setFirstRenderedWordIndex(1);
      setActiveWord(1);
      flush();
      reset();
      appendWord("c");
      flush();
      const words = wordEls(container);
      expect(words).toHaveLength(1);
      expect(words[0]?.dataset["wordindex"]).toBe("0");
      expect(words[0]?.classList.contains("active")).toBe(true);
      expect(letterTexts(words[0])).toEqual(["c"]);
    });
  });
});
