import "../../../__harness__/mock-static";
import { render } from "@solidjs/testing-library";
import { Show } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Caret,
  isCaretDebug,
  toggleCaretDebug,
} from "../../../../src/ts/components/pages/test/caret";
import { Word } from "../../../../src/ts/components/pages/test/Word";
import {
  createWordRegistry,
  type WordRegistry,
} from "../../../../src/ts/components/pages/test/word-registry";
import {
  appendRenderedWord,
  replaceWords,
  resetWordsRender,
  setWordInput,
  wordsRenderState,
} from "../../../../src/ts/states/words-render";

// tests check the rendered DOM itself, not the registry's refs, so they
// query letters directly (spec Q33 exempts tests)
const LETTER_SELECTOR = '[data-ui-element="letter"]';

let frames: Map<number, FrameRequestCallback>;

function flush(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const cb of pending) cb(0);
}

/** Renders word 0 on its own, registering it in a fresh registry. */
function renderWord(): { registry: WordRegistry; container: HTMLElement } {
  const registry = createWordRegistry();
  const { container } = render(() => (
    <Show when={wordsRenderState.words[0]}>
      {(word) => (
        <Word
          word={word()}
          isActive={() => true}
          register={registry.registerWord}
        />
      )}
    </Show>
  ));
  return { registry, container };
}

/** Word 0's letters as the registry hands them out, undefined if unregistered. */
function registeredLetters(registry: WordRegistry): Element[] | undefined {
  const word = registry.getWord(0);
  if (word === undefined) return undefined;
  return Array.from({ length: word.getLetterCount() }, (_, i) =>
    word.getLetter(i),
  ).filter((l) => l !== undefined);
}

function renderedLetters(container: HTMLElement): Element[] {
  return [...container.querySelectorAll(`.word > ${LETTER_SELECTOR}`)];
}

beforeEach(() => {
  frames = new Map();
  let nextFrameId = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});

afterEach(() => {
  if (isCaretDebug()) toggleCaretDebug();
  resetWordsRender();
  frames.clear();
  vi.unstubAllGlobals();
});

describe("Word", () => {
  describe("letter refs", () => {
    it("registers its rendered letters in order", () => {
      appendRenderedWord({ display: "abc" });
      flush();
      const { registry, container } = renderWord();

      expect(registry.getWord(0)?.el).toBe(container.querySelector(".word"));
      expect(registeredLetters(registry)).toEqual(renderedLetters(container));
      expect(registeredLetters(registry)).toHaveLength(3);
    });

    it("follows extra letters and backspace", () => {
      appendRenderedWord({ display: "ab" });
      flush();
      const { registry, container } = renderWord();

      setWordInput(0, "abcd");
      flush();
      expect(registeredLetters(registry)).toHaveLength(4);
      expect(registeredLetters(registry)).toEqual(renderedLetters(container));

      setWordInput(0, "a");
      flush();
      expect(registeredLetters(registry)).toHaveLength(2);
      expect(registeredLetters(registry)).toEqual(renderedLetters(container));
    });

    it("follows the input in zen", () => {
      replaceWords([], { activeWordIndex: 0, zen: true });
      appendRenderedWord({ display: "" });
      flush();
      const { registry, container } = renderWord();

      setWordInput(0, "hey");
      flush();
      expect(registeredLetters(registry)).toHaveLength(3);
      expect(registeredLetters(registry)).toEqual(renderedLetters(container));

      setWordInput(0, "h");
      flush();
      expect(registeredLetters(registry)).toEqual(renderedLetters(container));
    });

    it("unregisters when unmounted", () => {
      appendRenderedWord({ display: "abc" });
      flush();
      const { registry, container } = renderWord();
      expect(registeredLetters(registry)).toHaveLength(3);

      resetWordsRender();
      flush();
      expect(container.querySelector(".word")).toBeNull();
      expect(registry.getWord(0)).toBeUndefined();
    });
  });

  describe("caret debug", () => {
    it("outlines the letters and marks the pace caret's target", () => {
      appendRenderedWord({ display: "abc" });
      flush();
      const { registry, container } = renderWord();
      const letters = renderedLetters(container);

      toggleCaretDebug();
      expect(letters.every((l) => l.classList.contains("debugCaret"))).toBe(
        true,
      );

      const wordsWrapper = document.createElement("div");
      const paceCaret = new Caret(document.createElement("div"), {
        isMainCaret: false,
        style: () => "default",
        wordsWrapper: () => wordsWrapper,
        wordRegistry: registry,
      });
      paceCaret.goTo({ wordIndex: 0, letterIndex: 0, testDirection: "ltr" });
      expect(letters[0]?.classList.contains("debugCaretTarget")).toBe(true);
      expect(letters[1]?.classList.contains("debugCaretTarget")).toBe(false);

      toggleCaretDebug();
      for (const l of letters) {
        expect(l.classList.contains("debugCaret")).toBe(false);
        expect(l.classList.contains("debugCaretTarget")).toBe(false);
      }
    });
  });
});
