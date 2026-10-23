import { render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// test state (via Words) fetches keyboard layouts on load
vi.mock("../../../../src/ts/utils/json-data", async (importOriginal) => ({
  ...(await importOriginal()),
  getLayout: vi.fn(async () => new Promise(() => undefined)),
}));

import { Words } from "../../../../src/ts/components/pages/test/Words";
import { setConfigStore } from "../../../../src/ts/config/store";
import { getDefaultConfig } from "../../../../src/ts/constants/default-config";
import {
  getLineBreakElements,
  getWordElement,
} from "../../../../src/ts/states/word-elements";
import {
  appendRenderedWord,
  firstMountedIndex,
  resetWordsRender,
  setActiveWord,
  setFirstRenderedLine,
  setFirstRenderedWordIndex,
  setLayoutHook,
  setWordTyped,
  setWordInput,
  truncateWords,
  wordsRenderState,
} from "../../../../src/ts/states/words-render";

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function flush(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const cb of pending) cb(0);
}

function renderWords(): HTMLElement {
  // #words
  const container = render(() => <Words />).container
    .firstElementChild as HTMLElement;
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
  setConfigStore("blindMode", defaults.blindMode);
  resetWordsRender();
  frames.clear();
  vi.unstubAllGlobals();
});

describe("Words", () => {
  it("renders appended words with letters after flush", () => {
    const container = renderWords();
    appendRenderedWord("hello");
    appendRenderedWord("world");
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
      appendRenderedWord("hello");
      setWordInput(0, "he");
      setActiveWord(0);

      expect(wordEls(container)).toHaveLength(0);
    });

    it("coalesces multiple writes into one frame", () => {
      const container = renderWords();
      appendRenderedWord("hello");
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
      appendRenderedWord("a");
      appendRenderedWord("b");
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
      appendRenderedWord(text);
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
      // the marker class follows the shown char, not the target
      expect(letterClasses(word)).toEqual(["incorrect", "incorrect"]);
    });

    it("reuses letter nodes when input changes", () => {
      const container = renderWords();
      appendRenderedWord("abc");
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
      appendRenderedWord("a\n");
      appendRenderedWord("b");
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
      appendRenderedWord("a");
      flush();
      const hints = wordEls(container)[0]?.querySelector(".hints");
      expect(hints).not.toBeNull();
      expect(hints?.childNodes).toHaveLength(0);
    });

    it("registers rendered word elements by index", () => {
      const container = renderWords();
      appendRenderedWord("a");
      appendRenderedWord("b");
      flush();
      expect(getWordElement(1)).toBe(wordEls(container)[1]);

      setFirstRenderedWordIndex(1);
      expect(getWordElement(0)).toBeUndefined();
      expect(getWordElement(1)).toBe(wordEls(container)[0]);

      resetWordsRender();
      expect(getWordElement(1)).toBeUndefined();
    });

    it("registers line break elements by the index of the word ending the line", () => {
      const container = renderWords();
      appendRenderedWord("a\n");
      appendRenderedWord("b\n");
      appendRenderedWord("c");
      flush();
      expect(getLineBreakElements(1)).toEqual({
        before: container.querySelectorAll(".beforeNewline")[1],
        after: container.querySelectorAll(".afterNewline")[1],
      });
      expect(getLineBreakElements(2)).toBeUndefined();

      setFirstRenderedLine(1);
      expect(getLineBreakElements(0)).toBeUndefined();
      expect(getLineBreakElements(1)?.after).toBe(
        container.querySelector(".afterNewline"),
      );

      resetWordsRender();
      expect(getLineBreakElements(1)).toBeUndefined();
    });

    it("does not render lines below the first rendered line, line breaks included", () => {
      const container = renderWords();
      appendRenderedWord("a\n");
      appendRenderedWord("b\n");
      appendRenderedWord("c");
      flush();
      setFirstRenderedLine(1);
      flush();
      expect(childClasses(container)).toEqual([
        "word1",
        "beforeNewline",
        "newline",
        "afterNewline",
        "word2",
      ]);
    });

    it("keeps the line breaks of words below the first rendered word index", () => {
      const container = renderWords();
      appendRenderedWord("a");
      appendRenderedWord("b\n");
      appendRenderedWord("c");
      flush();
      setFirstRenderedWordIndex(2);
      flush();
      expect(childClasses(container)).toEqual([
        "beforeNewline",
        "newline",
        "afterNewline",
        "word2",
      ]);
      expect(getWordElement(1)).toBeUndefined();
    });

    it("tracks words ending a line: from the text, in zen from the input", () => {
      appendRenderedWord("a");
      appendRenderedWord("b\n");
      flush();
      expect(wordsRenderState.words.map((w) => w.endsLine)).toEqual([
        false,
        true,
      ]);

      resetWordsRender({ zen: true });
      appendRenderedWord("");
      setWordInput(0, "a");
      flush();
      expect(wordsRenderState.words[0]?.endsLine).toBe(false);
      setWordInput(0, "a\n");
      flush();
      expect(wordsRenderState.words[0]?.endsLine).toBe(true);
    });

    it("mounts from the first rendered word until a word ends a line", () => {
      appendRenderedWord("a");
      appendRenderedWord("b");
      flush();
      setFirstRenderedWordIndex(1);
      expect(firstMountedIndex()).toBe(1);
      expect(wordsRenderState.keepsLineBreaks).toBe(false);

      appendRenderedWord("c\n");
      appendRenderedWord("d");
      flush();
      expect(wordsRenderState.keepsLineBreaks).toBe(true);
      setFirstRenderedWordIndex(3);
      // line breaks of hidden words are kept, from the last line jump on
      expect(firstMountedIndex()).toBe(0);
      setFirstRenderedLine(3);
      expect(firstMountedIndex()).toBe(3);

      resetWordsRender();
      expect(wordsRenderState.keepsLineBreaks).toBe(false);
    });

    it("keeps the line breaks of typed newlines below the first rendered word index in zen", () => {
      resetWordsRender({ zen: true });
      const container = renderWords();
      appendRenderedWord("");
      appendRenderedWord("");
      setWordInput(0, "a\n");
      setWordInput(1, "b");
      flush();
      setFirstRenderedWordIndex(1);
      flush();
      expect(childClasses(container)).toEqual([
        "beforeNewline",
        "newline",
        "afterNewline",
        "word1",
      ]);
    });
  });

  describe("flags", () => {
    it("marks the active word", () => {
      const container = renderWords();
      appendRenderedWord("a");
      appendRenderedWord("b");
      setActiveWord(0);
      flush();
      setActiveWord(1);
      flush();
      const [first, second] = wordEls(container);
      expect(first?.classList.contains("active")).toBe(false);
      expect(second?.classList.contains("active")).toBe(true);
    });

    it("marks typed words, as error when the input differs from the word", () => {
      const container = renderWords();
      appendRenderedWord("ab");
      appendRenderedWord("cd\n");
      setWordInput(0, "ax");
      setWordInput(1, "cd\n");
      setWordTyped(0, true);
      setWordTyped(1, true);
      flush();
      const [first, second] = wordEls(container);
      expect(first?.classList.contains("typed")).toBe(true);
      expect(first?.classList.contains("error")).toBe(true);
      expect(second?.classList.contains("typed")).toBe(true);
      expect(second?.classList.contains("error")).toBe(false);

      setWordInput(0, "ab");
      flush();
      expect(first?.classList.contains("error")).toBe(false);

      // going back into a word: no longer typed, no error
      setWordInput(0, "ax");
      setWordTyped(0, false);
      flush();
      expect(first?.classList.contains("typed")).toBe(false);
      expect(first?.classList.contains("error")).toBe(false);
    });

    it("marks error words in blind mode too (blind CSS hides them)", () => {
      setConfigStore("blindMode", true);
      const container = renderWords();
      appendRenderedWord("ab");
      setWordInput(0, "ax");
      setWordTyped(0, true);
      flush();
      expect(wordEls(container)[0]?.classList.contains("error")).toBe(true);
    });

    it("does not mark error words in zen", () => {
      resetWordsRender({ zen: true });
      const container = renderWords();
      appendRenderedWord("");
      setWordInput(0, "ax");
      setWordTyped(0, true);
      flush();
      expect(wordEls(container)[0]?.classList.contains("error")).toBe(false);
    });

    it("keeps true letter classes in blind mode (blind CSS hides mistakes)", () => {
      setConfigStore("blindMode", true);
      const container = renderWords();
      appendRenderedWord("abc");
      setWordInput(0, "xb");
      setWordTyped(0, true);
      flush();
      expect(letterClasses(wordEls(container)[0])).toEqual([
        "incorrect",
        "correct",
        "",
      ]);
    });

    it("marks fully right-to-left words when enabled", () => {
      resetWordsRender({ marksRtlWords: true });
      const container = renderWords();
      appendRenderedWord("שלום");
      appendRenderedWord("שלוםabc");
      appendRenderedWord("abc");
      flush();
      expect(
        wordEls(container).map((w) => w.classList.contains("wordRtl")),
      ).toEqual([true, false, false]);
    });

    it("does not mark right-to-left words when disabled", () => {
      resetWordsRender({ marksRtlWords: false });
      const container = renderWords();
      appendRenderedWord("שלום");
      flush();
      expect(wordEls(container)[0]?.classList.contains("wordRtl")).toBe(false);
    });

    it("keeps imperatively added classes and styles across re-renders", () => {
      const container = renderWords();
      appendRenderedWord("abc");
      setActiveWord(0);
      flush();
      const word = wordEls(container)[0] as HTMLElement;
      word.classList.add("broken-joining", "needs-wrap");
      word.style.width = "10px";

      setWordInput(0, "ab");
      setWordTyped(0, true);
      setActiveWord(1);
      flush();

      expect(wordEls(container)[0]).toBe(word);
      expect(word.classList.contains("broken-joining")).toBe(true);
      expect(word.classList.contains("needs-wrap")).toBe(true);
      expect(word.style.width).toBe("10px");
    });
  });

  describe("zen", () => {
    beforeEach(() => {
      resetWordsRender({ zen: true });
    });

    it("keeps zen letters when the mode changes before the restart", () => {
      setConfigStore("mode", "zen");
      const container = renderWords();
      appendRenderedWord("");
      flush();

      setConfigStore("mode", "words");

      const word = wordEls(container)[0];
      expect(letterTexts(word)).toEqual(["_"]);
      expect(letterClasses(word)).toEqual(["invisible"]);
    });

    it("shows an invisible placeholder for an empty word", () => {
      const container = renderWords();
      appendRenderedWord("");
      flush();
      const word = wordEls(container)[0];
      expect(letterClasses(word)).toEqual(["invisible"]);
      expect(letterTexts(word)).toEqual(["_"]);
    });

    it("shows typed letters as correct and composition as dead", () => {
      const container = renderWords();
      appendRenderedWord("");
      setWordInput(0, "ab", "c");
      flush();
      const word = wordEls(container)[0];
      expect(letterClasses(word)).toEqual(["correct", "correct", "dead"]);
      expect(letterTexts(word)).toEqual(["a", "b", "c"]);
    });

    it("keeps typed arrows visible", () => {
      const container = renderWords();
      appendRenderedWord("");
      setWordInput(0, "←");
      flush();
      expect(letterClasses(wordEls(container)[0])).toEqual(["correct"]);
    });

    it("renders typed newlines invisibly, followed by newline siblings", () => {
      const container = renderWords();
      appendRenderedWord("");
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
      appendRenderedWord("");
      setWordInput(0, "a");
      appendRenderedWord("");
      appendRenderedWord("");
      flush();
      expect(wordEls(container)).toHaveLength(3);

      truncateWords(1);
      flush();
      expect(wordEls(container)).toHaveLength(1);
      expect(letterTexts(wordEls(container)[0])).toEqual(["a"]);
    });

    it("truncates words appended in the same frame", () => {
      const container = renderWords();
      appendRenderedWord("");
      flush();
      appendRenderedWord("");
      appendRenderedWord("");
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
      appendRenderedWord("a");
      setFirstRenderedWordIndex(0);
      flush();
      resetWordsRender();
      expect(container.children).toHaveLength(0);
    });

    it("cancels a pending flush", () => {
      const container = renderWords();
      const hook = vi.fn();
      setLayoutHook(hook);
      appendRenderedWord("a");
      resetWordsRender();
      flush();
      expect(container.children).toHaveLength(0);
      expect(hook).not.toHaveBeenCalled();
      setLayoutHook(undefined);
    });

    it("renders new words from index 0 after reset", () => {
      const container = renderWords();
      appendRenderedWord("a");
      appendRenderedWord("b");
      setFirstRenderedWordIndex(1);
      setActiveWord(1);
      flush();
      resetWordsRender();
      appendRenderedWord("c");
      flush();
      const words = wordEls(container);
      expect(words).toHaveLength(1);
      expect(words[0]?.dataset["wordindex"]).toBe("0");
      expect(words[0]?.classList.contains("active")).toBe(true);
      expect(letterTexts(words[0])).toEqual(["c"]);
    });
  });
});
