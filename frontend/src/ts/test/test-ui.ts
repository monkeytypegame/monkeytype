import * as Notifications from "../elements/notifications";
import * as ThemeColors from "../elements/theme-colors";
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
import * as ActivePage from "../states/active-page";
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
import { animate } from "animejs";
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
import * as LayoutfluidFunboxTimer from "../test/funbox/layoutfluid-funbox-timer";
import * as Keymap from "../elements/keymap";
import * as ThemeController from "../controllers/theme-controller";
import * as XPBar from "../elements/xp-bar";
import * as ModesNotice from "../elements/modes-notice";
import * as Last10Average from "../elements/last-10-average";
import * as MemoryFunboxTimer from "./funbox/memory-funbox-timer";

export const updateHintsPositionDebounced = Misc.debounceUntilResolved(
  updateHintsPosition,
  { rejectSkippedCalls: false },
);

const wordsEl = document.querySelector(".pageTest #words") as HTMLElement;
const wordsWrapperEl = document.querySelector(
  ".pageTest #wordsWrapper",
) as HTMLElement;

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

  const wordsWrapperHeight = wordsWrapperEl.offsetHeight;
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

export function getWordElement(index: number): HTMLElement | null {
  const el = wordsEl.querySelector<HTMLElement>(
    `.word[data-wordindex='${index}']`,
  );
  return el;
}

export function getActiveWordElement(): HTMLElement | null {
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
      const previousActiveWord = wordsEl.querySelector(
        ".active",
      ) as HTMLElement;
      if (direction === "forward") {
        previousActiveWord.classList.add("typed");
      } else if (direction === "back") {
        if (Config.mode === "zen") {
          previousActiveWord.remove();
        }
      }
      previousActiveWord.classList.remove("active");
      previousActiveWordTop = previousActiveWord.offsetTop;
    }

    const newActiveWord = getActiveWordElement();
    if (newActiveWord === null) {
      throw new Error("activeWord is null - can't update active element");
    }

    newActiveWord.classList.add("active");
    newActiveWord.classList.remove("error");
    newActiveWord.classList.remove("typed");

    activeWordTop = newActiveWord.offsetTop;
    activeWordHeight = newActiveWord.offsetHeight;
    console.log("activewordtopupdated");

    updateWordsInputPosition();

    if (previousActiveWordTop === null) return;

    const isTimedTest =
      Config.mode === "time" ||
      (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
      (Config.mode === "custom" && CustomText.getLimitValue() === 0);

    if (isTimedTest || !Config.showAllLines) {
      const newActiveWordTop = newActiveWord.offsetTop;
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
  activeWordLetters: NodeListOf<Element>,
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
      const letter = activeWordLetters[letterIndex] as HTMLElement;
      const blockIndices = `${letterIndex}`;
      const blockChars = isFullWord
        ? inputChars[letterIndex]
        : inputChars[currentHint++];

      hintsHtml += `<hint data-chars-index=${blockIndices} style="left:${
        letter.offsetLeft + letter.offsetWidth / 2
      }px;">${blockChars}</hint>`;
    }
  }
  if (wrapWithDiv) hintsHtml = `<div class="hints">${hintsHtml}</div>`;
  return hintsHtml;
}

async function joinOverlappingHints(
  incorrectLettersIndices: number[][],
  activeWordLetters: NodeListOf<Element>,
  hintElements: HTMLCollection,
): Promise<void> {
  const isWordRightToLeft = Strings.isWordRightToLeft(
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

    const block1Letter1 = activeWordLetters[block1Letter1Indx] as HTMLElement;
    const block2Letter1 = activeWordLetters[block2Letter1Indx] as HTMLElement;

    const sameTop = block1Letter1.offsetTop === block2Letter1.offsetTop;

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
        block1Letter1.offsetLeft +
        (isWordRightToLeft ? block1Letter1.offsetWidth : 0);
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
    ActivePage.get() !== "test" ||
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

    const wordElement = hintsContainer.parentElement as HTMLElement;
    const letterElements = wordElement.querySelectorAll<HTMLElement>("letter");

    hintsContainer.innerHTML = createHintsHtml(
      hintIndices,
      letterElements,
      hintText,
      false,
    );
    const wordHintsElements = wordElement.getElementsByTagName("hint");
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
    wordsEl.classList.add("tape");
    wordsWrapperEl.classList.add("tape");
  } else {
    wordsEl.classList.remove("tape");
    wordsWrapperEl.classList.remove("tape");
  }

  if (Config.blindMode) {
    wordsEl.classList.add("blind");
    wordsWrapperEl.classList.add("blind");
  } else {
    wordsEl.classList.remove("blind");
    wordsWrapperEl.classList.remove("blind");
  }

  if (Config.indicateTypos === "below" || Config.indicateTypos === "both") {
    wordsEl.classList.add("indicateTyposBelow");
    wordsWrapperEl.classList.add("indicateTyposBelow");
  } else {
    wordsEl.classList.remove("indicateTyposBelow");
    wordsWrapperEl.classList.remove("indicateTyposBelow");
  }

  if (Config.hideExtraLetters) {
    wordsEl.classList.add("hideExtraLetters");
    wordsWrapperEl.classList.add("hideExtraLetters");
  } else {
    wordsEl.classList.remove("hideExtraLetters");
    wordsWrapperEl.classList.remove("hideExtraLetters");
  }

  if (Config.flipTestColors) {
    wordsEl.classList.add("flipped");
  } else {
    wordsEl.classList.remove("flipped");
  }

  if (Config.colorfulMode) {
    wordsEl.classList.add("colorfulMode");
  } else {
    wordsEl.classList.remove("colorfulMode");
  }

  $(
    "#caret, #paceCaret, #liveStatsMini, #typingTest, #wordsInput, #compositionDisplay",
  ).css("fontSize", Config.fontSize + "rem");

  if (TestState.isLanguageRightToLeft) {
    wordsEl.classList.add("rightToLeftTest");
    $("#resultWordsHistory .words").addClass("rightToLeftTest");
    $("#resultReplay .words").addClass("rightToLeftTest");
  } else {
    wordsEl.classList.remove("rightToLeftTest");
    $("#resultWordsHistory .words").removeClass("rightToLeftTest");
    $("#resultReplay .words").removeClass("rightToLeftTest");
  }

  const existing =
    wordsEl?.className
      .split(/\s+/)
      .filter((className) => !className.startsWith("highlight-")) ?? [];
  if (Config.highlightMode !== null) {
    existing.push("highlight-" + Config.highlightMode.replaceAll("_", "-"));
  }
  wordsEl.className = existing.join(" ");

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
  wordsEl.innerHTML = "";

  if (Config.mode === "zen") {
    appendEmptyWordElement();
  } else {
    let wordsHTML = "";
    for (let i = 0; i < TestWords.words.length; i++) {
      wordsHTML += buildWordHTML(TestWords.words.get(i), i);
    }
    wordsEl.innerHTML = wordsHTML;
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
  wordsEl.insertAdjacentHTML(
    "beforeend",
    `<div class='word' data-wordindex='${index}'><letter class='invisible'>_</letter></div>`,
  );
}

export function updateWordsInputPosition(): void {
  if (ActivePage.get() !== "test") return;
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
    activeWord.offsetTop + letterHeight / 2 - el.offsetHeight / 2 + 1; //+1 for half of border

  if (Config.tapeMode !== "off") {
    el.style.maxWidth = `${100 - Config.tapeMargin}%`;
  } else {
    el.style.maxWidth = "";
  }
  if (activeWord.offsetWidth < letterHeight) {
    el.style.width = letterHeight + "px";
  } else {
    el.style.width = activeWord.offsetWidth + "px";
  }

  el.style.top = targetTop + "px";

  if (Config.tapeMode !== "off") {
    el.style.left = `${
      wordsWrapperEl.offsetWidth * (Config.tapeMargin / 100)
    }px`;
  } else {
    if (activeWord.offsetWidth < letterHeight && isTestRightToLeft) {
      el.style.left = activeWord.offsetLeft - letterHeight + "px";
    } else {
      el.style.left = Math.max(0, activeWord.offsetLeft) + "px";
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
  const currentTop = activeWordEl.offsetTop;

  let previousLineTop = currentTop;
  for (let i = TestState.activeWordIndex - 1; i >= 0; i--) {
    previousLineTop = getWordElement(i)?.offsetTop ?? currentTop;
    if (previousLineTop < currentTop) {
      await lineJump(previousLineTop, true);
      resolve();
      return;
    }
  }

  resolve();
}

export function updateWordsWrapperHeight(force = false): void {
  if (ActivePage.get() !== "test" || TestState.resultVisible) return;
  if (!force && Config.mode !== "custom") return;
  const outOfFocusEl = document.querySelector(
    ".outOfFocusWarning",
  ) as HTMLElement;
  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) return;

  wordsWrapperEl.classList.remove("hidden");

  const wordComputedStyle = window.getComputedStyle(activeWordEl);
  const wordMargin =
    parseInt(wordComputedStyle.marginTop) +
    parseInt(wordComputedStyle.marginBottom);
  const wordHeight = activeWordEl.offsetHeight + wordMargin;

  const timedTest =
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
    (Config.mode === "custom" && CustomText.getLimitValue() === 0);

  const showAllLines = Config.showAllLines && !timedTest;

  if (showAllLines) {
    //allow the wrapper to grow and shink with the words
    wordsWrapperEl.style.height = "";
  } else if (Config.mode === "zen") {
    //zen mode, showAllLines off
    wordsWrapperEl.style.height = wordHeight * 2 + "px";
  } else {
    if (Config.tapeMode === "off") {
      //tape off, showAllLines off, non-zen mode
      const wordElements = wordsEl.querySelectorAll<HTMLElement>(".word");
      let lines = 0;
      let lastTop = 0;
      let wordIndex = 0;
      let wrapperHeight = 0;

      while (lines < 3) {
        const word = wordElements[wordIndex];
        if (!word) break;
        const top = word.offsetTop;
        if (top > lastTop) {
          lines++;
          wrapperHeight += word.offsetHeight + wordMargin;
          lastTop = top;
        }
        wordIndex++;
      }
      if (lines < 3) wrapperHeight = wrapperHeight * (3 / lines);

      //limit to 3 lines
      wordsWrapperEl.style.height = wrapperHeight + "px";
    } else {
      //show 3 lines if tape mode is on and has newlines, otherwise use words height (because of indicate typos: below)
      if (TestWords.hasNewline) {
        wordsWrapperEl.style.height = wordHeight * 3 + "px";
      } else {
        const wordsHeight = wordsEl.offsetHeight ?? wordHeight;
        wordsWrapperEl.style.height = wordsHeight + "px";
      }
    }
  }

  outOfFocusEl.style.maxHeight = wordHeight * 3 + "px";
}

function updateWordsMargin(): void {
  if (Config.tapeMode !== "off") {
    wordsEl.style.marginLeft = "0";
    void scrollTape(true);
  } else {
    const afterNewlineEls =
      wordsEl.querySelectorAll<HTMLElement>(".afterNewline");
    wordsEl.style.marginLeft = `0`;
    wordsEl.style.marginTop = `0`;
    for (const afterNewline of afterNewlineEls) {
      afterNewline.style.marginLeft = `0`;
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
    wordsEl.insertAdjacentHTML("beforeend", buildWordHTML(word, wordIndex));
  } else {
    requestAnimationFrame(async () => {
      wordsEl.insertAdjacentHTML("beforeend", buildWordHTML(word, wordIndex));
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

      wordAtIndex.innerHTML = ret;

      if (hintIndices?.length) {
        const wordAtIndexLetters = wordAtIndex.querySelectorAll("letter");
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
        wordAtIndex.insertAdjacentHTML("beforeend", hintsHtml);
        const hintElements = wordAtIndex.getElementsByTagName("hint");
        await joinOverlappingHints(
          hintIndices,
          wordAtIndexLetters,
          hintElements,
        );
      }

      if (newlineafter) {
        wordAtIndex.insertAdjacentHTML(
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
          const wordTopAfterUpdate = wordAtIndex.offsetTop;
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
  lastWordInLine?: Element | HTMLElement,
  checkIfIncorrect = true,
): number {
  let nlChar: HTMLElement | null;
  if (lastWordInLine) {
    nlChar = lastWordInLine.querySelector<HTMLElement>("letter.nlChar");
  } else {
    nlChar = document.querySelector<HTMLElement>(
      "#words > .word > letter.nlChar",
    );
  }
  if (!nlChar) return 0;
  if (checkIfIncorrect && nlChar.classList.contains("incorrect")) return 0;
  const letterComputedStyle = window.getComputedStyle(nlChar);
  const letterMargin =
    parseFloat(letterComputedStyle.marginLeft) +
    parseFloat(letterComputedStyle.marginRight);
  return nlChar.offsetWidth + letterMargin;
}

export async function scrollTape(noAnimation = false): Promise<void> {
  if (ActivePage.get() !== "test" || TestState.resultVisible) return;

  await centeringActiveLine;

  const isTestRightToLeft = TestState.isDirectionReversed
    ? !TestState.isLanguageRightToLeft
    : TestState.isLanguageRightToLeft;

  const wordsWrapperWidth = wordsWrapperEl.offsetWidth;
  const wordsChildrenArr = [...wordsEl.children] as HTMLElement[];
  const activeWordEl = getActiveWordElement();
  if (!activeWordEl) return;
  const afterNewLineEls = wordsEl.getElementsByClassName("afterNewline");

  let wordsWidthBeforeActive = 0;
  let fullLineWidths = 0;
  let leadingNewLine = false;
  let lastAfterNewLineElement = undefined;
  let widthRemoved = 0;
  const widthRemovedFromLine: number[] = [];
  const afterNewlinesNewMargins: number[] = [];
  const toRemove: HTMLElement[] = [];

  /* remove leading `.afterNewline` elements */
  for (const child of wordsChildrenArr) {
    if (child.classList.contains("word")) {
      // only last leading `.afterNewline` element pushes `.word`s to right
      if (lastAfterNewLineElement) {
        widthRemoved += parseFloat(lastAfterNewLineElement.style.marginLeft);
      }
      break;
    } else if (child.classList.contains("afterNewline")) {
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
    .filter((child) => child.classList.contains("afterNewline")).length;
  // the second `.afterNewline` after active word is visible during line jump
  let lastVisibleAfterNewline = afterNewLineEls[newLinesBeforeActiveWord + 1] as
    | HTMLElement
    | undefined;
  if (lastVisibleAfterNewline) {
    lastElementIndex = wordsChildrenArr.indexOf(lastVisibleAfterNewline);
  } else {
    lastVisibleAfterNewline = afterNewLineEls[newLinesBeforeActiveWord] as
      | HTMLElement
      | undefined;
    if (lastVisibleAfterNewline) {
      lastElementIndex = wordsChildrenArr.indexOf(lastVisibleAfterNewline);
    } else {
      lastElementIndex = activeWordIndex - 1;
    }
  }

  const wordRightMargin = parseFloat(
    window.getComputedStyle(activeWordEl).marginRight,
  );

  /*calculate .afterNewline & #words new margins + determine elements to remove*/
  for (let i = 0; i <= lastElementIndex; i++) {
    const child = wordsChildrenArr[i] as HTMLElement;
    if (child.classList.contains("word")) {
      leadingNewLine = false;
      const childComputedStyle = window.getComputedStyle(child);
      const wordOuterWidth =
        child.offsetWidth +
        parseFloat(childComputedStyle.marginRight) +
        parseFloat(childComputedStyle.marginLeft);
      const forWordLeft = Math.floor(child.offsetLeft);
      const forWordWidth = Math.floor(child.offsetWidth);
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
    } else if (child.classList.contains("afterNewline")) {
      if (leadingNewLine) continue;
      const nlCharWidth = getNlCharWidth(wordsChildrenArr[i - 3]);
      fullLineWidths -= nlCharWidth + wordRightMargin;
      if (i < activeWordIndex) wordsWidthBeforeActive = fullLineWidths;

      /** words that are wider than limit can cause a barely visible bottom line shifting,
       * increase limit if that ever happens, but keep the limit because browsers hate
       * ridiculously wide margins which may cause the words to not be displayed
       */
      const limit = 3 * wordsEl.offsetWidth;
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
      const afterNewlineEl = afterNewLineEls[i] as HTMLElement;
      const currentLineIndent =
        parseFloat(afterNewlineEl.style.marginLeft) || 0;
      afterNewlineEl.style.marginLeft = `${
        currentLineIndent - (widthRemovedFromLine[i] ?? 0)
      }px`;
    }
    if (isTestRightToLeft) widthRemoved *= -1;
    const currentWordsMargin = parseFloat(wordsEl.style.marginLeft) || 0;
    wordsEl.style.marginLeft = `${currentWordsMargin + widthRemoved}px`;
    Caret.caret.handleTapeWordsRemoved(widthRemoved);
    PaceCaret.caret.handleTapeWordsRemoved(widthRemoved);
  }

  /* calculate current word width to add to #words margin */
  let currentWordWidth = 0;
  const inputLength = TestInput.input.current.length;
  if (Config.tapeMode === "letter" && inputLength > 0) {
    const letters = activeWordEl.querySelectorAll<HTMLElement>("letter");
    let lastPositiveLetterWidth = 0;
    for (let i = 0; i < inputLength; i++) {
      const letter = letters[i];
      if (
        (Config.blindMode || Config.hideExtraLetters) &&
        letter?.classList.contains("extra")
      ) {
        continue;
      }
      const letterOuterWidth = letter?.offsetWidth ?? 0;
      currentWordWidth += letterOuterWidth;
      if (letterOuterWidth > 0) lastPositiveLetterWidth = letterOuterWidth;
    }
    // if current letter has zero width move the tape to previous positive width letter
    if (letters[inputLength]?.offsetWidth === 0) {
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
    animate(wordsEl, {
      marginLeft: newMargin,
      duration,
      ease,
    });

    for (let i = 0; i < afterNewlinesNewMargins.length; i++) {
      const newMargin = afterNewlinesNewMargins[i] ?? 0;
      animate(afterNewLineEls[i] as Element, {
        marginLeft: newMargin,
        duration,
        ease,
      });
    }
  } else {
    wordsEl.style.marginLeft = `${newMargin}px`;
    for (let i = 0; i < afterNewlinesNewMargins.length; i++) {
      const newMargin = afterNewlinesNewMargins[i] ?? 0;
      (afterNewLineEls[i] as HTMLElement).style.marginLeft = `${newMargin}px`;
    }
  }
}

export function updatePremid(): void {
  const mode2 = Misc.getMode2(Config, TestWords.currentQuote);
  let fbtext = "";
  if (Config.funbox.length > 0) {
    fbtext = " " + Config.funbox.join(" ");
  }
  $(".pageTest #premidTestMode").text(
    `${Config.mode} ${mode2} ${Strings.getLanguageDisplayString(
      Config.language,
    )}${fbtext}`,
  );
  $(".pageTest #premidSecondsLeft").text(Config.time);
}

function removeTestElements(lastElementIndexToRemove: number): void {
  const wordsChildren = wordsEl.children;

  if (wordsChildren === undefined) return;

  for (let i = lastElementIndexToRemove; i >= 0; i--) {
    const child = wordsChildren[i];
    if (!child || !child.isConnected) continue;
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
    const wordsChildren = [...wordsEl.children];
    const activeWordElementIndex = wordsChildren.indexOf(activeWordEl);

    let lastElementIndexToRemove: number | undefined = undefined;
    for (let i = activeWordElementIndex - 1; i >= 0; i--) {
      const child = wordsChildren[i] as HTMLElement;
      if (child.classList.contains("hidden")) continue;
      if (Math.floor(child.offsetTop) < hideBound) {
        if (child.classList.contains("word")) {
          lastElementIndexToRemove = i;
          break;
        } else if (child.classList.contains("beforeNewline")) {
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

    const wordHeight = $(activeWordEl).outerHeight(true) as number;
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
      await Misc.promiseAnimate(wordsEl, {
        marginTop: newMarginTop,
        duration,
      });
      currentLinesJumping = 0;
      activeWordTop = activeWordEl.offsetTop;
      activeWordHeight = activeWordEl.offsetHeight;
      removeTestElements(lastElementIndexToRemove);
      wordsEl.style.marginTop = "0";
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
    wordsEl.classList.add("withLigatures");
    $("#resultWordsHistory .words").addClass("withLigatures");
    $("#resultReplay .words").addClass("withLigatures");
  } else {
    wordsEl.classList.remove("withLigatures");
    $("#resultWordsHistory .words").removeClass("withLigatures");
    $("#resultReplay .words").removeClass("withLigatures");
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
  $("#resultWordsHistory .words").empty();
  let wordsHTML = "";
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
    let wordEl = "";
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
      const isPartiallyCorrect = word.substring(0, input.length) === input;

      const shouldShowError =
        Config.mode !== "zen" &&
        !(isLastWord && isTimedTest && isPartiallyCorrect);

      const errorClass = isIncorrectWord && shouldShowError ? "error" : "";

      if (corrected !== undefined && corrected !== "") {
        const correctedChar = !containsKorean
          ? corrected
          : Hangul.assemble(corrected.split(""));
        wordEl = `<div class='word nocursor ${errorClass}' burst="${
          TestInput.burstHistory[i]
        }" input="${correctedChar
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      } else {
        wordEl = `<div class='word nocursor ${errorClass}' burst="${
          TestInput.burstHistory[i]
        }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
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

      wordEl += buildWordLettersHTML(
        loop,
        input,
        corrected,
        inputCharacters,
        wordCharacters,
        correctedCharacters,
        containsKorean,
      );
      wordEl += "</div>";
    } catch (e) {
      try {
        wordEl = "<div class='word'>";
        for (const char of word) {
          wordEl += "<letter>" + char + "</letter>";
        }
        wordEl += "</div>";
      } catch {
        wordEl += "</div>";
      }
    }
    wordsHTML += wordEl;
  }
  $("#resultWordsHistory .words").html(wordsHTML);
  $("#showWordHistoryButton").addClass("loaded");
  return true;
}

export function toggleResultWords(noAnimation = false): void {
  if (TestState.resultVisible) {
    ResultWordHighlight.updateToggleWordsHistoryTime();
    if ($("#resultWordsHistory").stop(true, true).hasClass("hidden")) {
      //show

      if ($("#resultWordsHistory .words .word").length === 0) {
        void loadWordsHistory().then(() => {
          if (Config.burstHeatmap) {
            void applyBurstHeatmap();
          }
          $("#resultWordsHistory")
            .removeClass("hidden")
            .css("display", "none")
            .slideDown(noAnimation ? 0 : 250, () => {
              if (Config.burstHeatmap) {
                void applyBurstHeatmap();
              }
            });
        });
      } else {
        if (Config.burstHeatmap) {
          void applyBurstHeatmap();
        }
        $("#resultWordsHistory")
          .removeClass("hidden")
          .css("display", "none")
          .slideDown(noAnimation ? 0 : 250);
      }
    } else {
      //hide

      $("#resultWordsHistory").slideUp(250, () => {
        $("#resultWordsHistory").addClass("hidden");
      });
    }
  }
}

export async function applyBurstHeatmap(): Promise<void> {
  if (Config.burstHeatmap) {
    $("#resultWordsHistory .heatmapLegend").removeClass("hidden");

    let burstlist = [...TestInput.burstHistory];

    burstlist = burstlist.filter((x) => x !== Infinity);
    burstlist = burstlist.filter((x) => x < 500);

    const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
    burstlist.forEach((burst, index) => {
      burstlist[index] = Math.round(typingSpeedUnit.fromWpm(burst));
    });

    const themeColors = await ThemeColors.getAll();

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

      $("#resultWordsHistory .heatmapLegend .box" + index).html(
        `<div>${string}</div>`,
      );
    });

    $("#resultWordsHistory .words .word").each((_, word) => {
      const wordBurstAttr = $(word).attr("burst");
      if (wordBurstAttr === undefined) {
        $(word).css("color", unreachedColor);
      } else {
        let wordBurstVal = parseInt(wordBurstAttr);
        wordBurstVal = Math.round(
          getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(wordBurstVal),
        );
        steps.forEach((step) => {
          if (wordBurstVal >= step.val) {
            $(word).addClass("heatmapInherit");
            $(word).css("color", colors[step.colorId] as string);
          }
        });
      }
    });

    $("#resultWordsHistory .heatmapLegend .boxes .box").each((index, box) => {
      $(box).css("background", colors[index] as string);
    });
  } else {
    $("#resultWordsHistory .heatmapLegend").addClass("hidden");
    $("#resultWordsHistory .words .word").removeClass("heatmapInherit");
    $("#resultWordsHistory .words .word").css("color", "");

    $("#resultWordsHistory .heatmapLegend .boxes .box").css("color", "");
  }
}

export function highlightBadWord(index: number): void {
  requestDebouncedAnimationFrame(`test-ui.highlightBadWord.${index}`, () => {
    getWordElement(index)?.classList.add("error");
  });
}

export function highlightAllLettersAsCorrect(wordIndex: number): void {
  requestDebouncedAnimationFrame(
    `test-ui.highlightAllLettersAsCorrect.${wordIndex}`,
    () => {
      const letters = getWordElement(wordIndex)?.children;
      for (const letter of letters ?? []) {
        letter.classList.add("correct");
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
  const el = $("#typingTest");
  el.css(css);
  if (Config.maxLineWidth === 0) {
    el.removeClass("full-width-padding").addClass("content");
  } else {
    el.removeClass("content").addClass("full-width-padding");
  }
}

function updateLiveStatsMargin(): void {
  if (Config.tapeMode === "off") {
    $("#liveStatsMini").css({
      "justify-content": "start",
      "margin-left": "0.25em",
    });
  } else {
    $("#liveStatsMini").css({
      "justify-content": "center",
      "margin-left": Config.tapeMargin + "%",
    });
  }
}

function updateLiveStatsOpacity(value: TimerOpacity): void {
  $("#barTimerProgress").css("opacity", parseFloat(value as string));
  $("#liveStatsTextTop").css("opacity", parseFloat(value as string));
  $("#liveStatsTextBottom").css("opacity", parseFloat(value as string));
  $("#liveStatsMini").css("opacity", parseFloat(value as string));
}

function updateLiveStatsColor(value: TimerColor): void {
  $("#barTimerProgress").removeClass("timerSub");
  $("#barTimerProgress").removeClass("timerText");
  $("#barTimerProgress").removeClass("timerMain");

  $("#liveStatsTextTop").removeClass("timerSub");
  $("#liveStatsTextTop").removeClass("timerText");
  $("#liveStatsTextTop").removeClass("timerMain");

  $("#liveStatsTextBottom").removeClass("timerSub");
  $("#liveStatsTextBottom").removeClass("timerText");
  $("#liveStatsTextBottom").removeClass("timerMain");

  $("#liveStatsMini").removeClass("timerSub");
  $("#liveStatsMini").removeClass("timerText");
  $("#liveStatsMini").removeClass("timerMain");

  if (value === "main") {
    $("#barTimerProgress").addClass("timerMain");
    $("#liveStatsTextTop").addClass("timerMain");
    $("#liveStatsTextBottom").addClass("timerMain");
    $("#liveStatsMini").addClass("timerMain");
  } else if (value === "sub") {
    $("#barTimerProgress").addClass("timerSub");
    $("#liveStatsTextTop").addClass("timerSub");
    $("#liveStatsTextBottom").addClass("timerSub");
    $("#liveStatsMini").addClass("timerSub");
  } else if (value === "text") {
    $("#barTimerProgress").addClass("timerText");
    $("#liveStatsTextTop").addClass("timerText");
    $("#liveStatsTextBottom").addClass("timerText");
    $("#liveStatsMini").addClass("timerText");
  }
}

function showHideTestRestartButton(showHide: boolean): void {
  if (showHide) {
    $(".pageTest #restartTestButton").removeClass("hidden");
  } else {
    $(".pageTest #restartTestButton").addClass("hidden");
  }
}

export function getActiveWordTopAndHeightWithDifferentData(data: string): {
  top: number;
  height: number;
} {
  const activeWord = getActiveWordElement();

  if (!activeWord) throw new Error("No active word element found");

  const nodes = [];
  for (let i = activeWord.children.length; i < data.length; i++) {
    const tempLetter = document.createElement("letter");
    const displayData = data[i] === " " ? "_" : data[i];
    tempLetter.textContent = displayData as string;
    nodes.push(tempLetter);
  }

  activeWord.append(...nodes);

  const top = activeWord.offsetTop;
  const height = activeWord.offsetHeight;
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
    forceUpdateActiveWordLetters
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
      const wordsChildren = [...(wordsEl.children ?? [])] as HTMLElement[];

      let deleteElements = false;
      for (const child of wordsChildren) {
        if (
          !deleteElements &&
          parseInt(child.getAttribute("data-wordindex") ?? "-1", 10) ===
            TestState.activeWordIndex
        ) {
          deleteElements = true;
          continue;
        }
        if (deleteElements) {
          child.remove();
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
  $("#result").addClass("hidden");
  $("#typingTest").css("opacity", 0).removeClass("hidden");
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
  if (ActivePage.get() === "test") {
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
}

$(".pageTest #copyWordsListButton").on("click", async () => {
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

$(".pageTest #copyMissedWordsListButton").on("click", async () => {
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

$(".pageTest #toggleBurstHeatmap").on("click", async () => {
  setConfig("burstHeatmap", !Config.burstHeatmap);
  ResultWordHighlight.destroy();
});

$(".pageTest #resultWordsHistory").on("mouseleave", ".words .word", () => {
  $(".wordInputHighlight").remove();
});

$(".pageTest #result #wpmChart").on("mouseleave", () => {
  ResultWordHighlight.setIsHoverChart(false);
  ResultWordHighlight.clear();
});

$(".pageTest #result #wpmChart").on("mouseenter", () => {
  ResultWordHighlight.setIsHoverChart(true);
});

$(".pageTest #resultWordsHistory").on("mouseenter", ".words .word", (e) => {
  if (TestState.resultVisible) {
    const input = $(e.currentTarget).attr("input");
    const burst = parseInt($(e.currentTarget).attr("burst") as string);
    if (input !== undefined) {
      $(e.currentTarget).append(
        `<div class="wordInputHighlight withSpeed">
          <div class="text">
          ${input
            .replace(/\t/g, "_")
            .replace(/\n/g, "_")
            .replace(/</g, "&lt")
            .replace(/>/g, "&gt")}
          </div>
          <div class="speed">
          ${Format.typingSpeed(burst, { showDecimalPlaces: false })}
          ${Config.typingSpeedUnit}
          </div>
          </div>`,
      );
    }
  }
});

addEventListener("resize", () => {
  ResultWordHighlight.destroy();
});

$("#wordsInput").on("focus", (e) => {
  if (!isInputElementFocused()) return;
  if (!TestState.resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  Caret.show(true);
});

$("#wordsInput").on("focusout", () => {
  if (!isInputElementFocused()) {
    OutOfFocus.show();
  }
  Caret.hide();
});

$(".pageTest").on("click", "#showWordHistoryButton", () => {
  toggleResultWords();
});

$("#wordsWrapper").on("click", () => {
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
    if (ActivePage.get() === "test") {
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
      "blindMode",
      "indicateTypos",
      "tapeMode",
      "hideExtraLetters",
      "flipTestColors",
      "colorfulMode",
      "showAllLines",
      "fontSize",
      "maxLineWidth",
      "tapeMargin",
    ].includes(key)
  ) {
    updateWordWrapperClasses();
  }
  if (["tapeMode", "tapeMargin"].includes(key)) {
    updateLiveStatsMargin();
  }
});
