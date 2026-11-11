import "../../../__harness__/mock-static";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LETTER_SELECTOR } from "../../../../src/ts/components/pages/test/selectors";
import { setConfigStore } from "../../../../src/ts/config/store";
import { getDefaultConfig } from "../../../../src/ts/constants/default-config";
import {
  setIsLanguageRightToLeft,
  setJoiningScript,
  setTestFocusState,
} from "../../../../src/ts/states/test";
import {
  appendRenderedWord,
  firstMountedIndex,
  replaceWords,
  resetWordsRender,
  setActiveWord,
  setFirstRenderedLine,
  setFirstRenderedWordIndex,
  onWordsFlushed,
  setWordTyped,
  setWordInput,
  truncateWords,
  wordsRenderState,
} from "../../../../src/ts/states/words-render";
import { renderWords } from "../../../__harness__/render-words";

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function flush(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const cb of pending) cb(0);
}

function wordEls(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(".word")];
}

/** sorted class names per letter */
function letterClasses(word: HTMLElement | undefined): string[] {
  return [...(word?.querySelectorAll(LETTER_SELECTOR) ?? [])].map((l) =>
    [...l.classList].sort().join(" "),
  );
}

/** sorted icon classes per letter, "" for letters without an icon */
function letterIcons(word: HTMLElement | undefined): string[] {
  return [...(word?.querySelectorAll(LETTER_SELECTOR) ?? [])].map((l) =>
    [...(l.querySelector("i")?.classList ?? [])].sort().join(" "),
  );
}

function letterTexts(word: HTMLElement | undefined): string[] {
  return [...(word?.querySelectorAll(LETTER_SELECTOR) ?? [])].map(
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
  setConfigStore("highlightMode", defaults.highlightMode);
  setConfigStore("flipTestColors", defaults.flipTestColors);
  setConfigStore("colorfulMode", defaults.colorfulMode);
  setConfigStore("showOutOfFocusWarning", defaults.showOutOfFocusWarning);
  setTestFocusState("focused");
  setJoiningScript(false);
  setIsLanguageRightToLeft(false);
  resetWordsRender();
  frames.clear();
  vi.unstubAllGlobals();
});

describe("Words", () => {
  describe("out of focus", () => {
    it("blurs the words, transitioning only opacity and filter", () => {
      // layout measures font size and margins right after changing them (eg.
      // font size from the commandline, which unfocuses the test): they must
      // never transition
      vi.useFakeTimers();
      try {
        setConfigStore("showOutOfFocusWarning", true);
        const words = renderWords();
        expect(words.style.transition).toBe("none");

        setTestFocusState("unfocused");
        // the warning shows after a delay
        vi.advanceTimersByTime(1000);

        expect(words.classList.contains("blurred")).toBe(true);
        expect(words.style.transition).toBe("opacity 0.25s, filter 0.25s");
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it("renders appended words with letters after flush", () => {
    const container = renderWords();
    appendRenderedWord({ display: "hello" });
    appendRenderedWord({ display: "world" });
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
      appendRenderedWord({ display: "hello" });
      setWordInput(0, "he");
      setActiveWord(0);

      expect(wordEls(container)).toHaveLength(0);
    });

    it("coalesces multiple writes into one frame", () => {
      const container = renderWords();
      appendRenderedWord({ display: "hello" });
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

    it("runs the onWordsFlushed hook once per flush, after the DOM is updated", () => {
      const container = renderWords();
      const seen: (string | undefined)[] = [];
      const hook = vi.fn(() => {
        seen.push(
          container.querySelector<HTMLElement>(".word.active")?.dataset[
            "wordindex"
          ],
        );
      });
      const unsetHook = onWordsFlushed(hook);
      appendRenderedWord({ display: "a" });
      appendRenderedWord({ display: "b" });
      setActiveWord(1);
      setWordInput(1, "b");

      expect(hook).not.toHaveBeenCalled();
      flush();
      expect(hook).toHaveBeenCalledTimes(1);
      expect(seen).toEqual(["1"]);
      unsetHook();
    });
  });

  describe("letters", () => {
    function renderWord(
      text: string,
      input: string,
      composition = "",
    ): HTMLElement | undefined {
      const container = renderWords();
      appendRenderedWord({ display: text });
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
      appendRenderedWord({ display: "abc" });
      flush();
      const before = [
        ...(wordEls(container)[0]?.querySelectorAll(LETTER_SELECTOR) ?? []),
      ];
      setWordInput(0, "ab");
      flush();
      const after = [
        ...(wordEls(container)[0]?.querySelectorAll(LETTER_SELECTOR) ?? []),
      ];
      expect(after).toEqual(before);
      expect(after.every((l, i) => l === before[i])).toBe(true);
    });
  });

  describe("theme attributes", () => {
    function attrs(el: Element | null | undefined): Record<string, string> {
      return Object.fromEntries(
        [...(el?.attributes ?? [])]
          .filter((attr) => attr.name.startsWith("data-ui-"))
          .map((attr) => [attr.name, attr.value]),
      );
    }

    it("marks words with their status and the active one", () => {
      const container = renderWords();
      appendRenderedWord({ display: "ab" });
      appendRenderedWord({ display: "cd" });
      appendRenderedWord({ display: "ef" });
      appendRenderedWord({ display: "gh" });
      setWordInput(0, "ab");
      setWordTyped(0, true);
      setWordInput(1, "cx");
      setWordTyped(1, true);
      setActiveWord(2);
      flush();

      expect(wordEls(container).map(attrs)).toEqual([
        { "data-ui-element": "word", "data-ui-state": "typed" },
        { "data-ui-element": "word", "data-ui-state": "typedIncorrectly" },
        {
          "data-ui-element": "word",
          "data-ui-state": "untyped",
          "data-ui-active": "",
        },
        { "data-ui-element": "word", "data-ui-state": "untyped" },
      ]);
    });

    it("marks letters with their status and tab/newline variant", () => {
      const container = renderWords();
      appendRenderedWord({ display: "a\tb\n" });
      setWordInput(0, "x");
      flush();

      expect(
        [
          ...(wordEls(container)[0]?.querySelectorAll(LETTER_SELECTOR) ?? []),
        ].map(attrs),
      ).toEqual([
        { "data-ui-element": "letter", "data-ui-state": "incorrect" },
        {
          "data-ui-element": "letter",
          "data-ui-state": "untyped",
          "data-ui-variant": "tab",
        },
        { "data-ui-element": "letter", "data-ui-state": "untyped" },
        {
          "data-ui-element": "letter",
          "data-ui-state": "untyped",
          "data-ui-variant": "newline",
        },
      ]);
    });

    it("exposes the words modes as attributes", () => {
      setConfigStore("highlightMode", "next_two_words");
      setConfigStore("blindMode", true);
      setConfigStore("flipTestColors", true);
      setConfigStore("colorfulMode", true);
      setJoiningScript(true);
      setIsLanguageRightToLeft(true);
      const container = renderWords();

      expect(attrs(container)).toEqual({
        "data-ui-element": "words",
        "data-ui-word-highlight": "next-two-words",
        "data-ui-blind": "",
        "data-ui-flipped": "",
        "data-ui-colorful": "",
        "data-ui-joining-script": "",
        "data-ui-rtl": "",
      });
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
      appendRenderedWord({ display: "a\n" });
      appendRenderedWord({ display: "b" });
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
      appendRenderedWord({ display: "a" });
      flush();
      const hints = wordEls(container)[0]?.querySelector(".hints");
      expect(hints).not.toBeNull();
      expect(hints?.childNodes).toHaveLength(0);
    });

    it("does not render lines below the first rendered line, line breaks included", () => {
      const container = renderWords();
      appendRenderedWord({ display: "a\n" });
      appendRenderedWord({ display: "b\n" });
      appendRenderedWord({ display: "c" });
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
      appendRenderedWord({ display: "a" });
      appendRenderedWord({ display: "b\n" });
      appendRenderedWord({ display: "c" });
      flush();
      setFirstRenderedWordIndex(2);
      flush();
      expect(childClasses(container)).toEqual([
        "beforeNewline",
        "newline",
        "afterNewline",
        "word2",
      ]);
    });

    it("tracks words ending a line: from the text, in zen from the input", () => {
      appendRenderedWord({ display: "a" });
      appendRenderedWord({ display: "b\n" });
      flush();
      expect(wordsRenderState.words.map((w) => w.endsLine)).toEqual([
        false,
        true,
      ]);

      replaceWords([], { activeWordIndex: 0, zen: true });
      appendRenderedWord({ display: "" });
      setWordInput(0, "a");
      flush();
      expect(wordsRenderState.words[0]?.endsLine).toBe(false);
      setWordInput(0, "a\n");
      flush();
      expect(wordsRenderState.words[0]?.endsLine).toBe(true);
    });

    it("mounts from the first rendered word until a word ends a line", () => {
      appendRenderedWord({ display: "a" });
      appendRenderedWord({ display: "b" });
      flush();
      setFirstRenderedWordIndex(1);
      expect(firstMountedIndex()).toBe(1);
      expect(wordsRenderState.keepsLineBreaks).toBe(false);

      appendRenderedWord({ display: "c\n" });
      appendRenderedWord({ display: "d" });
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
      replaceWords([], { activeWordIndex: 0, zen: true });
      const container = renderWords();
      appendRenderedWord({ display: "" });
      appendRenderedWord({ display: "" });
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
      appendRenderedWord({ display: "a" });
      appendRenderedWord({ display: "b" });
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
      appendRenderedWord({ display: "ab" });
      appendRenderedWord({ display: "cd\n" });
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
      appendRenderedWord({ display: "ab" });
      setWordInput(0, "ax");
      setWordTyped(0, true);
      flush();
      expect(wordEls(container)[0]?.classList.contains("error")).toBe(true);
    });

    it("does not mark error words in zen", () => {
      replaceWords([], { activeWordIndex: 0, zen: true });
      const container = renderWords();
      appendRenderedWord({ display: "" });
      setWordInput(0, "ax");
      setWordTyped(0, true);
      flush();
      expect(wordEls(container)[0]?.classList.contains("error")).toBe(false);
    });

    it("keeps true letter classes in blind mode (blind CSS hides mistakes)", () => {
      setConfigStore("blindMode", true);
      const container = renderWords();
      appendRenderedWord({ display: "abc" });
      setWordInput(0, "xb");
      setWordTyped(0, true);
      flush();
      expect(letterClasses(wordEls(container)[0])).toEqual([
        "incorrect",
        "correct",
        "",
      ]);
    });

    it("lays out each word in its own direction", () => {
      const container = renderWords();
      appendRenderedWord({ display: "שלום", direction: "rtl" });
      appendRenderedWord({ display: "abc", direction: "ltr" });
      flush();
      const [rtl, ltr] = wordEls(container);
      expect(rtl?.getAttribute("dir")).toBe("rtl");
      expect(ltr?.getAttribute("dir")).toBe("ltr");
      expect(rtl?.classList.contains("[unicode-bidi:bidi-override]")).toBe(
        true,
      );
      expect(ltr?.classList.contains("[unicode-bidi:bidi-override]")).toBe(
        true,
      );
    });

    it("carries the direction through replaceWords", () => {
      replaceWords([{ display: "שלום", direction: "rtl" }], {
        activeWordIndex: 0,
      });
      const container = renderWords();
      expect(wordEls(container)[0]?.getAttribute("dir")).toBe("rtl");
    });

    it("leaves zen words to the test direction", () => {
      replaceWords([{ display: "" }], { activeWordIndex: 0, zen: true });
      const container = renderWords();
      const word = wordEls(container)[0];
      expect(word?.hasAttribute("dir")).toBe(false);
      expect(word?.classList.contains("[unicode-bidi:bidi-override]")).toBe(
        false,
      );
    });
  });

  describe("zen", () => {
    beforeEach(() => {
      replaceWords([], { activeWordIndex: 0, zen: true });
    });

    it("keeps zen letters when the mode changes before the restart", () => {
      setConfigStore("mode", "zen");
      const container = renderWords();
      appendRenderedWord({ display: "" });
      flush();

      setConfigStore("mode", "words");

      const word = wordEls(container)[0];
      expect(letterTexts(word)).toEqual(["_"]);
      expect(letterClasses(word)).toEqual(["invisible"]);
    });

    it("shows an invisible placeholder for an empty word", () => {
      const container = renderWords();
      appendRenderedWord({ display: "" });
      flush();
      const word = wordEls(container)[0];
      expect(letterClasses(word)).toEqual(["invisible"]);
      expect(letterTexts(word)).toEqual(["_"]);
    });

    it("shows typed letters as correct and composition as dead", () => {
      const container = renderWords();
      appendRenderedWord({ display: "" });
      setWordInput(0, "ab", "c");
      flush();
      const word = wordEls(container)[0];
      expect(letterClasses(word)).toEqual(["correct", "correct", "dead"]);
      expect(letterTexts(word)).toEqual(["a", "b", "c"]);
    });

    it("keeps typed arrows visible", () => {
      const container = renderWords();
      appendRenderedWord({ display: "" });
      setWordInput(0, "←");
      flush();
      expect(letterClasses(wordEls(container)[0])).toEqual(["correct"]);
    });

    it("renders typed newlines invisibly, followed by newline siblings", () => {
      const container = renderWords();
      appendRenderedWord({ display: "" });
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
      appendRenderedWord({ display: "" });
      setWordInput(0, "a");
      appendRenderedWord({ display: "" });
      appendRenderedWord({ display: "" });
      flush();
      expect(wordEls(container)).toHaveLength(3);

      truncateWords(1);
      flush();
      expect(wordEls(container)).toHaveLength(1);
      expect(letterTexts(wordEls(container)[0])).toEqual(["a"]);
    });

    it("truncates words appended in the same frame", () => {
      const container = renderWords();
      appendRenderedWord({ display: "" });
      flush();
      appendRenderedWord({ display: "" });
      appendRenderedWord({ display: "" });
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
      appendRenderedWord({ display: "a" });
      setFirstRenderedWordIndex(0);
      flush();
      resetWordsRender();
      expect(container.children).toHaveLength(0);
    });

    it("cancels a pending flush", () => {
      const container = renderWords();
      const hook = vi.fn();
      const unsetHook = onWordsFlushed(hook);
      appendRenderedWord({ display: "a" });
      resetWordsRender();
      flush();
      expect(container.children).toHaveLength(0);
      expect(hook).not.toHaveBeenCalled();
      unsetHook();
    });

    it("renders new words from index 0 after replacing them", () => {
      const container = renderWords();
      appendRenderedWord({ display: "a" });
      appendRenderedWord({ display: "b" });
      setFirstRenderedWordIndex(1);
      setActiveWord(1);
      flush();
      replaceWords([{ display: "c" }], { activeWordIndex: 0 });
      const words = wordEls(container);
      expect(words).toHaveLength(1);
      expect(words[0]?.dataset["wordindex"]).toBe("0");
      expect(words[0]?.classList.contains("active")).toBe(true);
      expect(letterTexts(words[0])).toEqual(["c"]);
    });
  });

  describe("replaceWords", () => {
    it("renders now and runs the onWordsFlushed hook for new words", () => {
      const container = renderWords();
      const hook = vi.fn(() => {
        expect(wordEls(container)).toHaveLength(2);
      });
      const unsetHook = onWordsFlushed(hook);
      replaceWords([{ display: "a" }, { display: "b" }], {
        activeWordIndex: 1,
      });
      expect(hook).toHaveBeenCalledExactlyOnceWith({
        newWords: true,
        wordChange: undefined,
        updatedWords: [],
      });
      expect(wordEls(container)[1]?.classList.contains("active")).toBe(true);
      unsetHook();
    });

    it("drops a pending flush of the old words", () => {
      const container = renderWords();
      appendRenderedWord({ display: "a" });
      setWordInput(0, "x");
      replaceWords([{ display: "b" }], { activeWordIndex: 0 });
      flush();
      const words = wordEls(container);
      expect(words).toHaveLength(1);
      expect(letterTexts(words[0])).toEqual(["b"]);
      expect(wordsRenderState.words[0]?.input).toBe("");
    });

    it("keeps line breaks when a word ends a line", () => {
      replaceWords([{ display: "a\n" }, { display: "b" }], {
        activeWordIndex: 0,
      });
      expect(wordsRenderState.keepsLineBreaks).toBe(true);
      replaceWords([{ display: "a\n" }], { activeWordIndex: 0, zen: true });
      expect(wordsRenderState.keepsLineBreaks).toBe(false);
    });
  });
});
