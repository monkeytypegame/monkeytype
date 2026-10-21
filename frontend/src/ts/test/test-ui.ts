import { isOnline, showOfflineBanner } from "../states/connection";
import { Config, getConfig } from "../config/store";
import * as TestWords from "./test-words";
import { getCurrentInput } from "./events/data";
import { getLiveCachedAccuracy } from "./events/live-cache";
import * as CustomText from "./custom-text";
import * as Caret from "./caret";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as ResultWordHighlight from "../components/pages/test/result/result-word-highlight";
import { debounce, throttle } from "throttle-debounce";
import { ModifierKeys } from "../constants/modifier-keys";
import { isDevEnvironment } from "../utils/env";
import { convertRemToPixels } from "../utils/numbers";
import * as PaceCaret from "./pace-caret";
import * as SoundController from "../controllers/sound-controller";
import * as Numbers from "@monkeytype/util/numbers";
import * as Focus from "../test/focus";
import {
  blurInputElement,
  focusInputElement,
  getInputElement,
  isInputElementFocused,
} from "../input/input-element";
import * as MonkeyPower from "../elements/monkey-power";
import * as AdController from "../controllers/ad-controller";
import * as Joining from "./break-joining";
import * as ThemeController from "../controllers/theme-controller";
import { ElementsWithUtils, ElementWithUtils, qs } from "../utils/dom";
import { getFontPreview } from "../states/font";
import * as WordsRender from "../states/words-render";
import { skipBreakdownEvent } from "../states/header";
import {
  isDirectionReversed,
  isLanguageRightToLeft,
  getActiveWordIndex,
  isTestActive,
  setCurrentLiveStats,
  setOutOfFocusMaxHeight,
  wordsHaveNewline,
  setTestFocusState,
  isTestFinished,
  setWordsWrapperHidden,
  setLayoutfluidTimerVisible,
  setTestInitError,
  setTestInitFailed,
  setTypingTestHidden,
  getCompositionData,
  isSlowTimer,
  highlightKeymapKey,
} from "../states/test";
import { createEffect, on, untrack } from "solid-js";
import { setResultShown } from "../states/result";
import { isTestPageMounted, markTestPageMounted } from "./test-page-state";

export const updateHintsPositionDebounced = Misc.debounceUntilResolved(
  updateHintsPosition,
  { rejectSkippedCalls: false },
);

// rendered by TestPage, registered via init() on every mount
let wordsRef: ElementWithUtils | undefined;
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

function wordsEl(): ElementWithUtils {
  if (wordsRef === undefined) throw new Error("#words not mounted");
  return wordsRef;
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

let activeWordTop = 0;
let activeWordHeight = 0;
let wordTopBeforeLineJump = 0;
let lineTransition = false;

let currentTestLine = 0;

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

function keepWordsInputInTheCenter(force = false): void {
  const wordsInput = getInputElement();
  if (wordsInput === null) return;

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
  const el = wordsEl().qs(`.word[data-wordindex='${index}']`);
  return el;
}

/**
 * False once a word has scrolled off (line jump / tape stop rendering it).
 */
export function isWordRendered(index: number): boolean {
  return index >= WordsRender.getFirstRenderedWordIndex();
}

function getWordIndex(el: ElementWithUtils): number {
  return Number(el.native.dataset["wordindex"]);
}

function getActiveWordElement(): ElementWithUtils | null {
  return getWordElement(getActiveWordIndex());
}

type WordChange = "forward" | "back" | "initial";

// what the next words frame has to lay out. Plain state written on the input
// path; consumed by layoutWords once the DOM reflects the render store
let pendingWordChange: WordChange | undefined;
const pendingUpdatedWords = new Set<number>();
let laidOutActiveWordIndex: number | undefined;

function clearPendingLayout(): void {
  pendingWordChange = undefined;
  pendingUpdatedWords.clear();
}

/** Layout step of the shared words frame, runs after the DOM is updated. */
function layoutWords(): void {
  const wordChange = pendingWordChange;
  const updatedWords = [...pendingUpdatedWords];
  clearPendingLayout();
  if (!isMounted()) return;

  if (wordChange !== undefined) {
    void layoutActiveWord(wordChange);
  } else if (updatedWords.length > 0 && Config.tapeMode !== "off") {
    void scrollTape();
  }
  for (const wordIndex of updatedWords) {
    void updateWordHints(wordIndex);
    void lineJumpIfWrapped(wordIndex);
  }
  Caret.updatePositionNow();
}

function indicatesTyposBelow(): boolean {
  return Config.indicateTypos === "below" || Config.indicateTypos === "both";
}

/**
 * Rebuilds the hints of a word inside its component-owned hints container,
 * against the word's freshly rendered letters.
 */
async function updateWordHints(wordIndex: number): Promise<void> {
  const word = WordsRender.wordsRenderState.words[wordIndex];
  const wordElement = getWordElement(wordIndex);
  const hintsContainer = wordElement?.qs(":scope > .hints");
  if (word === undefined || !wordElement || !hintsContainer) return;

  const hintIndices: number[][] = [];
  if (indicatesTyposBelow() && Config.mode !== "zen") {
    const wordChars = Strings.splitIntoCharacters(word.text);
    const inputChars = Strings.splitIntoCharacters(word.input);
    for (let i = 0; i < inputChars.length; i++) {
      const expected = wordChars[i];
      // extra letters get no hint
      if (expected === undefined || expected === inputChars[i]) continue;
      const lastBlock = hintIndices[hintIndices.length - 1];
      if (lastBlock?.[lastBlock.length - 1] === i - 1) {
        lastBlock.push(i);
      } else {
        hintIndices.push([i]);
      }
    }
  }

  if (hintIndices.length === 0) {
    hintsContainer.setHtml("");
    return;
  }

  const letterElements = wordElement.qsa("letter");
  hintsContainer.setHtml(
    createHintsHtml(
      hintIndices,
      letterElements,
      Config.indicateTypos === "both" ? word.text : word.input,
    ),
  );
  await joinOverlappingHints(
    hintIndices,
    letterElements,
    hintsContainer.native.getElementsByTagName("hint"),
  );
}

async function layoutActiveWord(wordChange: WordChange): Promise<void> {
  let previousActiveWordTop: number | null = null;
  if (wordChange !== "initial" && laidOutActiveWordIndex !== undefined) {
    const previousActiveWord = getWordElement(laidOutActiveWordIndex);
    // in zen mode, going back removes the previous word, so check for null
    if (previousActiveWord !== null) {
      if (wordChange === "forward") {
        Joining.set(previousActiveWord, true);
      }
      previousActiveWordTop = previousActiveWord.getOffsetTop();
    }
  }

  const newActiveWord = getActiveWordElement();
  laidOutActiveWordIndex = getActiveWordIndex();
  if (newActiveWord === null) return;

  Joining.set(newActiveWord, false);

  activeWordTop = newActiveWord.getOffsetTop();
  activeWordHeight = newActiveWord.getOffsetHeight();

  if (previousActiveWordTop !== null) {
    const isTimedTest =
      Config.mode === "time" ||
      (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
      (Config.mode === "custom" && CustomText.getLimitValue() === 0);

    if (isTimedTest || !Config.showAllLines) {
      const newActiveWordTop = newActiveWord.getOffsetTop();
      if (newActiveWordTop > previousActiveWordTop) {
        await lineJump(previousActiveWordTop);
      }
    }
  }

  if (wordChange !== "initial" && Config.tapeMode !== "off") {
    await scrollTape();
  }

  updateWordsInputPosition();
}

async function lineJumpIfWrapped(wordIndex: number): Promise<void> {
  // because we block word jumps in before-insert-text
  // this check only needs to happen in zen mode
  // unless slow timer is on, then it needs to happen
  // because the word jump check is disabled
  if (Config.mode !== "zen" && !isSlowTimer()) return;
  if (Config.showAllLines) return;
  const wordAtIndex = getWordElement(wordIndex);
  if (wordAtIndex === null) return;
  const wordTopAfterUpdate = wordAtIndex.getOffsetTop();
  if (wordTopAfterUpdate > activeWordTop) {
    let jump = false;
    if (!lineTransition) {
      wordTopBeforeLineJump = wordTopAfterUpdate;
      jump = true;
    } else if (wordTopAfterUpdate > wordTopBeforeLineJump) {
      jump = true;
    }
    if (jump) await lineJump(activeWordTop);
  }
}

function createHintsHtml(
  incorrectLettersIndices: number[][],
  activeWordLetters: ElementsWithUtils,
  input: string | string[],
): string {
  // if input is an array, it contains only incorrect letters input.
  // if input is a string, it contains the whole word input.
  const isFullWord = typeof input === "string";
  const inputChars = isFullWord ? Strings.splitIntoCharacters(input) : input;

  let hintsHtml = "";
  let currentHint = 0;

  for (const adjacentLetters of incorrectLettersIndices) {
    for (const letterIndex of adjacentLetters) {
      const letter = activeWordLetters[letterIndex] as ElementWithUtils;
      const blockIndices = `${letterIndex}`;
      const blockChars = isFullWord
        ? inputChars[letterIndex]
        : inputChars[currentHint++];

      hintsHtml += `<hint data-chars-index=${blockIndices} style="left:${
        letter.getOffsetLeft() + letter.getOffsetWidth() / 2
      }px;">${blockChars}</hint>`;
    }
  }
  return hintsHtml;
}

async function joinOverlappingHints(
  incorrectLettersIndices: number[][],
  activeWordLetters: ElementsWithUtils,
  hintElements: HTMLCollection,
): Promise<void> {
  const currentWord = TestWords.words.getCurrent();
  if (currentWord === undefined) return;

  const [isWordRightToLeft] = Strings.isWordRightToLeft(
    currentWord.text,
    isLanguageRightToLeft(),
    isDirectionReversed(),
  );

  let previousBlocksAdjacent = false;
  let currentHintBlock = 0;
  let HintBlocksCount = hintElements.length;
  while (currentHintBlock < HintBlocksCount - 1) {
    const hintBlock1 = hintElements[currentHintBlock] as HTMLElement;
    const hintBlock2 = hintElements[currentHintBlock + 1] as HTMLElement;

    const block1Indices = hintBlock1.dataset["charsIndex"]?.split(",") ?? [];
    const block2Indices = hintBlock2.dataset["charsIndex"]?.split(",") ?? [];

    const block1Letter1Indx = parseInt(block1Indices[0] ?? "0");
    const block2Letter1Indx = parseInt(block2Indices[0] ?? "0");

    const currentBlocksAdjacent = incorrectLettersIndices.some(
      (adjacentLettersSequence) =>
        adjacentLettersSequence.includes(block1Letter1Indx) &&
        adjacentLettersSequence.includes(block2Letter1Indx),
    );

    if (!currentBlocksAdjacent) {
      currentHintBlock++;
      previousBlocksAdjacent = false;
      continue;
    }

    const block1Letter1 = activeWordLetters[
      block1Letter1Indx
    ] as ElementWithUtils;
    const block2Letter1 = activeWordLetters[
      block2Letter1Indx
    ] as ElementWithUtils;

    const sameTop =
      block1Letter1.getOffsetTop() === block2Letter1.getOffsetTop();

    const leftBlock = isWordRightToLeft ? hintBlock2 : hintBlock1;
    const rightBlock = isWordRightToLeft ? hintBlock1 : hintBlock2;

    // block edge is offset half its width because of transform: translate(-50%)
    const leftBlockEnds = leftBlock.offsetLeft + leftBlock.offsetWidth / 2;
    const rightBlockStarts = rightBlock.offsetLeft - rightBlock.offsetWidth / 2;

    if (sameTop && leftBlockEnds > rightBlockStarts) {
      // join hint blocks
      hintBlock1.dataset["charsIndex"] = [
        ...block1Indices,
        ...block2Indices,
      ].join(",");

      const block1Letter1Pos =
        block1Letter1.getOffsetLeft() +
        (isWordRightToLeft ? block1Letter1.getOffsetWidth() : 0);
      const bothBlocksLettersWidthHalved =
        hintBlock2.offsetLeft - hintBlock1.offsetLeft;
      hintBlock1.style.left = `${block1Letter1Pos + bothBlocksLettersWidthHalved}px`;

      hintBlock1.insertAdjacentHTML("beforeend", hintBlock2.innerHTML);
      hintBlock2.remove();

      // after joining blocks, the sequence is shorter
      HintBlocksCount--;
      // check if the newly formed block overlaps with the previous one
      if (previousBlocksAdjacent && currentHintBlock > 0) currentHintBlock--;
    } else {
      currentHintBlock++;
    }
    previousBlocksAdjacent = true;
  }
}

async function updateHintsPosition(): Promise<void> {
  if (
    !isMounted() ||
    isTestFinished() ||
    (Config.indicateTypos !== "below" && Config.indicateTypos !== "both")
  ) {
    return;
  }

  let previousHintsContainer: HTMLElement | undefined;
  let hintIndices: number[][] = [];
  let hintText: string[] = [];

  const hintElements = document.querySelectorAll<HTMLElement>(".hints > hint");

  for (const hintEl of hintElements) {
    const hintsContainer = hintEl.parentElement as HTMLElement;

    if (hintsContainer !== previousHintsContainer) {
      await adjustHintsContainer(previousHintsContainer, hintIndices, hintText);
      previousHintsContainer = hintsContainer;
      hintIndices = [];
      hintText = [];
    }

    const letterIndices = hintEl.dataset["charsIndex"]
      ?.split(",")
      .map((index) => parseInt(index));

    if (letterIndices === undefined || letterIndices.length === 0) continue;

    for (const currentLetterIndex of letterIndices) {
      const lastBlock = hintIndices[hintIndices.length - 1];
      if (lastBlock?.[lastBlock.length - 1] === currentLetterIndex - 1) {
        lastBlock.push(currentLetterIndex);
      } else {
        hintIndices.push([currentLetterIndex]);
      }
    }

    hintText.push(...Strings.splitIntoCharacters(hintEl.innerHTML));
  }
  await adjustHintsContainer(previousHintsContainer, hintIndices, hintText);

  async function adjustHintsContainer(
    hintsContainer: HTMLElement | undefined,
    hintIndices: number[][],
    hintText: string[],
  ): Promise<void> {
    if (!hintsContainer || hintIndices.length === 0) return;

    const wordElement = new ElementWithUtils(
      hintsContainer.parentElement as HTMLElement,
    );
    const letterElements = wordElement.qsa("letter");

    hintsContainer.innerHTML = createHintsHtml(
      hintIndices,
      letterElements,
      hintText,
    );
    const wordHintsElements = wordElement.native.getElementsByTagName("hint");
    await joinOverlappingHints(hintIndices, letterElements, wordHintsElements);
  }
}

// measures #words, so it has to run after TestPage applied the config classes
function updateLayout(): void {
  // outoffocus applies transition, need to remove it
  setTestFocusState("focused");

  updateWordsWrapperHeight(true);
  if (!Config.showAllLines) {
    void centerActiveLine();
  }
  updateWordsMargin();
  updateWordsInputPosition();
  void updateHintsPositionDebounced();
  Caret.updatePosition(true);

  if (!isInputElementFocused()) {
    setTestFocusState("unfocused");
  }
}

function showWords(): void {
  WordsRender.reset();
  clearPendingLayout();
  laidOutActiveWordIndex = undefined;

  if (Config.mode === "zen") {
    WordsRender.appendWord("");
  } else {
    for (let i = 0; i < TestWords.words.length; i++) {
      const word = TestWords.words.get(i);
      if (word === undefined) continue; // won't happen, but ts complains
      WordsRender.appendWord(word.display);
    }
  }
  WordsRender.setActiveWord(getActiveWordIndex());
  // not on the input path: render now, the layout below measures the words
  WordsRender.flush();

  updateLayout();
  void layoutActiveWord("initial");
  PaceCaret.resetCaretPosition();
}

/** Zen mode: adds the next (empty) word. */
export function appendEmptyWord(): void {
  WordsRender.appendWord("");
}

export function updateWordsInputPosition(): void {
  if (!isMounted()) return;
  const isTestRightToLeft = isDirectionReversed()
    ? !isLanguageRightToLeft()
    : isLanguageRightToLeft();

  const el = getInputElement();

  if (el === null) return;

  const activeWord = getActiveWordElement();

  if (!activeWord) {
    el.style.top = "0px";
    el.style.left = "0px";
    return;
  }

  const letterHeight = convertRemToPixels(Config.fontSize);
  const targetTop =
    activeWord.getOffsetTop() + letterHeight / 2 - el.offsetHeight / 2 + 1; //+1 for half of border

  if (Config.tapeMode !== "off") {
    el.style.maxWidth = `${100 - Config.tapeMargin}%`;
  } else {
    el.style.maxWidth = "";
  }
  if (activeWord.getOffsetWidth() < letterHeight) {
    el.style.width = `${letterHeight}px`;
  } else {
    el.style.width = `${activeWord.getOffsetWidth()}px`;
  }

  el.style.top = `${targetTop}px`;

  if (Config.tapeMode !== "off") {
    el.style.left = `${
      wordsWrapperEl().getOffsetWidth() * (Config.tapeMargin / 100)
    }px`;
  } else {
    if (activeWord.getOffsetWidth() < letterHeight && isTestRightToLeft) {
      el.style.left = `${activeWord.getOffsetLeft() - letterHeight}px`;
    } else {
      el.style.left = `${Math.max(0, activeWord.getOffsetLeft())}px`;
    }
  }

  keepWordsInputInTheCenter();
}

let centeringActiveLine: Promise<void> = Promise.resolve();

export async function centerActiveLine(): Promise<void> {
  if (Config.showAllLines) {
    return;
  }

  const { resolve, promise } = Misc.promiseWithResolvers();
  centeringActiveLine = promise;

  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) {
    resolve();
    return;
  }
  const currentTop = activeWordEl.getOffsetTop();

  let previousLineTop = currentTop;
  for (let i = getActiveWordIndex() - 1; i >= 0; i--) {
    previousLineTop = getWordElement(i)?.getOffsetTop() ?? currentTop;
    if (previousLineTop < currentTop) {
      await lineJump(previousLineTop, true);
      resolve();
      return;
    }
  }

  resolve();
}

function updateWordsWrapperHeight(force = false): void {
  if (!isMounted() || isTestFinished()) return;
  if (!force && Config.mode !== "custom") return;
  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) return;

  setWordsWrapperHidden(false);

  const wordComputedStyle = window.getComputedStyle(activeWordEl.native);
  const wordMargin =
    parseInt(wordComputedStyle.marginTop) +
    parseInt(wordComputedStyle.marginBottom);
  const wordHeight = activeWordEl.getOffsetHeight() + wordMargin;

  const timedTest =
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
    (Config.mode === "custom" && CustomText.getLimitValue() === 0);

  const showAllLines = Config.showAllLines && !timedTest;

  if (showAllLines) {
    //allow the wrapper to grow and shink with the words
    wordsWrapperEl().setStyle({ height: "" });
  } else if (Config.mode === "zen") {
    //zen mode, showAllLines off
    wordsWrapperEl().setStyle({ height: `${wordHeight * 2}px` });
  } else {
    if (Config.tapeMode === "off") {
      //tape off, showAllLines off, non-zen mode
      const wordElements = wordsEl().qsa(".word");
      let lines = 0;
      let lastTop = 0;
      let wordIndex = 0;
      let wrapperHeight = 0;

      while (lines < 3) {
        const word = wordElements[wordIndex];
        if (!word) break;
        const top = word.getOffsetTop();
        if (top > lastTop) {
          lines++;
          wrapperHeight += word.getOffsetHeight() + wordMargin;
          lastTop = top;
        }
        wordIndex++;
      }
      if (lines < 3) wrapperHeight = wrapperHeight * (3 / lines);

      //limit to 3 lines
      wordsWrapperEl().setStyle({ height: `${wrapperHeight}px` });
    } else {
      //show 3 lines if tape mode is on and has newlines, otherwise use words height (because of indicate typos: below)
      if (wordsHaveNewline()) {
        wordsWrapperEl().setStyle({ height: `${wordHeight * 3}px` });
      } else {
        const wordsHeight = wordsEl().getOffsetHeight() ?? wordHeight;
        wordsWrapperEl().setStyle({ height: `${wordsHeight}px` });
      }
    }
  }

  setOutOfFocusMaxHeight(wordHeight * 3);
}

function updateWordsMargin(): void {
  if (Config.tapeMode !== "off") {
    wordsEl().setStyle({ marginLeft: "0" });
    void scrollTape(true);
  } else {
    const afterNewlineEls = wordsEl().qsa(".afterNewline");
    wordsEl().setStyle({ marginLeft: "0", marginTop: "0" });
    for (const afterNewline of afterNewlineEls) {
      afterNewline.setStyle({
        marginLeft: "0",
      });
    }
  }
}

export function addWord(word: string): void {
  WordsRender.appendWord(word);
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
  WordsRender.setWordInput(wordIndex, input, compositionData);
  pendingUpdatedWords.add(wordIndex);
}

// this is needed in tape mode because sometimes we want the newline character to appear above the next line
// and sometimes we want it to be shifted to the left
// (for example if the newline is typed incorrectly, or there are any extra letters after it)
function getNlCharWidth(
  lastWordInLine?: ElementWithUtils,
  checkIfIncorrect = true,
): number {
  let nlChar: ElementWithUtils | null;
  if (lastWordInLine) {
    nlChar = lastWordInLine.qs("letter.nlChar");
  } else {
    nlChar = qs("#words > .word > letter.nlChar");
  }
  if (!nlChar) return 0;
  if (checkIfIncorrect && nlChar.hasClass("incorrect")) return 0;
  const letterComputedStyle = window.getComputedStyle(nlChar.native);
  const letterMargin =
    parseFloat(letterComputedStyle.marginLeft) +
    parseFloat(letterComputedStyle.marginRight);
  return nlChar.getOffsetWidth() + letterMargin;
}

export async function scrollTape(noAnimation = false): Promise<void> {
  if (!isMounted() || isTestFinished()) return;

  await centeringActiveLine;

  const isTestRightToLeft = isDirectionReversed()
    ? !isLanguageRightToLeft()
    : isLanguageRightToLeft();

  const wordsWrapperWidth = wordsWrapperEl().getOffsetWidth();
  const wordsChildrenArr = wordsEl().getChildren();
  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) return;
  const afterNewLineEls = wordsEl().qsa(".afterNewline");

  let wordsWidthBeforeActive = 0;
  let fullLineWidths = 0;
  let widthRemoved = 0;
  const widthRemovedFromLine: number[] = [];
  const afterNewlinesNewMargins: number[] = [];
  // overflown words are only removed from the start, and a word followed by a
  // newline stays until line jump removes its line, so the line break stays
  let removing = true;
  let lastWordToRemove: ElementWithUtils | undefined;

  /* get last element to loop over */
  let lastElementIndex: number;
  // index of the active word in all #words.children
  // (which contains .word/.newline/.beforeNewline/.afterNewline elements)
  const activeWordIndex = wordsChildrenArr.indexOf(activeWordEl);
  // this will between 0 and 2
  const newLinesBeforeActiveWord = wordsChildrenArr
    .slice(0, activeWordIndex)
    .filter((child) => child.hasClass("afterNewline")).length;
  // the second `.afterNewline` after active word is visible during line jump
  let lastVisibleAfterNewline = afterNewLineEls[newLinesBeforeActiveWord + 1];
  if (lastVisibleAfterNewline) {
    lastElementIndex = wordsChildrenArr.indexOf(lastVisibleAfterNewline);
  } else {
    lastVisibleAfterNewline = afterNewLineEls[newLinesBeforeActiveWord];
    if (lastVisibleAfterNewline) {
      lastElementIndex = wordsChildrenArr.indexOf(lastVisibleAfterNewline);
    } else {
      lastElementIndex = activeWordIndex - 1;
    }
  }

  const wordRightMargin = parseFloat(
    window.getComputedStyle(activeWordEl.native).marginRight,
  );

  /*calculate .afterNewline & #words new margins + determine elements to remove*/
  for (let i = 0; i <= lastElementIndex; i++) {
    const child = wordsChildrenArr[i] as ElementWithUtils;
    if (child.hasClass("word")) {
      const wordOuterWidth = child.getOuterWidth();
      const wordLeft = Math.floor(child.getOffsetLeft());
      const wordWidth = Math.floor(child.getOffsetWidth());
      removing &&=
        ((!isTestRightToLeft && wordLeft < 0 - wordWidth) ||
          (isTestRightToLeft && wordLeft > wordsWrapperWidth)) &&
        !wordsChildrenArr[i + 1]?.hasClass("beforeNewline");
      if (removing) {
        lastWordToRemove = child;
        widthRemoved += wordOuterWidth;
      } else {
        fullLineWidths += wordOuterWidth;
        if (i < activeWordIndex) wordsWidthBeforeActive = fullLineWidths;
      }
    } else if (child.hasClass("afterNewline")) {
      const nlCharWidth = getNlCharWidth(wordsChildrenArr[i - 3]);
      fullLineWidths -= nlCharWidth + wordRightMargin;
      if (i < activeWordIndex) wordsWidthBeforeActive = fullLineWidths;

      /** words that are wider than limit can cause a barely visible bottom line shifting,
       * increase limit if that ever happens, but keep the limit because browsers hate
       * ridiculously wide margins which may cause the words to not be displayed
       */
      const limit = 3 * wordsEl().getOffsetWidth();
      if (fullLineWidths < limit) {
        afterNewlinesNewMargins.push(fullLineWidths);
        widthRemovedFromLine.push(widthRemoved);
      } else {
        afterNewlinesNewMargins.push(limit);
        widthRemovedFromLine.push(widthRemoved);
        if (i < lastElementIndex) {
          // for the second .afterNewline after active word
          afterNewlinesNewMargins.push(limit);
          widthRemovedFromLine.push(widthRemoved);
        }
        break;
      }
    }
  }

  /* remove overflown elements */
  if (lastWordToRemove !== undefined) {
    WordsRender.setFirstRenderedWordIndex(getWordIndex(lastWordToRemove) + 1);
    for (let i = 0; i < widthRemovedFromLine.length; i++) {
      const afterNewlineEl = afterNewLineEls[i] as ElementWithUtils;
      const currentLineIndent =
        parseFloat(afterNewlineEl.getStyle().marginLeft) || 0;
      afterNewlineEl.setStyle({
        marginLeft: `${currentLineIndent - (widthRemovedFromLine[i] ?? 0)}px`,
      });
    }
    if (isTestRightToLeft) widthRemoved *= -1;
    const currentWordsMargin =
      parseFloat(wordsEl().native.style.marginLeft) || 0;
    wordsEl().setStyle({
      marginLeft: `${currentWordsMargin + widthRemoved}px`,
    });
    Caret.caret?.handleTapeWordsRemoved(widthRemoved);
    PaceCaret.caret?.handleTapeWordsRemoved(widthRemoved);
  }

  /* calculate current word width to add to #words margin */
  let currentWordWidth = 0;
  const inputLength = getCurrentInput().length;
  if (Config.tapeMode === "letter" && inputLength > 0) {
    const letters = activeWordEl.qsa("letter");
    let lastPositiveLetterWidth = 0;
    for (let i = 0; i < inputLength; i++) {
      const letter = letters[i];
      if (
        (Config.blindMode || Config.hideExtraLetters) &&
        letter?.hasClass("extra")
      ) {
        continue;
      }
      const letterOuterWidth = letter?.getOffsetWidth() ?? 0;
      currentWordWidth += letterOuterWidth;
      if (letterOuterWidth > 0) lastPositiveLetterWidth = letterOuterWidth;
    }
    // if current letter has zero width move the tape to previous positive width letter
    if (letters[inputLength]?.getOffsetWidth() === 0) {
      currentWordWidth -= lastPositiveLetterWidth;
    }
  }

  /* change to new #words & .afterNewline margins */
  const tapeMarginPx = wordsWrapperWidth * (Config.tapeMargin / 100);
  let newMarginOffset = wordsWidthBeforeActive + currentWordWidth;
  let newMargin = tapeMarginPx - newMarginOffset;
  if (isTestRightToLeft) {
    newMarginOffset *= -1;
    newMargin = wordRightMargin - newMargin;
  }

  const duration = noAnimation ? 0 : 125;
  const ease = "inOut(1.25)";

  const caretScrollOptions = {
    newValue: newMarginOffset * -1,
    duration: Config.smoothLineScroll ? duration : 0,
    ease,
  };

  Caret.caret?.handleTapeScroll(caretScrollOptions);
  PaceCaret.caret?.handleTapeScroll(caretScrollOptions);

  if (Config.smoothLineScroll) {
    wordsEl().animate({
      marginLeft: newMargin,
      duration,
      ease,
    });

    for (let i = 0; i < afterNewlinesNewMargins.length; i++) {
      const newMargin = afterNewlinesNewMargins[i] ?? 0;
      (afterNewLineEls[i] as ElementWithUtils)?.animate({
        marginLeft: newMargin,
        duration,
        ease,
      });
    }
  } else {
    wordsEl().setStyle({ marginLeft: `${newMargin}px` });
    for (let i = 0; i < afterNewlinesNewMargins.length; i++) {
      const newMargin = afterNewlinesNewMargins[i] ?? 0;
      afterNewLineEls[i]?.setStyle({ marginLeft: `${newMargin}px` });
    }
  }
}

/**
 * Stops rendering the words among #words' children up to
 * `lastElementIndexToRemove`, newline siblings of the last one included.
 */
function removeTestElements(lastElementIndexToRemove: number): void {
  const wordsChildren = wordsEl().getChildren();
  let lastWordElementIndex = lastElementIndexToRemove;
  while (
    lastWordElementIndex >= 0 &&
    !wordsChildren[lastWordElementIndex]?.hasClass("word")
  ) {
    lastWordElementIndex--;
  }
  const lastWord = wordsChildren[lastWordElementIndex];
  if (lastWord === undefined) return;

  // tape mode indents the line after a newline with its `.afterNewline`
  const afterNewline = wordsChildren[lastWordElementIndex + 1]?.hasClass(
    "beforeNewline",
  )
    ? wordsChildren[lastWordElementIndex + 3]
    : undefined;
  const indent = parseFloat(afterNewline?.getStyle().marginLeft ?? "") || 0;

  WordsRender.setFirstRenderedWordIndex(getWordIndex(lastWord) + 1);

  if (indent === 0) return;
  // the indent is gone: shift #words by it instead, keeping the lines in place
  const isTestRightToLeft = isDirectionReversed()
    ? !isLanguageRightToLeft()
    : isLanguageRightToLeft();
  for (const el of wordsEl().qsa(".afterNewline")) {
    const currentLineIndent = parseFloat(el.getStyle().marginLeft) || 0;
    el.setStyle({ marginLeft: `${currentLineIndent - indent}px` });
  }
  const widthRemoved = isTestRightToLeft ? -indent : indent;
  const currentWordsMargin = parseFloat(wordsEl().native.style.marginLeft) || 0;
  wordsEl().setStyle({ marginLeft: `${currentWordsMargin + widthRemoved}px` });
  Caret.caret?.handleTapeWordsRemoved(widthRemoved);
  PaceCaret.caret?.handleTapeWordsRemoved(widthRemoved);
}

let currentLinesJumping = 0;

async function lineJump(currentTop: number, force = false): Promise<void> {
  //last word of the line
  if (currentTestLine > 0 || force) {
    const hideBound = currentTop;

    const activeWordEl = getActiveWordElement();
    if (!activeWordEl) return;

    // index of the active word in all #words.children
    // (which contains .word/.newline/.beforeNewline/.afterNewline elements)
    const wordsChildren = wordsEl().getChildren();
    const activeWordElementIndex = wordsChildren.indexOf(activeWordEl);

    let lastElementIndexToRemove: number | undefined = undefined;
    for (let i = activeWordElementIndex - 1; i >= 0; i--) {
      const child = wordsChildren[i] as ElementWithUtils;
      if (child.hasClass("hidden")) continue;
      if (Math.floor(child.getOffsetTop()) < hideBound) {
        if (child.hasClass("word")) {
          lastElementIndexToRemove = i;
          break;
        } else if (child.hasClass("beforeNewline")) {
          // set it to .newline but check .beforeNewline.offsetTop
          // because it's more reliable
          lastElementIndexToRemove = i + 1;
          break;
        }
      }
    }

    if (lastElementIndexToRemove === undefined) {
      currentTestLine++;
      updateWordsWrapperHeight();
      return;
    }

    currentLinesJumping++;

    const wordHeight = activeWordEl.getOuterHeight();
    const newMarginTop = -1 * wordHeight * currentLinesJumping;
    const duration = 125;

    const caretLineJumpOptions = {
      newMarginTop,
      duration: Config.smoothLineScroll ? duration : 0,
    };
    Caret.caret?.handleLineJump(caretLineJumpOptions);
    PaceCaret.caret?.handleLineJump(caretLineJumpOptions);

    if (Config.smoothLineScroll) {
      lineTransition = true;
      await wordsEl().promiseAnimate({
        marginTop: newMarginTop,
        duration,
      });
      currentLinesJumping = 0;
      activeWordTop = activeWordEl.getOffsetTop();
      activeWordHeight = activeWordEl.getOffsetHeight();
      removeTestElements(lastElementIndexToRemove);
      wordsEl().setStyle({ marginTop: "0" });
      lineTransition = false;
    } else {
      currentLinesJumping = 0;
      removeTestElements(lastElementIndexToRemove);
    }
  }
  currentTestLine++;
  updateWordsWrapperHeight();
  return;
}

function highlightBadWord(index: number): void {
  WordsRender.setWordFlags(index, { error: true });
}

function highlightAllLettersAsCorrect(wordIndex: number): void {
  WordsRender.setWordFlags(wordIndex, { allCorrect: true });
}

/**
 * Whether appending `data` to the active word would push it onto the next line
 * or wrap its letters. Expensive - causes layout reflows.
 */
export function wouldActiveWordOverflow(
  inputValue: string,
  data: string,
): boolean {
  // pending (not yet rendered) input has to be accounted for
  const pending = WordsRender.getPendingWordInput(getActiveWordIndex());
  const measured = getActiveWordTopAndHeightWithDifferentData(
    (pending ?? inputValue) + data,
  );
  // active word not rendered yet
  if (measured === null) return false;
  const { top, height } = measured;
  // word jumped to next line, or letters wrapped to next line
  return top > activeWordTop || height > activeWordHeight;
}

function getActiveWordTopAndHeightWithDifferentData(data: string): {
  top: number;
  height: number;
} | null {
  const activeWord = getActiveWordElement();

  if (!activeWord) return null;

  const lettersEls = activeWord.qsa("letter");
  const domLettersCount = lettersEls.length;
  const nodes = [];
  for (let i = domLettersCount; i < data.length; i++) {
    const tempLetter = document.createElement("letter");
    const displayData = data[i] === " " ? "_" : data[i];
    tempLetter.textContent = displayData as string;
    nodes.push(tempLetter);
  }

  lettersEls[domLettersCount - 1]?.native.after(...nodes);

  const top = activeWord.getOffsetTop();
  const height = activeWord.getOffsetHeight();
  for (const node of nodes) {
    node.remove();
  }

  return { top, height };
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

  Focus.set(true);
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

export function beforeTestWordChange(
  direction: "forward",
  correct: boolean,
): void;
export function beforeTestWordChange(direction: "back", correct: null): void;
export function beforeTestWordChange(
  direction: "forward" | "back",
  correct: boolean | null,
): void {
  if (direction === "back") {
    updateWordLetters({
      input: getCurrentInput(),
      wordIndex: getActiveWordIndex(),
      compositionData: getCompositionData(),
    });
  }

  if (direction === "forward") {
    if (Config.blindMode) {
      highlightAllLettersAsCorrect(getActiveWordIndex());
    } else if (correct === false) {
      highlightBadWord(getActiveWordIndex());
    }
  }
}

export async function afterTestWordChange(
  direction: "forward" | "back",
  lastBurst?: number | null,
): Promise<void> {
  const activeWordIndex = getActiveWordIndex();
  if (direction === "forward") {
    WordsRender.setWordFlags(activeWordIndex - 1, { typed: true });
  }
  WordsRender.setWordFlags(activeWordIndex, {
    typed: false,
    error: false,
    allCorrect: false,
  });
  WordsRender.setActiveWord(activeWordIndex);
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
    WordsRender.truncateWords(activeWordIndex + 1);
  }
}

export function onTestStart(): void {
  Focus.set(true);
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
  getInputElement().style.left = "0";
  Focus.set(false);
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

  currentTestLine = 0;
  AdController.destroyResult();
  void SoundController.clearAllSounds();
  showWords();
}

/** Frees the test words DOM once the result is shown. */
export function clearWords(): void {
  WordsRender.reset();
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
    words: ElementWithUtils;
    wordsWrapper: ElementWithUtils;
    typingTest: ElementWithUtils;
  },
  signal: AbortSignal,
): void {
  wordsRef = refs.words;
  wordsWrapperRef = refs.wordsWrapper;
  typingTestRef = refs.typingTest;
  signal.addEventListener("abort", () => {
    // a remount may have registered new elements already
    if (wordsRef === refs.words) wordsRef = undefined;
    if (wordsWrapperRef === refs.wordsWrapper) wordsWrapperRef = undefined;
    if (typingTestRef === refs.typingTest) typingTestRef = undefined;
  });
  markTestPageMounted(signal);
  // stays registered across remounts, layoutWords bails while unmounted
  WordsRender.setLayoutHook(layoutWords);

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
      () => Joining.update("typedEffect", wordsEl()),
      { defer: true },
    ),
  );
  createEffect(
    on(
      () => [getConfig.fontFamily, getConfig.fontSize, getFontPreview()],
      () => {
        Joining.update("fontSize", wordsEl());
        void updateHintsPositionDebounced();
      },
      { defer: true },
    ),
  );

  // autofocus the words when typing anywhere on the page
  document.addEventListener("keydown", autofocusWords, { signal });

  const recenter = debounce(250, () => {
    if (isTestFinished()) return;
    if (Config.tapeMode !== "off") {
      void scrollTape();
    } else {
      void centerActiveLine();
      void updateHintsPositionDebounced();
    }
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

export const __testing = {
  updateWordsWrapperHeight,
};
