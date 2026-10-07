import { Config } from "../config/store";
import * as TestWords from "./test-words";
import { getCurrentInput } from "./events/data";
import { getLiveCachedAccuracy } from "./events/live-cache";
import * as CustomText from "./custom-text";
import * as Caret from "./caret";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as CompositionState from "../legacy-states/composition";
import { configEvent } from "../events/config";
import * as ResultWordHighlight from "../components/pages/test/result/result-word-highlight";
import { getActivePage } from "../states/core";
import { convertRemToPixels } from "../utils/numbers";
import { findSingleActiveFunboxWithFunction } from "./funbox/list";
import * as PaceCaret from "./pace-caret";
import {
  cancelPendingAnimationFramesStartingWith,
  requestDebouncedAnimationFrame,
} from "../utils/debounced-animation-frame";
import * as SoundController from "../controllers/sound-controller";
import * as Numbers from "@monkeytype/util/numbers";
import { highlight } from "../events/keymap";
import * as Focus from "../test/focus";
import {
  blurInputElement,
  focusInputElement,
  getInputElement,
  isInputElementFocused,
} from "../input/input-element";
import * as MonkeyPower from "../elements/monkey-power";
import * as SlowTimer from "../legacy-states/slow-timer";
import * as AdController from "../controllers/ad-controller";
import * as Joining from "./break-joining";
import * as ThemeController from "../controllers/theme-controller";
import {
  ElementsWithUtils,
  ElementWithUtils,
  qs,
  qsa,
  lazyQsr,
} from "../utils/dom";
import { skipBreakdownEvent } from "../states/header";
import {
  isDirectionReversed,
  isLanguageRightToLeft,
  getActiveWordIndex,
  isTestActive,
  setCompositionText,
  setCurrentLiveStats,
  setOutOfFocusMaxHeight,
  wordsHaveNewline,
  setTestFocusState,
  showOutOfFocusWarning,
  getResultVisible,
  isWordsHidden,
  isWordsWrapperHidden,
  setWordsWrapperHidden,
  isReadAheadDisabled,
  isErrorBorderDisabled,
  setLayoutfluidTimerVisible,
  setTestInitError,
  setTestInitFailed,
} from "../states/test";
import { createEffect } from "solid-js";
import * as ConnectionState from "../legacy-states/connection";
import { setShowResult, setResultWordsJoiningScript } from "../states/result";

export const updateHintsPositionDebounced = Misc.debounceUntilResolved(
  updateHintsPosition,
  { rejectSkippedCalls: false },
);

const wordsEl = lazyQsr(".pageTest #words");
const wordsWrapperEl = lazyQsr(".pageTest #wordsWrapper");

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
    const typingTest = document.querySelector<HTMLElement>("#typingTest");
    Misc.scrollToCenterOrTop(typingTest);
  }
}

export function keepWordsInputInTheCenter(force = false): void {
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
 * False once a word has scrolled off (line jump / tape removes it from the DOM).
 */
export function isWordRendered(index: number): boolean {
  return getWordElement(index) !== null;
}

function getActiveWordElement(): ElementWithUtils | null {
  return getWordElement(getActiveWordIndex());
}

export function updateActiveElement(
  options:
    | { direction: "forward" | "back"; initial?: undefined }
    | { direction?: undefined; initial: true },
): void {
  requestDebouncedAnimationFrame("test-ui.updateActiveElement", async () => {
    const { direction, initial } = options;

    let previousActiveWordTop: number | null = null;
    if (initial === undefined) {
      const previousActiveWord = wordsEl().qs(".active");
      // in zen mode, because of the animation frame, previousActiveWord will be removed at this point, so check for null
      if (previousActiveWord !== null) {
        if (direction === "forward") {
          previousActiveWord.addClass("typed");
          Joining.set(previousActiveWord, true);
        } else if (direction === "back") {
          //
        }
        previousActiveWord.removeClass("active");
        previousActiveWordTop = previousActiveWord.getOffsetTop();
      }
    }

    const newActiveWord = getActiveWordElement();
    if (newActiveWord === null) {
      throw new Error("activeWord is null - can't update active element");
    }

    newActiveWord.addClass("active");
    newActiveWord.removeClass("error");
    newActiveWord.removeClass("typed");
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

    if (!initial && Config.tapeMode !== "off") {
      await scrollTape();
    }

    updateWordsInputPosition();
  });
}

function createHintsHtml(
  incorrectLettersIndices: number[][],
  activeWordLetters: ElementsWithUtils,
  input: string | string[],
  wrapWithDiv: boolean = true,
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
  if (wrapWithDiv) hintsHtml = `<div class="hints">${hintsHtml}</div>`;
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
    getActivePage() !== "test" ||
    getResultVisible() ||
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
      false,
    );
    const wordHintsElements = wordElement.native.getElementsByTagName("hint");
    await joinOverlappingHints(hintIndices, letterElements, wordHintsElements);
  }
}

function buildWordHTML(word: string, wordIndex: number): string {
  let newlineafter = false;
  let retval = `<div class='word' data-wordindex='${wordIndex}'>`;

  const funbox = findSingleActiveFunboxWithFunction("getWordHtml");
  const chars = Strings.splitIntoCharacters(word);
  for (const char of chars) {
    if (funbox) {
      retval += funbox.functions.getWordHtml(char, true);
    } else if (char === "\t") {
      retval += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
    } else if (char === "\n") {
      newlineafter = true;
      retval += `<letter class='nlChar'><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
    } else {
      retval += `<letter>${char}</letter>`;
    }
  }
  retval += "</div>";
  if (newlineafter) {
    retval +=
      "<div class='beforeNewline'></div><div class='newline'></div><div class='afterNewline'></div>";
  }
  return retval;
}

function updateWordWrapperClasses(): void {
  // outoffocus applies transition, need to remove it
  setTestFocusState("focused");

  if (Config.tapeMode !== "off") {
    wordsEl().addClass("tape");
    wordsWrapperEl().addClass("tape");
  } else {
    wordsEl().removeClass("tape");
    wordsWrapperEl().removeClass("tape");
  }

  if (Config.blindMode) {
    wordsEl().addClass("blind");
    wordsWrapperEl().addClass("blind");
  } else {
    wordsEl().removeClass("blind");
    wordsWrapperEl().removeClass("blind");
  }

  if (Config.indicateTypos === "below" || Config.indicateTypos === "both") {
    wordsEl().addClass("indicateTyposBelow");
    wordsWrapperEl().addClass("indicateTyposBelow");
  } else {
    wordsEl().removeClass("indicateTyposBelow");
    wordsWrapperEl().removeClass("indicateTyposBelow");
  }

  if (Config.hideExtraLetters) {
    wordsEl().addClass("hideExtraLetters");
    wordsWrapperEl().addClass("hideExtraLetters");
  } else {
    wordsEl().removeClass("hideExtraLetters");
    wordsWrapperEl().removeClass("hideExtraLetters");
  }

  if (Config.flipTestColors) {
    wordsEl().addClass("flipped");
  } else {
    wordsEl().removeClass("flipped");
  }

  if (Config.colorfulMode) {
    wordsEl().addClass("colorfulMode");
  } else {
    wordsEl().removeClass("colorfulMode");
  }

  qsa("#caret, #paceCaret, #typingTest, #wordsInput").setStyle({
    fontSize: `${Config.fontSize}rem`,
  });

  if (isLanguageRightToLeft()) {
    wordsEl().addClass("rightToLeftTest");
  } else {
    wordsEl().removeClass("rightToLeftTest");
  }

  const existing =
    wordsEl()
      .native.className.split(/\s+/)
      .filter(
        (className) =>
          !className.startsWith("highlight-") &&
          !className.startsWith("typed-effect-"),
      ) ?? [];
  if (Config.highlightMode !== null) {
    existing.push(`highlight-${Config.highlightMode.replaceAll("_", "-")}`);
  }
  if (Config.typedEffect !== null) {
    existing.push(`typed-effect-${Config.typedEffect.replaceAll("_", "-")}`);
  }

  wordsEl().native.className = existing.join(" ");

  updateWordsWidth();
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
  wordsEl().setHtml("");

  if (Config.mode === "zen") {
    appendEmptyWordElement(0);
  } else {
    let wordsHTML = "";
    for (let i = 0; i < TestWords.words.length; i++) {
      const word = TestWords.words.get(i);
      if (word === undefined) continue; // won't happen, but ts complains
      wordsHTML += buildWordHTML(word.display, i);
    }
    wordsEl().setHtml(wordsHTML);
  }

  updateActiveElement({
    initial: true,
  });
  updateWordWrapperClasses();
  PaceCaret.resetCaretPosition();
}

export function appendEmptyWordElement(index: number): void {
  wordsEl().appendHtml(
    `<div class='word' data-wordindex='${index}'><letter class='invisible'>_</letter></div>`,
  );
}

export function updateWordsInputPosition(): void {
  if (getActivePage() !== "test") return;
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

export function updateWordsWrapperHeight(force = false): void {
  if (getActivePage() !== "test" || getResultVisible()) return;
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

export function addWord(
  word: string,
  wordIndex = TestWords.words.length - 1,
): void {
  // if the current active word is the last word, we need to NOT use raf
  // because other ui parts depend on the word existing
  if (getActiveWordIndex() === wordIndex - 1) {
    wordsEl().appendHtml(buildWordHTML(word, wordIndex));
  } else {
    requestAnimationFrame(async () => {
      wordsEl().appendHtml(buildWordHTML(word, wordIndex));
    });
  }

  // maybe ill come back to this
  // requestAnimationFrame(async () => {
  //   wordsEl().insertAdjacentHTML("beforeend", buildWordHTML(word, wordIndex));
  //   // in case word addition took a long time and some input happened in the mean time
  //   // we need to update word letters for that word
  //   const inputHistory = [
  //     ...getInputHistory(),
  //     getCurrentInput(),
  //   ];
  //   const input = inputHistory[wordIndex];
  //   if (input !== undefined && input !== "") {
  //     await updateWordLetters({
  //       wordIndex,
  //       input,
  //       compositionData: CompositionState.getData(),
  //     });
  //   }
  // });
}

// because of the requestAnimationFrame, multiple calls to updateWordLetters
// can be made before the actual update happens. This map keeps track of the
// latest input for each word and is used in before-insert-text to
// make sure the currently typed word will not overflow to the next line
const pendingWordData: Map<number, string> = new Map();

const TAB_ICON = `<i class="fas fa-long-arrow-alt-right fa-fw"></i>`;
const NEWLINE_ICON = `<i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i>`;

// visible form of a typed character: space -> "_", tab/newline -> their icons
function displayTypedChar(char: string | undefined): string {
  if (char === " ") return "_";
  if (char === "\t") return TAB_ICON;
  if (char === "\n") return NEWLINE_ICON;
  return char ?? "";
}

export async function updateWordLetters({
  wordIndex,
  input,
  compositionData,
}: {
  wordIndex: number;
  input: string;
  compositionData: string;
}): Promise<void> {
  pendingWordData.set(wordIndex, input);
  requestDebouncedAnimationFrame(
    `test-ui.updateWordLetters.${wordIndex}`,
    async () => {
      pendingWordData.delete(wordIndex);
      const currentWord = TestWords.words.get(wordIndex)?.display;
      if (currentWord === undefined && Config.mode !== "zen") return;
      let ret = "";
      const wordAtIndex = getWordElement(wordIndex);
      if (!wordAtIndex) return;
      const hintIndices: number[][] = [];

      let newlineafter = false;

      if (Config.mode === "zen") {
        for (const char of input) {
          if (char === "\t") {
            ret += `<letter class='tabChar correct' style="opacity: 0"><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
          } else if (char === "\n") {
            newlineafter = true;
            ret += `<letter class='nlChar correct' style="opacity: 0"><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
          } else {
            ret += `<letter class="correct">${char}</letter>`;
          }
        }
        if (input === "" && compositionData === "") {
          ret += `<letter class='invisible'>_</letter>`;
        }

        for (const char of compositionData) {
          ret += `<letter class="dead">${char}</letter>`;
        }
      } else {
        const funbox = findSingleActiveFunboxWithFunction("getWordHtml");

        const inputChars = Strings.splitIntoCharacters(input);
        const currentWordChars = Strings.splitIntoCharacters(currentWord ?? "");
        for (let i = 0; i < inputChars.length; i++) {
          const charCorrect = currentWordChars[i] === inputChars[i];

          let currentLetter = currentWordChars[i] as string;
          let tabChar = "";
          let nlChar = "";
          if (funbox) {
            const cl = funbox.functions.getWordHtml(currentLetter);
            if (cl !== "") {
              currentLetter = cl;
            }
          } else if (currentLetter === "\t") {
            tabChar = "tabChar";
            currentLetter = `<i class="fas fa-long-arrow-alt-right fa-fw"></i>`;
          } else if (currentLetter === "\n") {
            nlChar = "nlChar";
            currentLetter = `<i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i>`;
          }

          if (charCorrect) {
            ret += `<letter class="correct ${tabChar}${nlChar}">${currentLetter}</letter>`;
          } else if (currentLetter === undefined) {
            const letter = displayTypedChar(inputChars[i]);
            ret += `<letter class="incorrect extra ${tabChar}${nlChar}">${letter}</letter>`;
          } else {
            let charString = currentLetter;

            if (
              Config.indicateTypos === "replace" ||
              Config.indicateTypos === "both"
            ) {
              charString = displayTypedChar(inputChars[i] ?? currentLetter);
            }

            ret += `<letter class="incorrect ${tabChar}${nlChar}">${charString}</letter>`;
            if (
              Config.indicateTypos === "below" ||
              Config.indicateTypos === "both"
            ) {
              const lastBlock = hintIndices[hintIndices.length - 1];
              if (lastBlock?.[lastBlock.length - 1] === i - 1) {
                lastBlock.push(i);
              } else {
                hintIndices.push([i]);
              }
            }
          }
        }

        for (let i = 0; i < compositionData.length; i++) {
          const compositionChar = compositionData[i];
          let charToShow =
            currentWordChars[input.length + i] ?? compositionChar;

          if (Config.compositionDisplay === "replace") {
            charToShow = compositionChar === " " ? "_" : compositionChar;
          }

          let correctClass = "";
          if (compositionChar === currentWordChars[input.length + i]) {
            correctClass = "correct";
          }

          ret += `<letter class="dead ${correctClass}">${charToShow}</letter>`;
        }

        for (
          let i = inputChars.length + compositionData.length;
          i < currentWordChars.length;
          i++
        ) {
          const currentLetter = currentWordChars[i];
          if (funbox?.functions?.getWordHtml) {
            ret += funbox.functions.getWordHtml(currentLetter as string, true);
          } else if (currentLetter === "\t") {
            ret += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
          } else if (currentLetter === "\n") {
            ret += `<letter class='nlChar'><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
          } else {
            ret += `<letter>${currentLetter}</letter>`;
          }
        }
      }

      wordAtIndex.setHtml(ret);

      if (hintIndices?.length) {
        const wordAtIndexLetters = wordAtIndex.qsa("letter");
        let hintsHtml;
        if (Config.indicateTypos === "both") {
          hintsHtml = createHintsHtml(
            hintIndices,
            wordAtIndexLetters,
            currentWord ?? "",
          );
        } else {
          hintsHtml = createHintsHtml(hintIndices, wordAtIndexLetters, input);
        }
        wordAtIndex.appendHtml(hintsHtml);
        const hintElements = wordAtIndex.native.getElementsByTagName("hint");
        await joinOverlappingHints(
          hintIndices,
          wordAtIndexLetters,
          hintElements,
        );
      }

      if (newlineafter) {
        wordAtIndex.native.insertAdjacentHTML(
          "afterend",
          "<div class='beforeNewline'></div><div class='newline'></div><div class='afterNewline'></div>",
        );
      }
      if (Config.tapeMode !== "off") {
        void scrollTape();
      }
      if (Config.mode === "zen" || SlowTimer.get()) {
        // because we block word jumps in before-insert-text
        // this check only needs to happen in zen mode
        // unless slow timer is on, then it needs to happen
        // because the word jump check is disabled
        if (!Config.showAllLines) {
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
      }
    }, //end of raf
  );
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
  if (getActivePage() !== "test" || getResultVisible()) return;

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
  let leadingNewLine = false;
  let lastAfterNewLineElement = undefined;
  let widthRemoved = 0;
  const widthRemovedFromLine: number[] = [];
  const afterNewlinesNewMargins: number[] = [];
  const toRemove: ElementWithUtils[] = [];
  let removedAfterNewlines = 0;

  /* remove leading `.afterNewline` elements */
  for (const child of wordsChildrenArr) {
    if (child.hasClass("word")) {
      // only last leading `.afterNewline` element pushes `.word`s to right
      if (lastAfterNewLineElement) {
        widthRemoved += parseFloat(
          lastAfterNewLineElement.getStyle().marginLeft,
        );
      }
      break;
    } else if (child.hasClass("afterNewline")) {
      toRemove.push(child);
      leadingNewLine = true;
      lastAfterNewLineElement = child;
      removedAfterNewlines++;
    }
  }

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
      leadingNewLine = false;
      const wordOuterWidth = child.getOuterWidth();
      const wordLeft = Math.floor(child.getOffsetLeft());
      const wordWidth = Math.floor(child.getOffsetWidth());
      if (
        (!isTestRightToLeft && wordLeft < 0 - wordWidth) ||
        (isTestRightToLeft && wordLeft > wordsWrapperWidth)
      ) {
        toRemove.push(child);
        widthRemoved += wordOuterWidth;
      } else {
        fullLineWidths += wordOuterWidth;
        if (i < activeWordIndex) wordsWidthBeforeActive = fullLineWidths;
      }
    } else if (child.hasClass("afterNewline")) {
      if (leadingNewLine) continue;
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
  if (toRemove.length > 0) {
    for (const el of toRemove) el.remove();
    afterNewLineEls.splice(0, removedAfterNewlines);
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
    Caret.caret.handleTapeWordsRemoved(widthRemoved);
    PaceCaret.caret.handleTapeWordsRemoved(widthRemoved);
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

  Caret.caret.handleTapeScroll(caretScrollOptions);
  PaceCaret.caret.handleTapeScroll(caretScrollOptions);

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

function removeTestElements(lastElementIndexToRemove: number): void {
  const wordsChildren = wordsEl().getChildren();

  if (wordsChildren === undefined) return;

  for (let i = lastElementIndexToRemove; i >= 0; i--) {
    const child = wordsChildren[i];
    if (!child || !child.native.isConnected) continue;
    child.remove();
  }
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
    Caret.caret.handleLineJump(caretLineJumpOptions);
    PaceCaret.caret.handleLineJump(caretLineJumpOptions);

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

export function setJoiningClass(isEnabled: boolean): void {
  const joining =
    isEnabled || Config.mode === "custom" || Config.mode === "zen";
  wordsEl().toggleClass("joiningScript", joining);
  setResultWordsJoiningScript(joining);
}

export function highlightBadWord(index: number): void {
  requestDebouncedAnimationFrame(`test-ui.highlightBadWord.${index}`, () => {
    getWordElement(index)?.addClass("error");
  });
}

export function highlightAllLettersAsCorrect(wordIndex: number): void {
  requestDebouncedAnimationFrame(
    `test-ui.highlightAllLettersAsCorrect.${wordIndex}`,
    () => {
      const letters = getWordElement(wordIndex)?.getChildren();
      for (const letter of letters ?? []) {
        letter.addClass("correct");
      }
    },
  );
}

function updateWordsWidth(): void {
  let css: Record<string, string> = {};
  if (Config.tapeMode === "off") {
    if (Config.maxLineWidth === 0) {
      css = {
        "max-width": "100%",
      };
    } else {
      css = {
        "max-width": `${Config.maxLineWidth}ch`,
      };
    }
  } else {
    if (Config.maxLineWidth === 0) {
      css = {
        "max-width": "100%",
      };
    } else {
      css = {
        "max-width": "100%",
      };
    }
  }
  const el = qs("#typingTest");
  el?.setStyle(css);
  if (Config.maxLineWidth === 0) {
    el?.removeClass("full-width-padding").addClass("content");
  } else {
    el?.removeClass("content").addClass("full-width-padding");
  }
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
  const pending = pendingWordData.get(getActiveWordIndex());
  const { top, height } = getActiveWordTopAndHeightWithDifferentData(
    (pending ?? inputValue) + data,
  );
  // word jumped to next line, or letters wrapped to next line
  return top > activeWordTop || height > activeWordHeight;
}

function getActiveWordTopAndHeightWithDifferentData(data: string): {
  top: number;
  height: number;
} {
  const activeWord = getActiveWordElement();

  if (!activeWord) throw new Error("No active word element found");

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
      highlight(keyToHighlight);
    }
  }

  Focus.set(true);
  Caret.stopAnimation();
  Caret.updatePosition();
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

  void updateWordLetters({
    input,
    wordIndex: getActiveWordIndex(),
    compositionData: CompositionState.getData(),
  });

  afterAnyTestInput("textInput", correct);
}

export function afterTestCompositionUpdate(): void {
  void updateWordLetters({
    input: getCurrentInput(),
    wordIndex: getActiveWordIndex(),
    compositionData: CompositionState.getData(),
  });
  // correct needs to be true to get the normal click sound
  afterAnyTestInput("compositionUpdate", true);
}

export function afterTestDelete(): void {
  void updateWordLetters({
    input: getCurrentInput(),
    wordIndex: getActiveWordIndex(),
    compositionData: CompositionState.getData(),
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
    void updateWordLetters({
      input: getCurrentInput(),
      wordIndex: getActiveWordIndex(),
      compositionData: CompositionState.getData(),
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
  updateActiveElement({
    direction,
  });
  Caret.updatePosition();

  if (lastBurst !== null && Numbers.isSafeNumber(lastBurst)) {
    setCurrentLiveStats({ burst: Math.round(lastBurst) });
  }

  if (Config.keymapMode === "next") {
    const keyToHighlight =
      TestWords.words.getCurrent()?.textWithCommit[getCurrentInput().length];
    if (keyToHighlight !== undefined) {
      highlight(keyToHighlight);
    }
  }

  if (direction === "forward") {
    //
  } else if (direction === "back") {
    if (Config.mode === "zen") {
      // because we need to delete newline, beforenewline and afternewline elements which dont have wordindex attributes
      // we need to do this loop thingy and delete all elements after the active word
      let deleteElements = false;
      for (const child of wordsEl().getChildren()) {
        if (deleteElements) {
          child.remove();
          continue;
        }
        const attr = child.getAttribute("data-wordindex");
        if (attr === null) continue;
        const wordIndex = parseInt(attr, 10);
        if (wordIndex === getActiveWordIndex()) {
          deleteElements = true;
        }
      }
    }
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

export async function fadeOutForRestart(
  source: "testPage" | "resultPage",
  noAnim: boolean,
): Promise<void> {
  const selector = source === "resultPage" ? "#result" : "#typingTest";
  await qs(selector)?.promiseAnimate({
    opacity: 0,
    duration: getRestartAnimationTime(noAnim),
  });
}

export async function fadeInAfterRestart(noAnim: boolean): Promise<void> {
  const typingTestEl = qs("#typingTest");
  await typingTestEl?.promiseAnimate({
    opacity: [0, 1],
    onBegin: () => {
      typingTestEl.removeClass("hidden");
    },
    duration: getRestartAnimationTime(noAnim),
  });
}

export function onTestRestart(source: "testPage" | "resultPage"): void {
  setShowResult(false);
  qs("#typingTest")?.setStyle({ opacity: "0" }).show();
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

  if (!ConnectionState.get()) {
    ConnectionState.showOfflineBanner();
  }

  if (source === "resultPage") {
    if (Config.randomTheme !== "off") {
      void ThemeController.randomizeTheme();
    }
    skipBreakdownEvent.dispatch();
  }

  currentTestLine = 0;
  if (getActivePage() === "test") {
    AdController.updateFooterAndVerticalAds(false);
  }
  AdController.destroyResult();
  if (Config.compositionDisplay === "below") {
    setCompositionText(" ");
  }
  void SoundController.clearAllSounds();
  cancelPendingAnimationFramesStartingWith("test-ui");
  showWords();
}

/** Frees the test words DOM once the result is shown. */
export function clearWords(): void {
  wordsEl().empty();
}

export function onTestFinish(): void {
  Caret.hide();
  setTestFocusState("focused");
  if (Config.playSoundOnClick === "16") {
    void SoundController.playFartReverb();
  }
}

/**
 * Binds listeners and effects that need the test page DOM.
 * Called once the TestPage component has mounted.
 */
export function init(): void {
  // #words is still vanilla; the warning itself is Solid (OutOfFocusWarning.tsx).
  // show/hideOutOfFocus live in states/test so commandline needn't import test-ui.
  createEffect(() => {
    if (showOutOfFocusWarning()) {
      wordsEl().setStyle({ transition: "0.25s" })?.addClass("blurred");
    } else {
      wordsEl().setStyle({ transition: "none" })?.removeClass("blurred");
    }
  });

  createEffect(() => {
    wordsEl().toggleClass("hidden", isWordsHidden());
  });
  createEffect(() => {
    wordsWrapperEl().toggleClass("hidden", isWordsWrapperHidden());
  });
  createEffect(() => {
    wordsEl().toggleClass("read_ahead_disabled", isReadAheadDisabled());
  });
  createEffect(() => {
    wordsEl().toggleClass("noErrorBorder", isErrorBorderDisabled());
  });

  qs("#wordsInput")?.on("focus", () => {
    if (!isInputElementFocused()) return;
    if (!getResultVisible() && Config.showOutOfFocusWarning) {
      setTestFocusState("focused");
    }
    Caret.show(true);
  });

  qs("#wordsInput")?.on("focusout", () => {
    if (!isInputElementFocused()) {
      setTestFocusState("unfocused");
    }
    Caret.hide();
  });
}

addEventListener("resize", () => {
  ResultWordHighlight.destroy();
});

qs(".pageTest")?.onChild("click", "#wordsWrapper", () => {
  focusWords();
});

window.addEventListener("blur", () => {
  setTestFocusState("unfocusedWindow");
});

// little roadblock for basic cheating
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "hidden") return;
  setTestFocusState("unfocusedWindow");
});

configEvent.subscribe(({ key, newValue }) => {
  if (key === "showOutOfFocusWarning" && !newValue) {
    setTestFocusState("focused");
  }
  if (key === "compositionDisplay" && newValue === "below") {
    setCompositionText(" ");
  }
  if (
    ["fontSize", "fontFamily", "blindMode", "hideExtraLetters"].includes(
      key ?? "",
    )
  ) {
    void updateHintsPositionDebounced();
  }
  if (key === "highlightMode") {
    if (getActivePage() === "test") {
      void updateWordLetters({
        input: getCurrentInput(),
        wordIndex: getActiveWordIndex(),
        compositionData: CompositionState.getData(),
      });
    }
  }
  if (
    [
      "highlightMode",
      "typedEffect",
      "blindMode",
      "indicateTypos",
      "tapeMode",
      "hideExtraLetters",
      "flipTestColors",
      "colorfulMode",
      "showAllLines",
      "fontSize",
      "fontFamily",
      "maxLineWidth",
      "tapeMargin",
    ].includes(key)
  ) {
    if (key !== "fontFamily") updateWordWrapperClasses();
    if (["typedEffect", "fontFamily", "fontSize"].includes(key)) {
      Joining.update(key, wordsEl());
    }
  }
});
