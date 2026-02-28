import * as Notifications from "../elements/notifications";
import Config, { setConfig } from "../config";
import * as TestWords from "./test-words";
import * as TestInput from "./test-input";
import * as CustomText from "./custom-text";
import * as Caret from "./caret";
import * as OutOfFocus from "./out-of-focus";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import { blendTwoHexColors } from "../utils/colors";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as CompositionState from "../states/composition";
import * as ConfigEvent from "../observables/config-event";
import * as Hangul from "hangul-js";
import * as ResultWordHighlight from "../elements/result-word-highlight";
import { getActivePage } from "../signals/core";
import Format from "../utils/format";
import { TimerColor, TimerOpacity } from "@monkeytype/schemas/configs";
import { convertRemToPixels } from "../utils/numbers";
import {
  findSingleActiveFunboxWithFunction,
  isFunboxActiveWithProperty,
} from "./funbox/list";
import * as TestState from "./test-state";
import * as PaceCaret from "./pace-caret";
import {
  cancelPendingAnimationFramesStartingWith,
  requestDebouncedAnimationFrame,
} from "../utils/debounced-animation-frame";
import * as SoundController from "../controllers/sound-controller";
import * as Numbers from "@monkeytype/util/numbers";
import * as TestStats from "./test-stats";
import * as KeymapEvent from "../observables/keymap-event";
import * as LiveAcc from "./live-acc";
import * as Focus from "../test/focus";
import * as TimerProgress from "../test/timer-progress";
import * as LiveBurst from "./live-burst";
import * as LiveSpeed from "./live-speed";
import * as Monkey from "./monkey";
import {
  blurInputElement,
  focusInputElement,
  getInputElement,
  isInputElementFocused,
} from "../input/input-element";
import * as MonkeyPower from "../elements/monkey-power";
import * as SlowTimer from "../states/slow-timer";
import * as TestConfig from "./test-config";
import * as CompositionDisplay from "../elements/composition-display";
import * as AdController from "../controllers/ad-controller";
import * as Ligatures from "./break-ligatures";
import * as LayoutfluidFunboxTimer from "../test/funbox/layoutfluid-funbox-timer";
import * as Keymap from "../elements/keymap";
import * as ThemeController from "../controllers/theme-controller";
import * as XPBar from "../elements/xp-bar";
import * as ModesNotice from "../elements/modes-notice";
import * as Last10Average from "../elements/last-10-average";
import * as MemoryFunboxTimer from "./funbox/memory-funbox-timer";
import {
  ElementsWithUtils,
  ElementWithUtils,
  qs,
  qsa,
  qsr,
} from "../utils/dom";
import { getTheme } from "../signals/theme";

export const updateHintsPositionDebounced = Misc.debounceUntilResolved(
  updateHintsPosition,
  { rejectSkippedCalls: false },
);

const wordsEl = qsr(".pageTest #words");
const wordsWrapperEl = qsr(".pageTest #wordsWrapper");
const resultWordsHistoryEl = qsr(".pageTest #resultWordsHistory");

export let activeWordTop = 0;
export let activeWordHeight = 0;
export let lineTransition = false;
export let currentTestLine = 0;
export let resultCalculating = false;

export function setResultCalculating(val: boolean): void {
  resultCalculating = val;
}

export function focusWords(force = false): void {
  if (force) {
    blurInputElement();
  }
  focusInputElement(true);
  if (TestState.isActive) {
    keepWordsInputInTheCenter(true);
  } else {
    const typingTest = document.querySelector<HTMLElement>("#typingTest");
    Misc.scrollToCenterOrTop(typingTest);
  }
}

export function keepWordsInputInTheCenter(force = false): void {
  const wordsInput = getInputElement();
  if (wordsInput === null || wordsWrapperEl === null) return;

  const wordsWrapperHeight = wordsWrapperEl.getOffsetHeight();
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

export function getWordElement(index: number): ElementWithUtils | null {
  const el = wordsEl.qs(`.word[data-wordindex='${index}']`);
  return el;
}

export function getActiveWordElement(): ElementWithUtils | null {
  return getWordElement(TestState.activeWordIndex);
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
      const previousActiveWord = wordsEl.qs(".active");
      // in zen mode, because of the animation frame, previousActiveWord will be removed at this point, so check for null
      if (previousActiveWord !== null) {
        if (direction === "forward") {
          previousActiveWord.addClass("typed");
          Ligatures.set(previousActiveWord, true);
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
    Ligatures.set(newActiveWord, false);

    activeWordTop = newActiveWord.getOffsetTop();
    activeWordHeight = newActiveWord.getOffsetHeight();

    updateWordsInputPosition();

    if (previousActiveWordTop === null) return;

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

    if (!initial && Config.tapeMode !== "off") {
      await scrollTape();
    }
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
  const [isWordRightToLeft, _isFullMatch] = Strings.isWordRightToLeft(
    TestWords.words.getCurrent(),
    TestState.isLanguageRightToLeft,
    TestState.isDirectionReversed,
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
      hintBlock1.style.left =
        block1Letter1Pos + bothBlocksLettersWidthHalved + "px";

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
    TestState.resultVisible ||
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
      if (
        lastBlock &&
        lastBlock[lastBlock.length - 1] === currentLetterIndex - 1
      ) {
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
      retval += "<letter>" + char + "</letter>";
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
  OutOfFocus.hide();

  if (Config.tapeMode !== "off") {
    wordsEl.addClass("tape");
    wordsWrapperEl.addClass("tape");
  } else {
    wordsEl.removeClass("tape");
    wordsWrapperEl.removeClass("tape");
  }

  if (Config.blindMode) {
    wordsEl.addClass("blind");
    wordsWrapperEl.addClass("blind");
  } else {
    wordsEl.removeClass("blind");
    wordsWrapperEl.removeClass("blind");
  }

  if (Config.indicateTypos === "below" || Config.indicateTypos === "both") {
    wordsEl.addClass("indicateTyposBelow");
    wordsWrapperEl.addClass("indicateTyposBelow");
  } else {
    wordsEl.removeClass("indicateTyposBelow");
    wordsWrapperEl.removeClass("indicateTyposBelow");
  }

  if (Config.hideExtraLetters) {
    wordsEl.addClass("hideExtraLetters");
    wordsWrapperEl.addClass("hideExtraLetters");
  } else {
    wordsEl.removeClass("hideExtraLetters");
    wordsWrapperEl.removeClass("hideExtraLetters");
  }

  if (Config.flipTestColors) {
    wordsEl.addClass("flipped");
  } else {
    wordsEl.removeClass("flipped");
  }

  if (Config.colorfulMode) {
    wordsEl.addClass("colorfulMode");
  } else {
    wordsEl.removeClass("colorfulMode");
  }

  qsa(
    "#caret, #paceCaret, #liveStatsMini, #typingTest, #wordsInput, #compositionDisplay",
  ).setStyle({ fontSize: Config.fontSize + "rem" });

  if (TestState.isLanguageRightToLeft) {
    wordsEl.addClass("rightToLeftTest");
    qs("#resultWordsHistory .words")?.addClass("rightToLeftTest");
    qs("#resultReplay .words")?.addClass("rightToLeftTest");
  } else {
    wordsEl.removeClass("rightToLeftTest");
    qs("#resultWordsHistory .words")?.removeClass("rightToLeftTest");
    qs("#resultReplay .words")?.removeClass("rightToLeftTest");
  }

  const existing =
    wordsEl.native.className
      .split(/\s+/)
      .filter(
        (className) =>
          !className.startsWith("highlight-") &&
          !className.startsWith("typed-effect-"),
      ) ?? [];
  if (Config.highlightMode !== null) {
    existing.push("highlight-" + Config.highlightMode.replaceAll("_", "-"));
  }
  if (Config.typedEffect !== null) {
    existing.push("typed-effect-" + Config.typedEffect.replaceAll("_", "-"));
  }

  wordsEl.native.className = existing.join(" ");

  updateWordsWidth();
  updateWordsWrapperHeight(true);
  if (!Config.showAllLines) {
    void centerActiveLine();
  }
  updateWordsMargin();
  updateWordsInputPosition();
  void updateHintsPositionDebounced();
  Caret.updatePosition();

  if (!isInputElementFocused()) {
    OutOfFocus.show();
  }
}

function showWords(): void {
  wordsEl.setHtml("");

  if (Config.mode === "zen") {
    appendEmptyWordElement();
  } else {
    let wordsHTML = "";
    for (let i = 0; i < TestWords.words.length; i++) {
      wordsHTML += buildWordHTML(TestWords.words.get(i), i);
    }
    wordsEl.setHtml(wordsHTML);
  }

  updateActiveElement({
    initial: true,
  });
  updateWordWrapperClasses();
  PaceCaret.resetCaretPosition();
}

export function appendEmptyWordElement(
  index = TestInput.input.getHistory().length,
): void {
  wordsEl.appendHtml(
    `<div class='word' data-wordindex='${index}'><letter class='invisible'>_</letter></div>`,
  );
}

export function updateWordsInputPosition(): void {
  if (getActivePage() !== "test") return;
  const isTestRightToLeft = TestState.isDirectionReversed
    ? !TestState.isLanguageRightToLeft
    : TestState.isLanguageRightToLeft;

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
    el.style.width = letterHeight + "px";
  } else {
    el.style.width = activeWord.getOffsetWidth() + "px";
  }

  el.style.top = targetTop + "px";

  if (Config.tapeMode !== "off") {
    el.style.left = `${
      wordsWrapperEl.getOffsetWidth() * (Config.tapeMargin / 100)
    }px`;
  } else {
    if (activeWord.getOffsetWidth() < letterHeight && isTestRightToLeft) {
      el.style.left = activeWord.getOffsetLeft() - letterHeight + "px";
    } else {
      el.style.left = Math.max(0, activeWord.getOffsetLeft()) + "px";
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
  for (let i = TestState.activeWordIndex - 1; i >= 0; i--) {
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
  if (getActivePage() !== "test" || TestState.resultVisible) return;
  if (!force && Config.mode !== "custom") return;
  const outOfFocusEl = document.querySelector(
    ".outOfFocusWarning",
  ) as HTMLElement;
  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) return;

  wordsWrapperEl.removeClass("hidden");

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
    wordsWrapperEl.setStyle({ height: "" });
  } else if (Config.mode === "zen") {
    //zen mode, showAllLines off
    wordsWrapperEl.setStyle({ height: wordHeight * 2 + "px" });
  } else {
    if (Config.tapeMode === "off") {
      //tape off, showAllLines off, non-zen mode
      const wordElements = wordsEl.qsa(".word");
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
      wordsWrapperEl.setStyle({ height: wrapperHeight + "px" });
    } else {
      //show 3 lines if tape mode is on and has newlines, otherwise use words height (because of indicate typos: below)
      if (TestWords.hasNewline) {
        wordsWrapperEl.setStyle({ height: wordHeight * 3 + "px" });
      } else {
        const wordsHeight = wordsEl.getOffsetHeight() ?? wordHeight;
        wordsWrapperEl.setStyle({ height: wordsHeight + "px" });
      }
    }
  }

  outOfFocusEl.style.maxHeight = wordHeight * 3 + "px";
}

function updateWordsMargin(): void {
  if (Config.tapeMode !== "off") {
    wordsEl.setStyle({ marginLeft: "0" });
    void scrollTape(true);
  } else {
    const afterNewlineEls = wordsEl.qsa(".afterNewline");
    wordsEl.setStyle({ marginLeft: "0", marginTop: "0" });
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
  if (TestState.activeWordIndex === wordIndex - 1) {
    wordsEl.appendHtml(buildWordHTML(word, wordIndex));
  } else {
    requestAnimationFrame(async () => {
      wordsEl.appendHtml(buildWordHTML(word, wordIndex));
    });
  }

  // maybe ill come back to this
  // requestAnimationFrame(async () => {
  //   wordsEl.insertAdjacentHTML("beforeend", buildWordHTML(word, wordIndex));
  //   // in case word addition took a long time and some input happened in the mean time
  //   // we need to update word letters for that word
  //   const inputHistory = [
  //     ...TestInput.input.getHistory(),
  //     TestInput.input.current,
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
export let pendingWordData: Map<number, string> = new Map();

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
      const currentWord = TestWords.words.get(wordIndex);
      if (!currentWord && Config.mode !== "zen") return;
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
        const currentWordChars = Strings.splitIntoCharacters(currentWord);
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
            let letter = inputChars[i];
            if (letter === " ") {
              letter = "_";
            } else if (letter === "\t") {
              letter = "<i class='fas fa-long-arrow-alt-right fa-fw'></i>";
            } else if (letter === "\n") {
              letter =
                "<i class='fas fa-level-down-alt fa-rotate-90 fa-fw'></i>";
            }
            ret += `<letter class="incorrect extra ${tabChar}${nlChar}">${letter}</letter>`;
          } else {
            ret +=
              `<letter class="incorrect ${tabChar}${nlChar}">` +
              (Config.indicateTypos === "replace" ||
              Config.indicateTypos === "both"
                ? inputChars[i] === " " || inputChars[i] === "\t"
                  ? "_"
                  : inputChars[i]
                : currentLetter) +
              "</letter>";
            if (
              Config.indicateTypos === "below" ||
              Config.indicateTypos === "both"
            ) {
              const lastBlock = hintIndices[hintIndices.length - 1];
              if (lastBlock && lastBlock[lastBlock.length - 1] === i - 1) {
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
            ret += `<letter>` + currentLetter + "</letter>";
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
            currentWord,
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
            await lineJump(activeWordTop, true);
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
  if (getActivePage() !== "test" || TestState.resultVisible) return;

  await centeringActiveLine;

  const isTestRightToLeft = TestState.isDirectionReversed
    ? !TestState.isLanguageRightToLeft
    : TestState.isLanguageRightToLeft;

  const wordsWrapperWidth = wordsWrapperEl.getOffsetWidth();
  const wordsChildrenArr = wordsEl.getChildren();
  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) return;
  const afterNewLineEls = wordsEl.qsa(".afterNewline");

  let wordsWidthBeforeActive = 0;
  let fullLineWidths = 0;
  let leadingNewLine = false;
  let lastAfterNewLineElement = undefined;
  let widthRemoved = 0;
  const widthRemovedFromLine: number[] = [];
  const afterNewlinesNewMargins: number[] = [];
  const toRemove: ElementWithUtils[] = [];

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
    }
  }

  /* get last element to loop over */
  let lastElementIndex: number;
  // index of the active word in all #words.children
  // (which contains .word/.newline/.beforeNewline/.afterNewline elements)
  const activeWordIndex = wordsChildrenArr.indexOf(activeWordEl);
  // this will be 0 or 1
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
      const childComputedStyle = window.getComputedStyle(child.native);
      const wordOuterWidth =
        child.getOffsetWidth() +
        parseFloat(childComputedStyle.marginRight) +
        parseFloat(childComputedStyle.marginLeft);
      const forWordLeft = Math.floor(child.getOffsetLeft());
      const forWordWidth = Math.floor(child.getOffsetWidth());
      if (
        (!isTestRightToLeft && forWordLeft < 0 - forWordWidth) ||
        (isTestRightToLeft && forWordLeft > wordsWrapperWidth)
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
      const limit = 3 * wordsEl.getOffsetWidth();
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
    for (let i = 0; i < widthRemovedFromLine.length; i++) {
      const afterNewlineEl = afterNewLineEls[i] as ElementWithUtils;
      const currentLineIndent =
        parseFloat(afterNewlineEl.getStyle().marginLeft) || 0;
      afterNewlineEl.setStyle({
        marginLeft: `${currentLineIndent - (widthRemovedFromLine[i] ?? 0)}px`,
      });
    }
    if (isTestRightToLeft) widthRemoved *= -1;
    const currentWordsMargin = parseFloat(wordsEl.native.style.marginLeft) || 0;
    wordsEl.setStyle({ marginLeft: `${currentWordsMargin + widthRemoved}px` });
    Caret.caret.handleTapeWordsRemoved(widthRemoved);
    PaceCaret.caret.handleTapeWordsRemoved(widthRemoved);
  }

  /* calculate current word width to add to #words margin */
  let currentWordWidth = 0;
  const inputLength = TestInput.input.current.length;
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
    wordsEl.animate({
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
    wordsEl.setStyle({ marginLeft: `${newMargin}px` });
    for (let i = 0; i < afterNewlinesNewMargins.length; i++) {
      const newMargin = afterNewlinesNewMargins[i] ?? 0;
      afterNewLineEls[i]?.setStyle({ marginLeft: `${newMargin}px` });
    }
  }
}

export function updatePremid(): void {
  const mode2 = Misc.getMode2(Config, TestWords.currentQuote);
  let fbtext = "";
  if (Config.funbox.length > 0) {
    fbtext = " " + Config.funbox.join(" ");
  }
  qs(".pageTest #premidTestMode")?.setText(
    `${Config.mode} ${mode2} ${Strings.getLanguageDisplayString(
      Config.language,
    )}${fbtext}`,
  );
  qs(".pageTest #premidSecondsLeft")?.setText(`${Config.time}`);
}

function removeTestElements(lastElementIndexToRemove: number): void {
  const wordsChildren = wordsEl.getChildren();

  if (wordsChildren === undefined) return;

  for (let i = lastElementIndexToRemove; i >= 0; i--) {
    const child = wordsChildren[i];
    if (!child || !child.native.isConnected) continue;
    child.remove();
  }
}

let currentLinesJumping = 0;

export async function lineJump(
  currentTop: number,
  force = false,
): Promise<void> {
  //last word of the line
  if (currentTestLine > 0 || force) {
    const hideBound = currentTop;

    const activeWordEl = getActiveWordElement();
    if (!activeWordEl) {
      // resolve();
      return;
    }

    // index of the active word in all #words.children
    // (which contains .word/.newline/.beforeNewline/.afterNewline elements)
    const wordsChildren = wordsEl.getChildren();
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
      await wordsEl.promiseAnimate({
        marginTop: newMarginTop,
        duration,
      });
      currentLinesJumping = 0;
      activeWordTop = activeWordEl.getOffsetTop();
      activeWordHeight = activeWordEl.getOffsetHeight();
      removeTestElements(lastElementIndexToRemove);
      wordsEl.setStyle({ marginTop: "0" });
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

export function setLigatures(isEnabled: boolean): void {
  if (isEnabled || Config.mode === "custom" || Config.mode === "zen") {
    wordsEl.addClass("withLigatures");
    qs("#resultWordsHistory .words")?.addClass("withLigatures");
    qs("#resultReplay .words")?.addClass("withLigatures");
  } else {
    wordsEl.removeClass("withLigatures");
    qs("#resultWordsHistory .words")?.removeClass("withLigatures");
    qs("#resultReplay .words")?.removeClass("withLigatures");
  }
}

function buildWordLettersHTML(
  charCount: number,
  input: string,
  corrected: string,
  inputCharacters: string[],
  wordCharacters: string[],
  correctedCharacters: string[],
  containsKorean: boolean,
): string {
  let out = "";
  for (let c = 0; c < charCount; c++) {
    let correctedChar;
    try {
      correctedChar = !containsKorean
        ? correctedCharacters[c]
        : Hangul.assemble(corrected.split(""))[c];
    } catch (e) {
      correctedChar = undefined;
    }
    let extraCorrected = "";
    const historyWord: string = !containsKorean
      ? corrected
      : Hangul.assemble(corrected.split(""));
    if (
      c + 1 === charCount &&
      historyWord !== undefined &&
      historyWord.length > input.length
    ) {
      extraCorrected = "extraCorrected";
    }
    if (Config.mode === "zen" || wordCharacters[c] !== undefined) {
      if (Config.mode === "zen" || inputCharacters[c] === wordCharacters[c]) {
        if (
          correctedChar === inputCharacters[c] ||
          correctedChar === undefined
        ) {
          out += `<letter class="correct ${extraCorrected}">${inputCharacters[c]}</letter>`;
        } else {
          out +=
            `<letter class="corrected ${extraCorrected}">` +
            inputCharacters[c] +
            "</letter>";
        }
      } else {
        if (inputCharacters[c] === TestInput.input.current) {
          out +=
            `<letter class='correct ${extraCorrected}'>` +
            wordCharacters[c] +
            "</letter>";
        } else if (inputCharacters[c] === undefined) {
          out += "<letter>" + wordCharacters[c] + "</letter>";
        } else {
          out +=
            `<letter class="incorrect ${extraCorrected}">` +
            wordCharacters[c] +
            "</letter>";
        }
      }
    } else {
      out +=
        '<letter class="incorrect extra">' + inputCharacters[c] + "</letter>";
    }
  }
  return out;
}

async function loadWordsHistory(): Promise<boolean> {
  const wordsContainer = qs("#resultWordsHistory .words");
  wordsContainer?.empty();

  const inputHistoryLength = TestInput.input.getHistory().length;
  for (let i = 0; i < inputHistoryLength + 2; i++) {
    const input = TestInput.input.getHistory(i);
    const corrected = TestInput.corrected.getHistory(i);
    const word = TestWords.words.get(i);
    const containsKorean =
      input?.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g,
      ) !== null ||
      word?.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g,
      ) !== null;

    const wordEl = document.createElement("div");
    wordEl.className = "word";

    if (input !== "" && input !== undefined) {
      wordEl.classList.add("nocursor");
    }

    try {
      if (input === undefined || input === "") {
        throw new Error("empty input word");
      }

      const isIncorrectWord = input !== word;
      const isLastWord = i === inputHistoryLength - 1;
      const isTimedTest =
        Config.mode === "time" ||
        (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
        (Config.mode === "custom" && CustomText.getLimitValue() === 0);
      const isPartiallyCorrect = word.startsWith(input);

      const shouldShowError =
        Config.mode !== "zen" &&
        !(isLastWord && isTimedTest && isPartiallyCorrect);

      if (isIncorrectWord && shouldShowError) {
        wordEl.classList.add("error");
      }

      const burstValue = TestInput.burstHistory[i];
      if (burstValue !== undefined) {
        wordEl.setAttribute("burst", String(burstValue));
      }

      if (corrected !== undefined && corrected !== "") {
        const correctedChar = !containsKorean
          ? corrected
          : Hangul.assemble(corrected.split(""));
        wordEl.setAttribute("input", correctedChar.replace(/ /g, "_"));
      } else {
        wordEl.setAttribute("input", input.replace(/ /g, "_"));
      }

      const inputCharacters = Strings.splitIntoCharacters(input);
      const wordCharacters = Strings.splitIntoCharacters(word ?? "");
      const correctedCharacters = Strings.splitIntoCharacters(corrected ?? "");

      let loop;
      if (Config.mode === "zen" || input.length > word.length) {
        //input is longer - extra characters possible (loop over input)
        loop = inputCharacters.length;
      } else {
        //input is shorter or equal (loop over word list)
        loop = wordCharacters.length;
      }

      if (corrected === undefined) throw new Error("empty corrected word");

      wordEl.innerHTML = buildWordLettersHTML(
        loop,
        input,
        corrected,
        inputCharacters,
        wordCharacters,
        correctedCharacters,
        containsKorean,
      );
    } catch (e) {
      try {
        for (const char of word) {
          const letterEl = document.createElement("letter");
          letterEl.textContent = char;
          wordEl.appendChild(letterEl);
        }
      } catch {
        // wordEl is already created, just leave it empty or with partial content
      }
    }

    wordEl.addEventListener("mouseenter", (e) => {
      // if (noHover) return;
      if (!TestState.resultVisible) return;
      const input =
        (e.currentTarget as HTMLElement).getAttribute("input") ?? "";
      const burst = parseInt(
        (e.currentTarget as HTMLElement).getAttribute("burst") as string,
      );
      if (input === "") return;
      (e.currentTarget as HTMLElement).insertAdjacentHTML(
        "beforeend",
        `<div class="wordInputHighlight withSpeed">
          <div class="text">
          ${input
            .replace(/\t/g, "_")
            .replace(/\n/g, "_")
            .replace(/</g, "&lt")
            .replace(/>/g, "&gt")}
          </div>
          <div class="speed">
          ${isNaN(burst) || burst >= 1000 ? "Infinite" : Format.typingSpeed(burst, { showDecimalPlaces: false })}
          ${Config.typingSpeedUnit}
          </div>
          </div>`,
      );
    });

    wordEl.addEventListener("mouseleave", (e) => {
      wordEl.querySelector(".wordInputHighlight")?.remove();
    });

    // Append each word element individually to the DOM
    // This ensures elements are immediately available for event listeners
    wordsContainer?.native.appendChild(wordEl);
  }

  qs("#showWordHistoryButton")?.addClass("loaded");
  return true;
}

export async function toggleResultWords(noAnimation = false): Promise<void> {
  if (!TestState.resultVisible) return;
  ResultWordHighlight.updateToggleWordsHistoryTime();

  if (resultWordsHistoryEl.isHidden()) {
    if (resultWordsHistoryEl.qsa(".words .word").length === 0) {
      await loadWordsHistory();
    }
    void resultWordsHistoryEl.slideDown(noAnimation ? 0 : 250);
    void applyBurstHeatmap();
  } else {
    void resultWordsHistoryEl.slideUp(noAnimation ? 0 : 250);
  }
}

export async function applyBurstHeatmap(): Promise<void> {
  if (Config.burstHeatmap) {
    qsa("#resultWordsHistory .heatmapLegend")?.removeClass("hidden");

    let burstlist = [...TestInput.burstHistory];

    burstlist = burstlist.map((x) => (x >= 1000 ? Infinity : x));

    const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
    burstlist.forEach((burst, index) => {
      burstlist[index] = Math.round(typingSpeedUnit.fromWpm(burst));
    });

    const themeColors = getTheme();

    let colors = [
      themeColors.colorfulError,
      blendTwoHexColors(themeColors.colorfulError, themeColors.text, 0.5),
      themeColors.text,
      blendTwoHexColors(themeColors.main, themeColors.text, 0.5),
      themeColors.main,
    ];
    let unreachedColor = themeColors.sub;

    if (themeColors.main === themeColors.text) {
      colors = [
        themeColors.colorfulError,
        blendTwoHexColors(themeColors.colorfulError, themeColors.text, 0.5),
        themeColors.sub,
        blendTwoHexColors(themeColors.sub, themeColors.text, 0.5),
        themeColors.main,
      ];
      unreachedColor = themeColors.subAlt;
    }

    const burstlistSorted = burstlist.sort((a, b) => a - b);
    const burstlistLength = burstlist.length;

    const steps = [
      {
        val: 0,
        colorId: 0,
      },
      {
        val: burstlistSorted[(burstlistLength * 0.15) | 0] as number,
        colorId: 1,
      },
      {
        val: burstlistSorted[(burstlistLength * 0.35) | 0] as number,
        colorId: 2,
      },
      {
        val: burstlistSorted[(burstlistLength * 0.65) | 0] as number,
        colorId: 3,
      },
      {
        val: burstlistSorted[(burstlistLength * 0.85) | 0] as number,
        colorId: 4,
      },
    ];

    steps.forEach((step, index) => {
      const nextStep = steps[index + 1];
      let string = "";
      if (index === 0 && nextStep) {
        string = `<${Math.round(nextStep.val)}`;
      } else if (index === 4) {
        string = `${Math.round(step.val)}+`;
      } else if (nextStep) {
        if (step.val !== nextStep.val) {
          string = `${Math.round(step.val)}-${Math.round(nextStep.val) - 1}`;
        } else {
          string = `${Math.round(step.val)}-${Math.round(step.val)}`;
        }
      }

      qs("#resultWordsHistory .heatmapLegend .box" + index)?.setHtml(
        `<div>${Misc.escapeHTML(string)}</div>`,
      );
    });

    for (const word of qsa("#resultWordsHistory .words .word")) {
      const wordBurstAttr = word.getAttribute("burst");
      if (wordBurstAttr === undefined || wordBurstAttr === null) {
        word.setStyle({ color: unreachedColor });
      } else {
        let wordBurstVal = parseInt(wordBurstAttr);
        wordBurstVal = Math.round(
          getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(wordBurstVal),
        );
        steps.forEach((step) => {
          if (wordBurstVal >= step.val) {
            word.addClass("heatmapInherit");
            word.setStyle({ color: colors[step.colorId] as string });
          }
        });
      }
    }

    const boxes = qsa("#resultWordsHistory .heatmapLegend .boxes .box");
    for (let i = 0; i < boxes.length; i++) {
      (boxes[i] as ElementWithUtils).setStyle({
        background: colors[i] as string,
      });
    }
  } else {
    qs("#resultWordsHistory .heatmapLegend")?.addClass("hidden");
    qsa("#resultWordsHistory .words .word")?.removeClass("heatmapInherit");
    qsa("#resultWordsHistory .words .word")?.setStyle({ color: "" });

    qsa("#resultWordsHistory .heatmapLegend .boxes .box")?.setStyle({
      color: "",
    });
  }
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
        "max-width": Config.maxLineWidth + "ch",
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

function updateLiveStatsMargin(): void {
  if (Config.tapeMode === "off") {
    qs("#liveStatsMini")?.setStyle({
      justifyContent: "start",
      marginLeft: "0.25em",
    });
  } else {
    qs("#liveStatsMini")?.setStyle({
      justifyContent: "center",
      marginLeft: Config.tapeMargin + "%",
    });
  }
}

function updateLiveStatsOpacity(value: TimerOpacity): void {
  qs("#barTimerProgress")?.setStyle({ opacity: value });
  qs("#liveStatsTextTop")?.setStyle({ opacity: value });
  qs("#liveStatsTextBottom")?.setStyle({
    opacity: value,
  });
  qs("#liveStatsMini")?.setStyle({ opacity: value });
}

function updateLiveStatsColor(value: TimerColor): void {
  qs("#barTimerProgress")?.removeClass("timerSub");
  qs("#barTimerProgress")?.removeClass("timerText");
  qs("#barTimerProgress")?.removeClass("timerMain");

  qs("#liveStatsTextTop")?.removeClass("timerSub");
  qs("#liveStatsTextTop")?.removeClass("timerText");
  qs("#liveStatsTextTop")?.removeClass("timerMain");
  qs("#liveStatsTextBottom")?.removeClass("timerSub");
  qs("#liveStatsTextBottom")?.removeClass("timerText");
  qs("#liveStatsTextBottom")?.removeClass("timerMain");

  qs("#liveStatsMini")?.removeClass("timerSub");
  qs("#liveStatsMini")?.removeClass("timerText");
  qs("#liveStatsMini")?.removeClass("timerMain");

  if (value === "main") {
    qs("#barTimerProgress")?.addClass("timerMain");
    qs("#liveStatsTextTop")?.addClass("timerMain");
    qs("#liveStatsTextBottom")?.addClass("timerMain");
    qs("#liveStatsMini")?.addClass("timerMain");
  } else if (value === "sub") {
    qs("#barTimerProgress")?.addClass("timerSub");
    qs("#liveStatsTextTop")?.addClass("timerSub");
    qs("#liveStatsTextBottom")?.addClass("timerSub");
    qs("#liveStatsMini")?.addClass("timerSub");
  } else if (value === "text") {
    qs("#barTimerProgress")?.addClass("timerText");
    qs("#liveStatsTextTop")?.addClass("timerText");
    qs("#liveStatsTextBottom")?.addClass("timerText");
    qs("#liveStatsMini")?.addClass("timerText");
  }
}

function showHideTestRestartButton(showHide: boolean): void {
  if (showHide) {
    qs(".pageTest #restartTestButton")?.removeClass("hidden");
  } else {
    qs(".pageTest #restartTestButton")?.addClass("hidden");
  }
}

export function getActiveWordTopAndHeightWithDifferentData(data: string): {
  top: number;
  height: number;
} {
  const activeWord = getActiveWordElement();

  if (!activeWord) throw new Error("No active word element found");

  const nodes = [];
  for (let i = activeWord.getChildren().length; i < data.length; i++) {
    const tempLetter = document.createElement("letter");
    const displayData = data[i] === " " ? "_" : data[i];
    tempLetter.textContent = displayData as string;
    nodes.push(tempLetter);
  }

  activeWord.append(nodes);

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

  const acc: number = Numbers.roundTo2(TestStats.calculateAccuracy());
  if (!isNaN(acc)) LiveAcc.update(acc);

  if (Config.mode !== "time") {
    TimerProgress.update();
  }

  if (Config.keymapMode === "next") {
    void KeymapEvent.highlight(
      TestWords.words.getCurrent().charAt(TestInput.input.current.length),
    );
  }

  Focus.set(true);
  Caret.stopAnimation();
  Caret.updatePosition();
}

export function afterTestTextInput(
  correct: boolean,
  increasedWordIndex: boolean | null,
  inputOverride?: string,
): void {
  //nospace cant be handled here becauseword index
  // is already increased at this point

  void MonkeyPower.addPower(correct);

  if (!increasedWordIndex) {
    void updateWordLetters({
      input: inputOverride ?? TestInput.input.current,
      wordIndex: TestState.activeWordIndex,
      compositionData: CompositionState.getData(),
    });
  }

  afterAnyTestInput("textInput", correct);
}

export function afterTestCompositionUpdate(): void {
  void updateWordLetters({
    input: TestInput.input.current,
    wordIndex: TestState.activeWordIndex,
    compositionData: CompositionState.getData(),
  });
  // correct needs to be true to get the normal click sound
  afterAnyTestInput("compositionUpdate", true);
}

export function afterTestDelete(): void {
  void updateWordLetters({
    input: TestInput.input.current,
    wordIndex: TestState.activeWordIndex,
    compositionData: CompositionState.getData(),
  });
  afterAnyTestInput("delete", null);
}

export function beforeTestWordChange(
  direction: "forward",
  correct: boolean,
  forceUpdateActiveWordLetters: boolean,
): void;
export function beforeTestWordChange(
  direction: "back",
  correct: null,
  forceUpdateActiveWordLetters: boolean,
): void;
export function beforeTestWordChange(
  direction: "forward" | "back",
  correct: boolean | null,
  forceUpdateActiveWordLetters: boolean,
): void {
  const nospaceEnabled = isFunboxActiveWithProperty("nospace");
  if (
    (Config.stopOnError === "letter" && (correct || correct === null)) ||
    nospaceEnabled ||
    forceUpdateActiveWordLetters ||
    Config.strictSpace
  ) {
    void updateWordLetters({
      input: TestInput.input.current,
      wordIndex: TestState.activeWordIndex,
      compositionData: CompositionState.getData(),
    });
  }

  if (direction === "forward") {
    if (Config.blindMode) {
      highlightAllLettersAsCorrect(TestState.activeWordIndex);
    } else if (correct === false) {
      highlightBadWord(TestState.activeWordIndex);
    }
  }
}

export async function afterTestWordChange(
  direction: "forward" | "back",
): Promise<void> {
  updateActiveElement({
    direction,
  });
  Caret.updatePosition();

  const lastBurst = TestInput.burstHistory[TestInput.burstHistory.length - 1];
  if (Numbers.isSafeNumber(lastBurst)) {
    void LiveBurst.update(Math.round(lastBurst));
  }
  if (direction === "forward") {
    //
  } else if (direction === "back") {
    if (Config.mode === "zen") {
      // because we need to delete newline, beforenewline and afternewline elements which dont have wordindex attributes
      // we need to do this loop thingy and delete all elements after the active word
      let deleteElements = false;
      for (const child of wordsEl.getChildren()) {
        if (deleteElements) {
          child.remove();
          continue;
        }
        const attr = child.getAttribute("data-wordindex");
        if (attr === null) continue;
        const wordIndex = parseInt(attr, 10);
        if (wordIndex === TestState.activeWordIndex) {
          deleteElements = true;
        }
      }
    }
  }
}

export function onTestStart(): void {
  Focus.set(true);
  Monkey.show();
  TimerProgress.show();
  LiveSpeed.show();
  LiveAcc.show();
  LiveBurst.show();
  TimerProgress.update();
}

export function onTestRestart(source: "testPage" | "resultPage"): void {
  qs("#result")?.addClass("hidden");
  qs("#typingTest")?.setStyle({ opacity: "0" }).removeClass("hidden");
  getInputElement().style.left = "0";
  TestConfig.show();
  Focus.set(false);
  LiveSpeed.instantHide();
  LiveSpeed.reset();
  LiveBurst.instantHide();
  LiveBurst.reset();
  LiveAcc.instantHide();
  LiveAcc.reset();
  TimerProgress.instantHide();
  TimerProgress.reset();
  Monkey.instantHide();
  LayoutfluidFunboxTimer.instantHide();
  updatePremid();
  focusWords(true);
  void Keymap.refresh();
  ResultWordHighlight.destroy();
  MonkeyPower.reset();
  MemoryFunboxTimer.reset();

  if (Config.showAverage !== "off") {
    void Last10Average.update().then(() => {
      void ModesNotice.update();
    });
  } else {
    void ModesNotice.update();
  }

  if (source === "resultPage") {
    if (Config.randomTheme !== "off") {
      void ThemeController.randomizeTheme();
    }
    void XPBar.skipBreakdown();
  }

  currentTestLine = 0;
  if (getActivePage() === "test") {
    AdController.updateFooterAndVerticalAds(false);
  }
  AdController.destroyResult();
  if (Config.compositionDisplay === "below") {
    CompositionDisplay.update(" ");
    CompositionDisplay.show();
  } else {
    CompositionDisplay.hide();
  }
  void SoundController.clearAllSounds();
  cancelPendingAnimationFramesStartingWith("test-ui");
  showWords();
}

export function onTestFinish(): void {
  Caret.hide();
  LiveSpeed.hide();
  LiveAcc.hide();
  LiveBurst.hide();
  TimerProgress.hide();
  OutOfFocus.hide();
  Monkey.hide();
  if (Config.playSoundOnClick === "16") {
    void SoundController.playFartReverb();
  }
}

qs(".pageTest #copyWordsListButton")?.on("click", async () => {
  let words;
  if (Config.mode === "zen") {
    words = TestInput.input.getHistory().join(" ");
  } else {
    words = TestWords.words
      .get()
      .slice(0, TestInput.input.getHistory().length)
      .join(" ");
  }
  await copyToClipboard(words);
});

qs(".pageTest #copyMissedWordsListButton")?.on("click", async () => {
  let words;
  if (Config.mode === "zen") {
    words = TestInput.input.getHistory().join(" ");
  } else {
    words = Object.keys(TestInput.missedWords ?? {}).join(" ");
  }
  await copyToClipboard(words);
});

async function copyToClipboard(content: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(content);
    Notifications.add("Copied to clipboard", 0, {
      duration: 2,
    });
  } catch (e) {
    const msg = Misc.createErrorMessage(e, "Could not copy to clipboard");
    Notifications.add(msg, -1);
  }
}

qs(".pageTest #toggleBurstHeatmap")?.on("click", async () => {
  setConfig("burstHeatmap", !Config.burstHeatmap);
  ResultWordHighlight.destroy();
});

qs(".pageTest #result #wpmChart")?.on("mouseleave", () => {
  ResultWordHighlight.setIsHoverChart(false);
  ResultWordHighlight.clear();
});

qs(".pageTest #result #wpmChart")?.on("mouseenter", () => {
  ResultWordHighlight.setIsHoverChart(true);
});

addEventListener("resize", () => {
  ResultWordHighlight.destroy();
});

qs("#wordsInput")?.on("focus", (e) => {
  if (!isInputElementFocused()) return;
  if (!TestState.resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  Caret.show(true);
});

qs("#wordsInput")?.on("focusout", () => {
  if (!isInputElementFocused()) {
    OutOfFocus.show();
  }
  Caret.hide();
});

qs(".pageTest")?.onChild("click", "#showWordHistoryButton", () => {
  void toggleResultWords();
});

qs("#wordsWrapper")?.on("click", () => {
  focusWords();
});

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "quickRestart") {
    showHideTestRestartButton(newValue === "off");
  }
  if (key === "timerOpacity") {
    updateLiveStatsOpacity(newValue);
  }
  if (key === "timerColor") {
    updateLiveStatsColor(newValue);
  }
  if (key === "showOutOfFocusWarning" && !newValue) {
    OutOfFocus.hide();
  }
  if (key === "compositionDisplay") {
    if (newValue === "below") {
      CompositionDisplay.update(" ");
      CompositionDisplay.show();
    } else {
      CompositionDisplay.hide();
    }
  }
  if (
    ["fontSize", "fontFamily", "blindMode", "hideExtraLetters"].includes(
      key ?? "",
    )
  ) {
    void updateHintsPositionDebounced();
  }
  if ((key === "theme" || key === "burstHeatmap") && TestState.resultVisible) {
    void applyBurstHeatmap();
  }
  if (key === "highlightMode") {
    if (getActivePage() === "test") {
      void updateWordLetters({
        input: TestInput.input.current,
        wordIndex: TestState.activeWordIndex,
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
      Ligatures.update(key, wordsEl);
    }
  }
  if (["tapeMode", "tapeMargin"].includes(key)) {
    updateLiveStatsMargin();
  }
});
