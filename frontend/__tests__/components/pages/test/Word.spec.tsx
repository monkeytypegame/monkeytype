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

      expect(registry.getWord(0)).toBe(container.querySelector(".word"));
      expect(registry.getLetters(0)).toEqual(renderedLetters(container));
      expect(registry.getLetters(0)).toHaveLength(3);
    });

    it("follows extra letters and backspace", () => {
      appendRenderedWord({ display: "ab" });
      flush();
      const { registry, container } = renderWord();

      setWordInput(0, "abcd");
      flush();
      expect(registry.getLetters(0)).toHaveLength(4);
      expect(registry.getLetters(0)).toEqual(renderedLetters(container));

      setWordInput(0, "a");
      flush();
      expect(registry.getLetters(0)).toHaveLength(2);
      expect(registry.getLetters(0)).toEqual(renderedLetters(container));
    });

    it("follows the input in zen", () => {
      replaceWords([], { activeWordIndex: 0, zen: true });
      appendRenderedWord({ display: "" });
      flush();
      const { registry, container } = renderWord();

      setWordInput(0, "hey");
      flush();
      expect(registry.getLetters(0)).toHaveLength(3);
      expect(registry.getLetters(0)).toEqual(renderedLetters(container));

      setWordInput(0, "h");
      flush();
      expect(registry.getLetters(0)).toEqual(renderedLetters(container));
    });

    it("unregisters when unmounted", () => {
      appendRenderedWord({ display: "abc" });
      flush();
      const { registry, container } = renderWord();
      expect(registry.getLetters(0)).toHaveLength(3);

      resetWordsRender();
      flush();
      expect(container.querySelector(".word")).toBeNull();
      expect(registry.getLetters(0)).toBeUndefined();
      expect(registry.getLetters(0)).toBeUndefined();
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
      });
      paceCaret.goTo({
        wordIndex: 0,
        wordEl: registry.getWord(0),
        letters: registry.getLetters(0),
        letterIndex: 0,
        testDirection: "ltr",
      });
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
