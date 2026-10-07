import { registerInputElement } from "../input/input-element";
import { initInputListeners } from "../input/listeners";
import { ElementWithUtils } from "../utils/dom";
import * as Caret from "./caret";
import * as PaceCaret from "./pace-caret";
import { restart } from "./test-logic";
import * as TestUI from "./test-ui";

/**
 * Hands TestPage's elements to the vanilla test modules. Call on every mount;
 * everything bound here is undone when `signal` aborts. A remount restarts
 * the test, since the previously rendered words are gone.
 */
export function bindTestElements(
  refs: {
    words: HTMLElement;
    wordsWrapper: HTMLElement;
    caret: HTMLElement;
    paceCaret: HTMLElement;
    input: HTMLTextAreaElement;
  },
  signal: AbortSignal,
): void {
  // input first - the listeners and test-ui read it via getInputElement()
  registerInputElement(refs.input, signal);

  const words = new ElementWithUtils(refs.words);
  const wordsWrapper = new ElementWithUtils(refs.wordsWrapper);
  Caret.initElement({
    caret: new ElementWithUtils(refs.caret),
    words,
    wordsWrapper,
  });
  PaceCaret.initElement({
    caret: new ElementWithUtils(refs.paceCaret),
    words,
    wordsWrapper,
  });

  initInputListeners(signal);
  const isRemount = TestUI.init({ words, wordsWrapper }, signal);
  if (isRemount) void restart({ noAnim: true });
}
