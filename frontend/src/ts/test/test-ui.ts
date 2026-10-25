import { isOnline, showOfflineBanner } from "../states/connection";
import { Config, getConfig } from "../config/store";
import * as TestWords from "./test-words";
import { getCurrentInput } from "./events/data";
import { getLiveCachedAccuracy } from "./events/live-cache";
import * as Caret from "./caret";
import * as Misc from "../utils/misc";
import * as ResultWordHighlight from "../components/pages/test/result/result-word-highlight";
import { debounce, throttle } from "throttle-debounce";
import { ModifierKeys } from "../constants/modifier-keys";
import { isDevEnvironment } from "../utils/env";
import { convertRemToPixels } from "../utils/numbers";
import * as PaceCaret from "./pace-caret";
import * as SoundController from "../controllers/sound-controller";
import * as Numbers from "@monkeytype/util/numbers";
import {
  blurInputElement,
  focusInputElement,
  getInputElement,
  isInputElementFocused,
} from "../input/input-element";
import * as MonkeyPower from "../elements/monkey-power";
import * as AdController from "../controllers/ad-controller";
import * as ThemeController from "../controllers/theme-controller";
import { ElementWithUtils } from "../utils/dom";
import { getFontPreview } from "../states/font";
import { getWordElement as getRenderedWordElement } from "../states/word-elements";
import {
  appendRenderedWord,
  flushWordsRender,
  resetWordsRender,
  setActiveWord,
  setLayoutHook,
  setWordTyped,
  setWordInput,
  truncateWords,
  invalidateTypoHintsLayout,
} from "../states/words-render";
import { skipBreakdownEvent } from "../states/header";
import {
  isDirectionReversed,
  isLanguageRightToLeft,
  isRtlCheckedByLetter,
  getActiveWordIndex,
  isTestActive,
  setCurrentLiveStats,
  setTestFocusState,
  isTestFinished,
  setLayoutfluidTimerVisible,
  setTestInitError,
  setTestInitFailed,
  setTypingTestHidden,
  getCompositionData,
  highlightKeymapKey,
  setWordsInputPosition,
  setFocusMode,
} from "../states/test";
import { createEffect, on, untrack } from "solid-js";
import type {
  WordChange,
  WordsLayout,
} from "../components/pages/test/words-layout";
import { setResultShown } from "../states/result";
import { isTestPageMounted, markTestPageMounted } from "./test-page-state";

// rendered by TestPage, registered via init() on every mount
let wordsLayoutRef: WordsLayout | undefined;
let wordsWrapperRef: ElementWithUtils | undefined;
let typingTestRef: ElementWithUtils | undefined;
// rendered by TestResult, registered while it's mounted
let resultRef: ElementWithUtils | undefined;

export function setResultElement(el: ElementWithUtils | undefined): void {
  resultRef = el;
}

/** Whether TestPage is mounted. Not reactive. */
export function isMounted(): boolean {
  return untrack(isTestPageMounted);
}

function wordsLayout(): WordsLayout {
  if (wordsLayoutRef === undefined) throw new Error("#words not mounted");
  return wordsLayoutRef;
}

function wordsWrapperEl(): ElementWithUtils {
  if (wordsWrapperRef === undefined) {
    throw new Error("#wordsWrapper not mounted");
  }
  return wordsWrapperRef;
}

function typingTestEl(): ElementWithUtils {
  if (typingTestRef === undefined) throw new Error("#typingTest not mounted");
  return typingTestRef;
}

export function focusWords(force = false): void {
  if (force) {
    blurInputElement();
  }
  focusInputElement(true);
  if (isTestActive()) {
    keepWordsInputInTheCenter(true);
  } else {
    Misc.scrollToCenterOrTop(typingTestEl().native);
  }
}

export function keepWordsInputInTheCenter(force = false): void {
  if (!isMounted()) return;
  const wordsInput = getInputElement();

  const wordsWrapperHeight = wordsWrapperEl().getOffsetHeight();
  const windowHeight = window.innerHeight;

  // dont do anything if the wrapper can fit on screen
  if (wordsWrapperHeight < windowHeight) return;

  const wordsInputRect = wordsInput.getBoundingClientRect();
  const wordsInputBelowCenter = wordsInputRect.top > windowHeight / 2;

  // dont do anything if its above or at the center unless forced
  if (!wordsInputBelowCenter && !force) return;

  wordsInput.scrollIntoView({
    block: "center",
  });
}

function getWordElement(index: number): ElementWithUtils | null {
  const el = getRenderedWordElement(index);
  return el === undefined ? null : new ElementWithUtils(el);
}

function getActiveWordElement(): ElementWithUtils | null {
  return getWordElement(getActiveWordIndex());
}

// what the next words frame has to lay out. Plain state written on the input
// path; consumed by layoutWords once the DOM reflects the render store
let pendingWordChange: WordChange | undefined;
const pendingUpdatedWords = new Set<number>();
// restart flush: the caret snaps to the new words instead of animating there
let snapCaretInNextLayout = false;

function clearPendingLayout(): void {
  pendingWordChange = undefined;
  pendingUpdatedWords.clear();
}

/** Layout step of the shared words frame, runs after the DOM is updated. */
function layoutWords(): void {
  const wordChange = pendingWordChange;
  const updatedWords = [...pendingUpdatedWords];
  const snapCaret = snapCaretInNextLayout;
  snapCaretInNextLayout = false;
  clearPendingLayout();
  if (!isMounted()) return;
  wordsLayout().layout({ wordChange, updatedWords, snapCaret });
}

// measures #words, so it has to run after Words applied the config classes
function updateLayout(): void {
  // lay out unblurred, the out of focus state is restored below
  setTestFocusState("focused");

  wordsLayout().relayout();
  updateWordsInputPosition();

  if (!isInputElementFocused()) {
    setTestFocusState("unfocused");
  }
}

function showWords(): void {
  wordsLayout().reset();
  resetWordsRender({
    zen: Config.mode === "zen",
    marksRtlWords: !isRtlCheckedByLetter() && !isDirectionReversed(),
  });
  clearPendingLayout();

  if (Config.mode === "zen") {
    appendRenderedWord("");
  } else {
    for (let i = 0; i < TestWords.words.length; i++) {
      const word = TestWords.words.get(i);
      if (word === undefined) continue; // won't happen, but ts complains
      appendRenderedWord(word.display);
    }
  }
  setActiveWord(getActiveWordIndex());
  // not on the input path: render now, the layout below measures the words
  snapCaretInNextLayout = true;
  flushWordsRender();

  updateLayout();
  wordsLayout().layout({
    wordChange: "initial",
    updatedWords: [],
    snapCaret: true,
  });
  PaceCaret.resetCaretPosition();
}

export function updateWordsInputPosition(): void {
  if (!isMounted()) return;
  const isTestRightToLeft = isDirectionReversed()
    ? !isLanguageRightToLeft()
    : isLanguageRightToLeft();

  const el = getInputElement();

  const activeWord = getActiveWordElement();

  if (!activeWord) {
    setWordsInputPosition((position) => ({ ...position, top: 0, left: 0 }));
    return;
  }

  const letterHeight = convertRemToPixels(Config.fontSize);
  const top =
    activeWord.getOffsetTop() + letterHeight / 2 - el.offsetHeight / 2 + 1; //+1 for half of border

  const maxWidth =
    Config.tapeMode !== "off" ? 100 - Config.tapeMargin : undefined;
  const width = Math.max(activeWord.getOffsetWidth(), letterHeight);

  let left: number;
  if (Config.tapeMode !== "off") {
    left = wordsWrapperEl().getOffsetWidth() * (Config.tapeMargin / 100);
  } else if (activeWord.getOffsetWidth() < letterHeight && isTestRightToLeft) {
    left = activeWord.getOffsetLeft() - letterHeight;
  } else {
    left = Math.max(0, activeWord.getOffsetLeft());
  }

  // WordsInput keeps it in the center once applied
  setWordsInputPosition({ top, left, width, maxWidth });
}

// buffered, rendered in the next words frame
function updateWordLetters({
  wordIndex,
  input,
  compositionData,
}: {
  wordIndex: number;
  input: string;
  compositionData: string;
}): void {
  setWordInput(wordIndex, input, compositionData);
  pendingUpdatedWords.add(wordIndex);
}

/**
 * Whether appending `data` to the active word would push it onto the next line
 * or wrap its letters. Expensive - causes layout reflows.
 */
export function wouldActiveWordOverflow(
  inputValue: string,
  data: string,
): boolean {
  // not mounted: nothing to type into, block
  if (wordsLayoutRef === undefined) return true;
  return wordsLayoutRef.wouldActiveWordOverflow(inputValue, data);
}

// this means input, delete or composition
function afterAnyTestInput(
  type: "textInput" | "delete" | "compositionUpdate",
  correctInput: boolean | null,
): void {
  if (type === "textInput" || type === "compositionUpdate") {
    if (
      correctInput === true ||
      Config.playSoundOnError === "off" ||
      Config.blindMode
    ) {
      void SoundController.playClick();
    } else {
      void SoundController.playError();
    }
  } else if (type === "delete") {
    void SoundController.playClick();
  }

  const acc = Numbers.roundTo2(getLiveCachedAccuracy());
  if (!isNaN(acc)) {
    setCurrentLiveStats({ acc });
  }

  if (Config.keymapMode === "next") {
    const keyToHighlight =
      TestWords.words.getCurrent()?.textWithCommit[getCurrentInput().length];
    if (keyToHighlight !== undefined) {
      highlightKeymapKey(keyToHighlight);
    }
  }

  setFocusMode(true);
  Caret.stopAnimation();
}

export function afterTestTextInput(
  correct: boolean,
  inputOverride?: string,
  goingToNextWord = false,
): void {
  void MonkeyPower.addPower(correct);

  let input = inputOverride ?? getCurrentInput();
  if (goingToNextWord) {
    input = input.replace(/ $/, "");
  }

  updateWordLetters({
    input,
    wordIndex: getActiveWordIndex(),
    compositionData: getCompositionData(),
  });

  afterAnyTestInput("textInput", correct);
}

export function afterTestCompositionUpdate(): void {
  updateWordLetters({
    input: getCurrentInput(),
    wordIndex: getActiveWordIndex(),
    compositionData: getCompositionData(),
  });
  // correct needs to be true to get the normal click sound
  afterAnyTestInput("compositionUpdate", true);
}

export function afterTestDelete(): void {
  updateWordLetters({
    input: getCurrentInput(),
    wordIndex: getActiveWordIndex(),
    compositionData: getCompositionData(),
  });
  afterAnyTestInput("delete", null);
}

export function beforeTestWordChange(direction: "forward" | "back"): void {
  if (direction === "back") {
    updateWordLetters({
      input: getCurrentInput(),
      wordIndex: getActiveWordIndex(),
      compositionData: getCompositionData(),
    });
  }
}

export async function afterTestWordChange(
  direction: "forward" | "back",
  lastBurst?: number | null,
): Promise<void> {
  const activeWordIndex = getActiveWordIndex();
  if (direction === "forward") setWordTyped(activeWordIndex - 1, true);
  setWordTyped(activeWordIndex, false);
  setActiveWord(activeWordIndex);
  pendingWordChange = direction;

  if (lastBurst !== null && Numbers.isSafeNumber(lastBurst)) {
    setCurrentLiveStats({ burst: Math.round(lastBurst) });
  }

  if (Config.keymapMode === "next") {
    const keyToHighlight =
      TestWords.words.getCurrent()?.textWithCommit[getCurrentInput().length];
    if (keyToHighlight !== undefined) {
      highlightKeymapKey(keyToHighlight);
    }
  }

  if (direction === "back" && Config.mode === "zen") {
    truncateWords(activeWordIndex + 1);
  }
}

export function onTestStart(): void {
  setFocusMode(true);
  setCurrentLiveStats({
    wpm: 0,
    acc: 100,
    raw: 0,
    burst: 0,
    seconds: 0,
  });
}

function getRestartAnimationTime(noAnim: boolean): number {
  return noAnim ? 0 : Misc.applyReducedMotion(125);
}

export async function fadeOutTest(
  source: "testPage" | "resultPage",
  noAnim: boolean,
): Promise<void> {
  const el = source === "resultPage" ? resultRef : typingTestEl();
  await el?.promiseAnimate({
    opacity: 0,
    duration: getRestartAnimationTime(noAnim),
  });
}

export async function fadeInTest(noAnim: boolean): Promise<void> {
  await typingTestEl().promiseAnimate({
    opacity: [0, 1],
    duration: getRestartAnimationTime(noAnim),
  });
}

export function onTestRestart(source: "testPage" | "resultPage"): void {
  setResultShown(false);
  typingTestEl().setStyle({ opacity: "0" });
  setTypingTestHidden(false);
  setWordsInputPosition((position) => ({ ...position, left: 0 }));
  setFocusMode(false);
  setCurrentLiveStats({
    wpm: undefined,
    acc: undefined,
    raw: undefined,
    burst: undefined,
    seconds: undefined,
  });
  setLayoutfluidTimerVisible(false);
  ResultWordHighlight.destroy();
  MonkeyPower.reset();
  Caret.resetPosition();
  setTestInitFailed(false);
  setTestInitError(null);
  focusWords(true);

  if (!isOnline()) {
    showOfflineBanner();
  }

  if (source === "resultPage") {
    if (Config.randomTheme !== "off") {
      void ThemeController.randomizeTheme();
    }
    skipBreakdownEvent.dispatch();
  }

  AdController.destroyResult();
  void SoundController.clearAllSounds();
  showWords();
}

/** Frees the test words DOM once the result is shown. */
export function clearWords(): void {
  wordsLayoutRef?.reset();
  resetWordsRender();
  clearPendingLayout();
}

export function onTestFinish(): void {
  Caret.hide();
  setTestFocusState("focused");
  if (Config.playSoundOnClick === "16") {
    void SoundController.playFartReverb();
  }
}

/**
 * Binds test-ui to TestPage's elements. Call on every mount; refs are
 * released when `signal` aborts.
 */
export function init(
  refs: {
    wordsLayout: WordsLayout;
    wordsWrapper: ElementWithUtils;
    typingTest: ElementWithUtils;
  },
  signal: AbortSignal,
): void {
  wordsLayoutRef = refs.wordsLayout;
  wordsWrapperRef = refs.wordsWrapper;
  typingTestRef = refs.typingTest;
  signal.addEventListener("abort", () => {
    // a remount may have registered new elements already
    if (wordsLayoutRef === refs.wordsLayout) wordsLayoutRef = undefined;
    if (wordsWrapperRef === refs.wordsWrapper) wordsWrapperRef = undefined;
    if (typingTestRef === refs.typingTest) typingTestRef = undefined;
  });
  markTestPageMounted(signal);
  // stays registered across remounts, layoutWords bails while unmounted
  setLayoutHook(layoutWords);

  // configEvent fires before the config store updates, so DOM reactions live
  // here instead - they run after TestPage's bindings picked up the new config
  createEffect(
    on(
      () => [
        getConfig.highlightMode,
        getConfig.typedEffect,
        getConfig.blindMode,
        getConfig.indicateTypos,
        getConfig.tapeMode,
        getConfig.hideExtraLetters,
        getConfig.flipTestColors,
        getConfig.colorfulMode,
        getConfig.showAllLines,
        getConfig.fontSize,
        getConfig.maxLineWidth,
        getConfig.tapeMargin,
      ],
      updateLayout,
      { defer: true },
    ),
  );
  createEffect(
    on(
      () => getConfig.highlightMode,
      () =>
        updateWordLetters({
          input: getCurrentInput(),
          wordIndex: getActiveWordIndex(),
          compositionData: getCompositionData(),
        }),
      { defer: true },
    ),
  );
  createEffect(
    on(
      () => getConfig.typedEffect,
      () => wordsLayout().typedEffectChanged(),
      { defer: true },
    ),
  );
  createEffect(
    on(
      () => [getConfig.fontFamily, getConfig.fontSize, getFontPreview()],
      () => {
        wordsLayout().fontChanged();
        if (!isTestFinished()) invalidateTypoHintsLayout();
      },
      { defer: true },
    ),
  );

  // autofocus the words when typing anywhere on the page
  document.addEventListener("keydown", autofocusWords, { signal });

  const recenter = debounce(250, () => {
    if (isTestFinished()) return;
    wordsLayout().resized();
    setTimeout(() => {
      if (signal.aborted) return;
      updateWordsInputPosition();
      focusWords();
      Caret.show();
    }, 250);
  });
  const hideCaret = throttle(250, () => Caret.hide());
  window.addEventListener(
    "resize",
    () => {
      hideCaret();
      recenter();
    },
    { signal },
  );
  signal.addEventListener("abort", () => {
    hideCaret.cancel();
    recenter.cancel();
  });
}

function autofocusWords(e: KeyboardEvent): void {
  if (e.key === undefined) return;

  if (isDevEnvironment()) {
    if (
      (document.activeElement as HTMLElement | undefined)?.dataset[
        "uiElement"
      ] === "signalDevtoolsInput"
    ) {
      return;
    }
  }

  if (isTestFinished() || isInputElementFocused()) return;
  // checked last, isAnyPopupVisible is a bit expensive
  if (
    ["Enter", " ", "Escape", "Tab", ...ModifierKeys].includes(e.key) ||
    e.metaKey ||
    e.ctrlKey ||
    Misc.isAnyPopupVisible()
  ) {
    return;
  }
  focusWords();
  if (Config.showOutOfFocusWarning) {
    e.preventDefault();
  }
}
