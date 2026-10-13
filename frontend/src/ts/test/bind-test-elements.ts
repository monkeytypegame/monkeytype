import { updateFooterAndVerticalAds } from "../controllers/ad-controller";
import { registerInputElement } from "../input/input-element";
import { initInputListeners } from "../input/listeners";
import { listenForModifierKeys } from "../states/modifiers";
import { listenForMonkeyKeys } from "../states/monkey";
import { resetIncompleteTests } from "../states/test";
import { ElementWithUtils } from "../utils/dom";
import * as Caret from "./caret";
import * as Funbox from "./funbox/funbox";
import * as PaceCaret from "./pace-caret";
import { restart, restartOnRefocus } from "./test-logic";
import * as TestUI from "./test-ui";

/**
 * Brings the test page to life: hands TestPage's elements to the vanilla test
 * modules and sets up page-wide state. Call on every mount; everything done
 * here is undone when `signal` aborts. Mounting starts a fresh test, since any
 * previously rendered words are gone.
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
  Caret.initElement(
    {
      caret: new ElementWithUtils(refs.caret),
      words,
      wordsWrapper,
    },
    signal,
  );
  PaceCaret.initElement(
    {
      caret: new ElementWithUtils(refs.paceCaret),
      words,
      wordsWrapper,
    },
    signal,
  );

  initInputListeners(signal);
  TestUI.init({ words, wordsWrapper }, signal);
  restartOnRefocus(signal);
  listenForModifierKeys(signal);
  listenForMonkeyKeys(signal);
  void restart({ noAnim: true });

  updateFooterAndVerticalAds(false);
  resetIncompleteTests();
  // registered last so it runs after the modules above have unbound
  signal.addEventListener("abort", () => {
    void Funbox.clear();
    updateFooterAndVerticalAds(true);
  });
}
