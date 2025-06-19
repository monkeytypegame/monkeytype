import * as Notifications from "../elements/notifications";
import * as ThemeColors from "../elements/theme-colors";
import Config, * as UpdateConfig from "../config";
import * as TestWords from "./test-words";
import * as TestInput from "./test-input";
import * as CustomText from "./custom-text";
import * as Caret from "./caret";
import * as OutOfFocus from "./out-of-focus";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as JSONData from "../utils/json-data";
import { blendTwoHexColors } from "../utils/colors";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as SlowTimer from "../states/slow-timer";
import * as CompositionState from "../states/composition";
import * as ConfigEvent from "../observables/config-event";
import * as Hangul from "hangul-js";
import { debounce } from "throttle-debounce";
import * as ResultWordHighlight from "../elements/result-word-highlight";
import * as ActivePage from "../states/active-page";
import Format from "../utils/format";
import {
  TimerColor,
  TimerOpacity,
} from "@monkeytype/contracts/schemas/configs";
import { convertRemToPixels } from "../utils/numbers";
import { findSingleActiveFunboxWithFunction } from "./funbox/list";
import * as TestState from "./test-state";

function createHintsHtml(
  incorrectLtrIndices: number[][],
  activeWordLetters: NodeListOf<Element>,
  inputWord: string
): string {
  const inputChars = Strings.splitIntoCharacters(inputWord);
  let hintsHtml = "";
  for (const adjacentLetters of incorrectLtrIndices) {
    for (const indx of adjacentLetters) {
      const blockLeft = (activeWordLetters[indx] as HTMLElement).offsetLeft;
      const blockWidth = (activeWordLetters[indx] as HTMLElement).offsetWidth;
      const blockIndices = `[${indx}]`;
      const blockChars = inputChars[indx];

      hintsHtml +=
        `<hint data-length=1 data-chars-index=${blockIndices}` +
        ` style="left: ${blockLeft + blockWidth / 2}px;">${blockChars}</hint>`;
    }
  }
  hintsHtml = `<div class="hints">${hintsHtml}</div>`;
  return hintsHtml;
}

async function joinOverlappingHints(
  incorrectLtrIndices: number[][],
  activeWordLetters: NodeListOf<Element>,
  hintElements: HTMLCollection
): Promise<void> {
  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRTL = currentLanguage.rightToLeft;

  let i = 0;
  for (const adjacentLetters of incorrectLtrIndices) {
    for (let j = 0; j < adjacentLetters.length - 1; j++) {
      const block1El = hintElements[i] as HTMLElement;
      const block2El = hintElements[i + 1] as HTMLElement;
      const leftBlock = isLanguageRTL ? block2El : block1El;
      const rightBlock = isLanguageRTL ? block1El : block2El;

      /** HintBlock.offsetLeft is at the center line of corresponding letters
       * then "transform: translate(-50%)" aligns hints with letters */
      if (
        leftBlock.offsetLeft + leftBlock.offsetWidth / 2 >
        rightBlock.offsetLeft - rightBlock.offsetWidth / 2
      ) {
        block1El.dataset["length"] = (
          parseInt(block1El.dataset["length"] ?? "1") +
          parseInt(block2El.dataset["length"] ?? "1")
        ).toString();

        const block1Indices = block1El.dataset["charsIndex"] ?? "[]";
        const block2Indices = block2El.dataset["charsIndex"] ?? "[]";
        block1El.dataset["charsIndex"] =
          block1Indices.slice(0, -1) + "," + block2Indices.slice(1);

        const letter1Index = adjacentLetters[j] ?? 0;
        const newLeft =
          (activeWordLetters[letter1Index] as HTMLElement).offsetLeft +
          (isLanguageRTL
            ? (activeWordLetters[letter1Index] as HTMLElement).offsetWidth
            : 0) +
          (block2El.offsetLeft - block1El.offsetLeft);
        block1El.style.left = newLeft.toString() + "px";

        block1El.insertAdjacentHTML("beforeend", block2El.innerHTML);

        block2El.remove();
        adjacentLetters.splice(j + 1, 1);
        i -= j === 0 ? 1 : 2;
        j -= j === 0 ? 1 : 2;
      }
      i++;
    }
    i++;
  }
}

const debouncedZipfCheck = debounce(250, async () => {
  const supports = await JSONData.checkIfLanguageSupportsZipf(Config.language);
  if (supports === "no") {
    Notifications.add(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(Config.language)
      )} does not support Zipf funbox, because the list is not ordered by frequency. Please try another word list.`,
      0,
      {
        duration: 7,
      }
    );
  }
  if (supports === "unknown") {
    Notifications.add(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(Config.language)
      )} may not support Zipf funbox, because we don't know if it's ordered by frequency or not. If you would like to add this label, please contact us.`,
      0,
      {
        duration: 7,
      }
    );
  }
});

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (
    (eventKey === "language" || eventKey === "funbox") &&
    Config.funbox.includes("zipf")
  ) {
    void debouncedZipfCheck();
  }
  if (eventKey === "fontSize" && !nosave) {
    OutOfFocus.hide();
    updateWordWrapperClasses();
  }
  if (
    ["fontSize", "fontFamily", "blindMode", "hideExtraLetters"].includes(
      eventKey
    )
  ) {
    updateHintsPosition().catch((e: unknown) => {
      console.error(e);
    });
  }

  if (eventKey === "theme") void applyBurstHeatmap();

  if (eventValue === undefined) return;
  if (eventKey === "highlightMode") {
    if (ActivePage.get() === "test") updateActiveElement();
  }

  if (
    [
      "highlightMode",
      "blindMode",
      "indicateTypos",
      "tapeMode",
      "hideExtraLetters",
    ].includes(eventKey)
  ) {
    updateWordWrapperClasses();
  }

  if (["tapeMode", "tapeMargin"].includes(eventKey)) {
    updateLiveStatsMargin();
  }

  if (eventKey === "showAllLines") {
    updateWordsWrapperHeight(true);
    if (eventValue === false) {
      void centerActiveLine();
    }
  }

  if (typeof eventValue !== "boolean") return;
  if (eventKey === "flipTestColors") flipColors(eventValue);
  if (eventKey === "colorfulMode") colorful(eventValue);
  if (eventKey === "burstHeatmap") void applyBurstHeatmap();
});

export let activeWordElementOffset = 0;
export let resultVisible = false;
export let activeWordTop = 0;
export let testRestarting = false;
export let lineTransition = false;
export let currentTestLine = 0;
export let resultCalculating = false;

export function setResultVisible(val: boolean): void {
  resultVisible = val;
}

export function setActiveWordElementOffset(val: number): void {
  activeWordElementOffset = val;
}

export function setActiveWordTop(val: number): void {
  activeWordTop = val;
}

let { promise: testRestartingPromise, resolve: restartingResolve } =
  Misc.promiseWithResolvers();

export { testRestartingPromise };

export function setTestRestarting(val: boolean): void {
  testRestarting = val;
  if (val) {
    ({ promise: testRestartingPromise, resolve: restartingResolve } =
      Misc.promiseWithResolvers());
  } else {
    restartingResolve();
  }
}

export function setResultCalculating(val: boolean): void {
  resultCalculating = val;
}

export function reset(): void {
  currentTestLine = 0;
  activeWordElementOffset = 0;
}

export function focusWords(): void {
  $("#wordsInput").trigger("focus");
}

export function blurWords(): void {
  $("#wordsInput").trigger("blur");
}

export function updateActiveElement(
  backspace?: boolean,
  initial = false
): void {
  const active = document.querySelector("#words .active");
  if (!backspace) {
    active?.classList.add("typed");
  }
  if (Config.mode === "zen" && backspace) {
    active?.remove();
  } else if (active !== null && !initial) {
    active.classList.remove("active");
  }
  const newActiveWord = document.querySelectorAll("#words .word")[
    TestState.activeWordIndex - activeWordElementOffset
  ] as HTMLElement | undefined;

  if (newActiveWord === undefined) {
    throw new Error("activeWord is undefined - can't update active element");
  }

  newActiveWord.classList.add("active");
  newActiveWord.classList.remove("error");
  newActiveWord.classList.remove("typed");

  activeWordTop = newActiveWord.offsetTop;

  if (!initial && shouldUpdateWordsInputPosition()) {
    void updateWordsInputPosition();
  }
  if (!initial && Config.tapeMode !== "off") {
    void scrollTape();
  }
}

export async function updateHintsPosition(): Promise<void> {
  if (
    ActivePage.get() !== "test" ||
    resultVisible ||
    Config.indicateTypos !== "below"
  )
    return;

  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRTL = currentLanguage.rightToLeft;

  let wordEl: HTMLElement | undefined;
  let letterElements: NodeListOf<Element> | undefined;

  const hintElements = document
    .getElementById("words")
    ?.querySelectorAll("div.word > div.hints > hint");
  for (let i = 0; i < (hintElements?.length ?? 0); i++) {
    const hintEl = hintElements?.[i] as HTMLElement;

    if (!wordEl || hintEl.parentElement?.parentElement !== wordEl) {
      wordEl = hintEl.parentElement?.parentElement as HTMLElement;
      letterElements = wordEl?.querySelectorAll("letter");
    }

    const letterIndices = hintEl.dataset["charsIndex"]
      ?.slice(1, -1)
      .split(",")
      .map((indx) => parseInt(indx));
    const leftmostIndx = isLanguageRTL
      ? parseInt(hintEl.dataset["length"] ?? "1") - 1
      : 0;

    const el = letterElements?.[
      letterIndices?.[leftmostIndx] ?? 0
    ] as HTMLElement;
    let newLeft = el.offsetLeft;
    const lettersWidth =
      letterIndices?.reduce((accum, curr) => {
        const el = letterElements?.[curr] as HTMLElement;
        return accum + el.offsetWidth;
      }, 0) ?? 0;
    newLeft += lettersWidth / 2;

    hintEl.style.left = newLeft.toString() + "px";
  }
}

function getWordHTML(word: string): string {
  let newlineafter = false;
  let retval = `<div class='word'>`;

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
  if (newlineafter)
    retval +=
      "<div class='beforeNewline'></div><div class='newline'></div><div class='afterNewline'></div>";
  return retval;
}

function updateWordWrapperClasses(): void {
  if (Config.tapeMode !== "off") {
    $("#words").addClass("tape");
    $("#wordsWrapper").addClass("tape");
  } else {
    $("#words").removeClass("tape");
    $("#wordsWrapper").removeClass("tape");
  }

  if (Config.blindMode) {
    $("#words").addClass("blind");
    $("#wordsWrapper").addClass("blind");
  } else {
    $("#words").removeClass("blind");
    $("#wordsWrapper").removeClass("blind");
  }

  if (Config.indicateTypos === "below") {
    $("#words").addClass("indicateTyposBelow");
    $("#wordsWrapper").addClass("indicateTyposBelow");
  } else {
    $("#words").removeClass("indicateTyposBelow");
    $("#wordsWrapper").removeClass("indicateTyposBelow");
  }

  if (Config.hideExtraLetters) {
    $("#words").addClass("hideExtraLetters");
    $("#wordsWrapper").addClass("hideExtraLetters");
  } else {
    $("#words").removeClass("hideExtraLetters");
    $("#wordsWrapper").removeClass("hideExtraLetters");
  }

  const existing =
    $("#words")
      ?.attr("class")
      ?.split(/\s+/)
      ?.filter((it) => !it.startsWith("highlight-")) ?? [];
  if (Config.highlightMode !== null) {
    existing.push("highlight-" + Config.highlightMode.replaceAll("_", "-"));
  }

  $("#words").attr("class", existing.join(" "));

  updateWordsWidth();
  updateWordsWrapperHeight(true);
  updateWordsMargin();
  setTimeout(() => {
    void updateWordsInputPosition(true);
  }, 250);
}

export function showWords(): void {
  $("#words").empty();

  if (Config.mode === "zen") {
    appendEmptyWordElement();
  } else {
    let wordsHTML = "";
    for (let i = 0; i < TestWords.words.length; i++) {
      wordsHTML += getWordHTML(TestWords.words.get(i));
    }
    $("#words").html(wordsHTML);
  }

  updateActiveElement(undefined, true);
  updateWordWrapperClasses();
  setTimeout(() => {
    void Caret.updatePosition();
  }, 125);
}

export function appendEmptyWordElement(): void {
  $("#words").append(
    "<div class='word'><letter class='invisible'>_</letter></div>"
  );
}

const posUpdateLangList = ["japanese", "chinese", "korean"];
function shouldUpdateWordsInputPosition(): boolean {
  const language = posUpdateLangList.some((l) => Config.language.startsWith(l));
  return language || (Config.mode !== "time" && Config.showAllLines);
}

export async function updateWordsInputPosition(initial = false): Promise<void> {
  if (ActivePage.get() !== "test") return;

  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRTL = currentLanguage.rightToLeft;

  const el = document.querySelector<HTMLElement>("#wordsInput");

  if (!el) return;

  const activeWord =
    document.querySelectorAll<HTMLElement>("#words .word")[
      TestState.activeWordIndex - activeWordElementOffset
    ];

  if (!activeWord) {
    el.style.top = "0px";
    el.style.left = "0px";
    return;
  }

  const computed = window.getComputedStyle(activeWord);
  const activeWordMargin =
    parseInt(computed.marginTop) + parseInt(computed.marginBottom);

  const letterHeight = convertRemToPixels(Config.fontSize);
  const targetTop =
    activeWord.offsetTop + letterHeight / 2 - el.offsetHeight / 2 + 1; //+1 for half of border

  if (Config.tapeMode !== "off") {
    const wordsWrapperWidth = (
      document.querySelector("#wordsWrapper") as HTMLElement
    ).offsetWidth;
    el.style.maxWidth =
      wordsWrapperWidth * (1 - Config.tapeMargin / 100) + "px";
  } else {
    el.style.maxWidth = "";
  }
  if (activeWord.offsetWidth < letterHeight) {
    el.style.width = letterHeight + "px";
  } else {
    el.style.width = activeWord.offsetWidth + "px";
  }

  if (
    initial &&
    !shouldUpdateWordsInputPosition() &&
    Config.tapeMode === "off"
  ) {
    el.style.top = targetTop + letterHeight + activeWordMargin + 4 + "px";
  } else {
    el.style.top = targetTop + "px";
  }

  if (activeWord.offsetWidth < letterHeight && isLanguageRTL) {
    el.style.left = activeWord.offsetLeft - letterHeight + "px";
  } else {
    el.style.left = activeWord.offsetLeft + "px";
  }
}

let centeringActiveLine: Promise<void> = Promise.resolve();

export async function centerActiveLine(): Promise<void> {
  if (Config.showAllLines) {
    return;
  }

  const { resolve, promise } = Misc.promiseWithResolvers<void>();
  centeringActiveLine = promise;

  const wordElements = document.querySelectorAll<HTMLElement>("#words .word");
  const activeWordIndex = TestState.activeWordIndex - activeWordElementOffset;
  const activeWordEl = wordElements[activeWordIndex];
  if (!activeWordEl) {
    resolve();
    return;
  }
  const currentTop = activeWordEl.offsetTop;

  let previousLineTop = currentTop;
  for (let i = activeWordIndex - 1; i >= 0; i--) {
    previousLineTop = wordElements[i]?.offsetTop ?? currentTop;
    if (previousLineTop < currentTop) {
      await lineJump(previousLineTop, true);
      resolve();
      return;
    }
  }

  resolve();
}

export function updateWordsWrapperHeight(force = false): void {
  if (ActivePage.get() !== "test" || resultVisible) return;
  if (!force && Config.mode !== "custom") return;
  const wrapperEl = document.getElementById("wordsWrapper") as HTMLElement;
  const outOfFocusEl = document.querySelector(
    ".outOfFocusWarning"
  ) as HTMLElement;
  const wordElements = wrapperEl.querySelectorAll<HTMLElement>("#words .word");
  const activeWordEl =
    wordElements[TestState.activeWordIndex - activeWordElementOffset];
  if (!activeWordEl) return;

  wrapperEl.classList.remove("hidden");

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
    wrapperEl.style.height = "";
  } else if (Config.mode === "zen") {
    //zen mode, showAllLines off
    wrapperEl.style.height = wordHeight * 2 + "px";
  } else {
    if (Config.tapeMode === "off") {
      //tape off, showAllLines off, non-zen mode
      let lines = 0;
      let lastTop = 0;
      let wordIndex = 0;
      let wrapperHeight = 0;

      while (lines < 3) {
        const word = wordElements[wordIndex] as HTMLElement | null;
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
      wrapperEl.style.height = wrapperHeight + "px";
    } else {
      //show 3 lines if tape mode is on and has newlines, otherwise use words height (because of indicate typos: below)
      if (TestWords.hasNewline) {
        wrapperEl.style.height = wordHeight * 3 + "px";
      } else {
        const wordsHeight =
          document.getElementById("words")?.offsetHeight ?? wordHeight;
        wrapperEl.style.height = wordsHeight + "px";
      }
    }
  }

  outOfFocusEl.style.maxHeight = wordHeight * 3 + "px";
}

function updateWordsMargin(): void {
  if (Config.tapeMode !== "off") {
    void scrollTape(true);
  } else {
    const wordsEl = document.getElementById("words") as HTMLElement;
    const afterNewlineEls =
      wordsEl.querySelectorAll<HTMLElement>(".afterNewline");
    if (Config.smoothLineScroll) {
      const jqWords = $(wordsEl);
      jqWords.stop("leftMargin", true, false).animate(
        {
          marginLeft: 0,
        },
        {
          duration: SlowTimer.get() ? 0 : 125,
          queue: "leftMargin",
        }
      );
      jqWords.dequeue("leftMargin");
      $(afterNewlineEls)
        .stop(true, false)
        .animate({ marginLeft: 0 }, SlowTimer.get() ? 0 : 125);
    } else {
      wordsEl.style.marginLeft = `0`;
      for (const afterNewline of afterNewlineEls) {
        afterNewline.style.marginLeft = `0`;
      }
    }
  }
}

export function addWord(word: string): void {
  $("#words").append(getWordHTML(word));
}

export function flipColors(tf: boolean): void {
  if (tf) {
    $("#words").addClass("flipped");
  } else {
    $("#words").removeClass("flipped");
  }
}

export function colorful(tc: boolean): void {
  if (tc) {
    $("#words").addClass("colorfulMode");
  } else {
    $("#words").removeClass("colorfulMode");
  }
}

export async function updateActiveWordLetters(
  inputOverride?: string
): Promise<void> {
  const input = inputOverride ?? TestInput.input.current;
  const currentWord = TestWords.words.getCurrent();
  if (!currentWord && Config.mode !== "zen") return;
  let ret = "";
  const activeWord =
    document.querySelectorAll<HTMLElement>("#words .word")?.[
      TestState.activeWordIndex - activeWordElementOffset
    ];
  if (!activeWord) return;
  const hintIndices: number[][] = [];

  let newlineafter = false;

  if (Config.mode === "zen") {
    for (const char of TestInput.input.current) {
      if (char === "\t") {
        ret += `<letter class='tabChar correct' style="opacity: 0"><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
      } else if (char === "\n") {
        newlineafter = true;
        ret += `<letter class='nlChar correct' style="opacity: 0"><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
      } else {
        ret += `<letter class="correct">${char}</letter>`;
      }
    }
    if (TestInput.input.current === "") {
      ret += `<letter class='invisible'>_</letter>`;
    }
  } else {
    let correctSoFar = false;

    const containsKorean = TestInput.input.getKoreanStatus();

    if (!containsKorean) {
      // slice earlier if input has trailing compose characters
      const inputWithoutComposeLength = Misc.trailingComposeChars.test(input)
        ? input.search(Misc.trailingComposeChars)
        : input.length;
      if (
        input.search(Misc.trailingComposeChars) < currentWord.length &&
        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
        currentWord.slice(0, inputWithoutComposeLength) ===
          input.slice(0, inputWithoutComposeLength)
      ) {
        correctSoFar = true;
      }
    } else {
      // slice earlier if input has trailing compose characters
      const koCurrentWord: string = Hangul.disassemble(currentWord).join("");
      const koInput: string = Hangul.disassemble(input).join("");
      const inputWithoutComposeLength: number = Misc.trailingComposeChars.test(
        input
      )
        ? input.search(Misc.trailingComposeChars)
        : koInput.length;
      if (
        input.search(Misc.trailingComposeChars) <
          Hangul.d(koCurrentWord).length &&
        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
        koCurrentWord.slice(0, inputWithoutComposeLength) ===
          koInput.slice(0, inputWithoutComposeLength)
      ) {
        correctSoFar = true;
      }
    }

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
      } else if (
        currentLetter !== undefined &&
        CompositionState.getComposing() &&
        i >= CompositionState.getStartPos() &&
        !(containsKorean && !correctSoFar)
      ) {
        ret += `<letter class="dead">${
          Config.indicateTypos === "replace"
            ? inputChars[i] === " "
              ? "_"
              : inputChars[i]
            : currentLetter
        }</letter>`;
      } else if (currentLetter === undefined) {
        let letter = inputChars[i];
        if (letter === " " || letter === "\t" || letter === "\n") {
          letter = "_";
        }
        ret += `<letter class="incorrect extra ${tabChar}${nlChar}">${letter}</letter>`;
      } else {
        ret +=
          `<letter class="incorrect ${tabChar}${nlChar}">` +
          (Config.indicateTypos === "replace"
            ? inputChars[i] === " "
              ? "_"
              : inputChars[i]
            : currentLetter) +
          "</letter>";
        if (Config.indicateTypos === "below") {
          if (!hintIndices?.length) hintIndices.push([i]);
          else {
            const lastblock = hintIndices[hintIndices.length - 1];
            if (lastblock?.[lastblock.length - 1] === i - 1) lastblock.push(i);
            else hintIndices.push([i]);
          }
        }
      }
    }

    for (let i = inputChars.length; i < currentWordChars.length; i++) {
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

  activeWord.innerHTML = ret;

  if (hintIndices?.length) {
    const activeWordLetters = activeWord.querySelectorAll("letter");
    const hintsHtml = createHintsHtml(hintIndices, activeWordLetters, input);
    activeWord.insertAdjacentHTML("beforeend", hintsHtml);
    const hintElements = activeWord.getElementsByTagName("hint");
    await joinOverlappingHints(hintIndices, activeWordLetters, hintElements);
  }

  if (newlineafter)
    $("#words").append(
      "<div class='beforeNewline'></div><div class='newline'></div><div class='afterNewline'></div>"
    );
  if (Config.tapeMode !== "off") {
    void scrollTape();
  }
}

// this is needed in tape mode because sometimes we want the newline character to appear above the next line
// and sometimes we want it to be shifted to the left
// (for example if the newline is typed incorrectly, or there are any extra letters after it)
function getNlCharWidth(
  lastWordInLine?: Element | HTMLElement,
  checkIfIncorrect = true
): number {
  let nlChar: HTMLElement | null;
  if (lastWordInLine) {
    nlChar = lastWordInLine.querySelector<HTMLElement>("letter.nlChar");
  } else {
    nlChar = document.querySelector<HTMLElement>(
      "#words > .word > letter.nlChar"
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

export async function scrollTape(noRemove = false): Promise<void> {
  if (ActivePage.get() !== "test" || resultVisible) return;

  await centeringActiveLine;

  const currentLang = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRTL = currentLang.rightToLeft;

  // index of the active word in the collection of .word elements
  const wordElementIndex = TestState.activeWordIndex - activeWordElementOffset;
  const wordsWrapperWidth = (
    document.querySelector("#wordsWrapper") as HTMLElement
  ).offsetWidth;
  const wordsEl = document.getElementById("words") as HTMLElement;
  const wordsChildrenArr = [...wordsEl.children] as HTMLElement[];
  const wordElements = wordsEl.getElementsByClassName("word");
  const activeWordEl = wordElements[wordElementIndex] as
    | HTMLElement
    | undefined;
  if (!activeWordEl) return;
  const afterNewLineEls = wordsEl.getElementsByClassName("afterNewline");

  let wordsWidthBeforeActive = 0;
  let fullLineWidths = 0;
  let wordsToRemoveCount = 0;
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
  let lastVisibleAfterNewline = afterNewLineEls[
    newLinesBeforeActiveWord + 1
  ] as HTMLElement | undefined;
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
    window.getComputedStyle(activeWordEl).marginRight
  );

  /*calculate .afterNewline & #words new margins + determine elements to remove*/
  for (let i = 0; i <= lastElementIndex; i++) {
    const child = wordsChildrenArr[i] as HTMLElement;
    if (child.classList.contains("word")) {
      leadingNewLine = false;
      const wordOuterWidth = $(child).outerWidth(true) ?? 0;
      const forWordLeft = Math.floor(child.offsetLeft);
      const forWordWidth = Math.floor(child.offsetWidth);
      if (
        (!isLanguageRTL && forWordLeft < 0 - forWordWidth) ||
        (isLanguageRTL && forWordLeft > wordsWrapperWidth)
      ) {
        toRemove.push(child);
        widthRemoved += wordOuterWidth;
        wordsToRemoveCount++;
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
  if (toRemove.length > 0 && !noRemove) {
    activeWordElementOffset += wordsToRemoveCount;
    for (const el of toRemove) el.remove();
    for (let i = 0; i < widthRemovedFromLine.length; i++) {
      const afterNewlineEl = afterNewLineEls[i] as HTMLElement;
      const currentLineIndent =
        parseFloat(afterNewlineEl.style.marginLeft) || 0;
      afterNewlineEl.style.marginLeft = `${
        currentLineIndent - (widthRemovedFromLine[i] ?? 0)
      }px`;
    }
    if (isLanguageRTL) widthRemoved *= -1;
    const currentWordsMargin = parseFloat(wordsEl.style.marginLeft) || 0;
    wordsEl.style.marginLeft = `${currentWordsMargin + widthRemoved}px`;
  }

  /* calculate current word width to add to #words margin */
  let currentWordWidth = 0;
  const inputLength = TestInput.input.current.length;
  if (Config.tapeMode === "letter" && inputLength > 0) {
    const letters = activeWordEl.querySelectorAll("letter");
    let lastPositiveLetterWidth = 0;
    for (let i = 0; i < inputLength; i++) {
      const letter = letters[i] as HTMLElement;
      if (
        (Config.blindMode || Config.hideExtraLetters) &&
        letter.classList.contains("extra")
      ) {
        continue;
      }
      const letterOuterWidth = $(letter).outerWidth(true) ?? 0;
      currentWordWidth += letterOuterWidth;
      if (letterOuterWidth > 0) lastPositiveLetterWidth = letterOuterWidth;
    }
    // if current letter has zero width move the tape to previous positive width letter
    if ($(letters[inputLength] as Element).outerWidth(true) === 0)
      currentWordWidth -= lastPositiveLetterWidth;
  }

  /* change to new #words & .afterNewline margins */
  let newMargin =
    wordsWrapperWidth * (Config.tapeMargin / 100) -
    wordsWidthBeforeActive -
    currentWordWidth;
  if (isLanguageRTL) newMargin = wordRightMargin - newMargin;

  const jqWords = $(wordsEl);
  if (Config.smoothLineScroll) {
    jqWords.stop("leftMargin", true, false).animate(
      {
        marginLeft: newMargin,
      },
      {
        duration: SlowTimer.get() ? 0 : 125,
        queue: "leftMargin",
      }
    );
    jqWords.dequeue("leftMargin");
    for (let i = 0; i < afterNewlinesNewMargins.length; i++) {
      const newMargin = afterNewlinesNewMargins[i] ?? 0;
      $(afterNewLineEls[i] as Element)
        .stop(true, false)
        .animate({ marginLeft: newMargin }, SlowTimer.get() ? 0 : 125);
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
      Config.language
    )}${fbtext}`
  );
  $(".pageTest #premidSecondsLeft").text(Config.time);
}

function removeElementsBeforeWord(
  lastElementToRemoveIndex: number,
  wordsChildren?: Element[] | HTMLCollection
): number {
  // remove all elements before lastElementToRemove (included)
  // and return removed `.word`s count
  if (!wordsChildren) {
    wordsChildren = document.getElementById("words")?.children;
    if (!wordsChildren) return 0;
  }

  let removedWords = 0;
  for (let i = 0; i <= lastElementToRemoveIndex; i++) {
    const child = wordsChildren[i];
    if (!child || !child.isConnected) continue;
    if (child.classList.contains("word")) removedWords++;
    if (!child.classList.contains("smoothScroller")) child.remove();
  }
  return removedWords;
}

let currentLinesAnimating = 0;

export async function lineJump(
  currentTop: number,
  force = false
): Promise<void> {
  const { resolve, promise } = Misc.promiseWithResolvers<void>();

  //last word of the line
  if (currentTestLine > 0 || force) {
    const hideBound = currentTop;

    // index of the active word in the collection of .word elements
    const wordElementIndex =
      TestState.activeWordIndex - activeWordElementOffset;
    const wordsEl = document.getElementById("words") as HTMLElement;
    const wordsChildrenArr = [...wordsEl.children];
    const wordElements = wordsEl.querySelectorAll(".word");
    const activeWordEl = wordElements[wordElementIndex];
    if (!activeWordEl) {
      resolve();
      return;
    }

    // index of the active word in all #words.children
    // (which contains .word/.newline/.beforeNewline/.afterNewline elements)
    const activeWordIndex = wordsChildrenArr.indexOf(activeWordEl);

    let lastElementToRemoveIndex: number | undefined = undefined;
    for (let i = activeWordIndex - 1; i >= 0; i--) {
      const child = wordsChildrenArr[i] as HTMLElement;
      if (child.classList.contains("hidden")) continue;
      if (Math.floor(child.offsetTop) < hideBound) {
        if (child.classList.contains("word")) {
          lastElementToRemoveIndex = i;
          break;
        } else if (child.classList.contains("beforeNewline")) {
          // set it to .newline but check .beforeNewline.offsetTop
          // because it's more reliable
          lastElementToRemoveIndex = i + 1;
          break;
        }
      }
    }

    const wordHeight = $(activeWordEl).outerHeight(true) as number;
    const paceCaretElement = document.querySelector(
      "#paceCaret"
    ) as HTMLElement;

    if (lastElementToRemoveIndex === undefined) {
      resolve();
    } else if (Config.smoothLineScroll) {
      lineTransition = true;
      const smoothScroller = $("#words .smoothScroller");
      if (smoothScroller.length === 0) {
        wordsEl.insertAdjacentHTML(
          "afterbegin",
          `<div class="smoothScroller" style="position: fixed;height:${wordHeight}px;width:100%"></div>`
        );
      } else {
        smoothScroller.css(
          "height",
          `${(smoothScroller.outerHeight(true) ?? 0) + wordHeight}px`
        );
      }
      $("#words .smoothScroller")
        .stop(true, false)
        .animate(
          {
            height: 0,
          },
          SlowTimer.get() ? 0 : 125,
          () => {
            $("#words .smoothScroller").remove();
          }
        );
      $(paceCaretElement)
        .stop(true, false)
        .animate(
          {
            top: paceCaretElement?.offsetTop - wordHeight,
          },
          SlowTimer.get() ? 0 : 125
        );

      const newCss: Record<string, string> = {
        marginTop: `-${wordHeight * (currentLinesAnimating + 1)}px`,
      };

      currentLinesAnimating++;
      const jqWords = $(wordsEl);
      jqWords.stop("topMargin", true, false).animate(newCss, {
        duration: SlowTimer.get() ? 0 : 125,
        queue: "topMargin",
        complete: () => {
          currentLinesAnimating = 0;
          activeWordTop = (
            document.querySelectorAll("#words .word")?.[
              wordElementIndex
            ] as HTMLElement
          )?.offsetTop;
          activeWordElementOffset += removeElementsBeforeWord(
            lastElementToRemoveIndex,
            wordsChildrenArr
          );
          wordsEl.style.marginTop = "0";
          lineTransition = false;
          resolve();
        },
      });
      jqWords.dequeue("topMargin");
    } else {
      activeWordElementOffset += removeElementsBeforeWord(
        lastElementToRemoveIndex,
        wordsChildrenArr
      );
      paceCaretElement.style.top = `${
        paceCaretElement.offsetTop - wordHeight
      }px`;
      resolve();
    }
  }
  currentTestLine++;
  updateWordsWrapperHeight();

  return promise;
}

export function setRightToLeft(isEnabled: boolean): void {
  if (isEnabled) {
    $("#words").addClass("rightToLeftTest");
    $("#resultWordsHistory .words").addClass("rightToLeftTest");
    $("#resultReplay .words").addClass("rightToLeftTest");
  } else {
    $("#words").removeClass("rightToLeftTest");
    $("#resultWordsHistory .words").removeClass("rightToLeftTest");
    $("#resultReplay .words").removeClass("rightToLeftTest");
  }
}

export function setLigatures(isEnabled: boolean): void {
  if (isEnabled) {
    $("#words").addClass("withLigatures");
    $("#resultWordsHistory .words").addClass("withLigatures");
    $("#resultReplay .words").addClass("withLigatures");
  } else {
    $("#words").removeClass("withLigatures");
    $("#resultWordsHistory .words").removeClass("withLigatures");
    $("#resultReplay .words").removeClass("withLigatures");
  }
}

async function loadWordsHistory(): Promise<boolean> {
  $("#resultWordsHistory .words").empty();
  let wordsHTML = "";
  for (let i = 0; i < TestInput.input.getHistory().length + 2; i++) {
    const input = TestInput.input.getHistory(i);
    const corrected = TestInput.corrected.getHistory(i);
    const word = TestWords.words.get(i);
    const containsKorean =
      input?.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g
      ) !== null ||
      word?.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g
      ) !== null;
    let wordEl = "";
    try {
      if (input === undefined || input === "") {
        throw new Error("empty input word");
      }

      const errorClass = input !== word ? "error" : "";

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
      const wordCharacters = Strings.splitIntoCharacters(word);
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

      for (let c = 0; c < loop; c++) {
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
          c + 1 === loop &&
          historyWord !== undefined &&
          historyWord.length > input.length
        ) {
          extraCorrected = "extraCorrected";
        }
        if (Config.mode === "zen" || wordCharacters[c] !== undefined) {
          if (
            Config.mode === "zen" ||
            inputCharacters[c] === wordCharacters[c]
          ) {
            if (
              correctedChar === inputCharacters[c] ||
              correctedChar === undefined
            ) {
              wordEl += `<letter class="correct ${extraCorrected}">${inputCharacters[c]}</letter>`;
            } else {
              wordEl +=
                `<letter class="corrected ${extraCorrected}">` +
                inputCharacters[c] +
                "</letter>";
            }
          } else {
            if (inputCharacters[c] === TestInput.input.current) {
              wordEl +=
                `<letter class='correct ${extraCorrected}'>` +
                wordCharacters[c] +
                "</letter>";
            } else if (inputCharacters[c] === undefined) {
              wordEl += "<letter>" + wordCharacters[c] + "</letter>";
            } else {
              wordEl +=
                `<letter class="incorrect ${extraCorrected}">` +
                wordCharacters[c] +
                "</letter>";
            }
          }
        } else {
          wordEl +=
            '<letter class="incorrect extra">' +
            inputCharacters[c] +
            "</letter>";
        }
      }
      wordEl += "</div>";
    } catch (e) {
      try {
        wordEl = "<div class='word'>";
        for (const char of word) {
          wordEl += "<letter>" + char + "</letter>";
        }
        wordEl += "</div>";
      } catch {}
    }
    wordsHTML += wordEl;
  }
  $("#resultWordsHistory .words").html(wordsHTML);
  $("#showWordHistoryButton").addClass("loaded");
  return true;
}

export function toggleResultWords(noAnimation = false): void {
  if (resultVisible) {
    ResultWordHighlight.updateToggleWordsHistoryTime();
    if ($("#resultWordsHistory").stop(true, true).hasClass("hidden")) {
      //show

      if ($("#resultWordsHistory .words .word").length === 0) {
        $("#words").html(
          `<div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`
        );
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
        `<div>${string}</div>`
      );
    });

    $("#resultWordsHistory .words .word").each((_, word) => {
      const wordBurstAttr = $(word).attr("burst");
      if (wordBurstAttr === undefined) {
        $(word).css("color", unreachedColor);
      } else {
        let wordBurstVal = parseInt(wordBurstAttr);
        wordBurstVal = Math.round(
          getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(wordBurstVal)
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
  $($("#words .word")[index] as HTMLElement).addClass("error");
}

export function highlightAllLettersAsCorrect(wordIndex: number): void {
  $($("#words .word")[wordIndex] as HTMLElement)
    .find("letter")
    .addClass("correct");
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
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
}

$(".pageTest #toggleBurstHeatmap").on("click", async () => {
  UpdateConfig.setBurstHeatmap(!Config.burstHeatmap);
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
  if (resultVisible) {
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
          </div>`
      );
    }
  }
});

addEventListener("resize", () => {
  ResultWordHighlight.destroy();
});

$("#wordsInput").on("focus", (e) => {
  const wordsFocused = e.target === document.activeElement;
  if (!wordsFocused) return;
  if (!resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  Caret.show(true);
});

$("#wordsInput").on("focusout", () => {
  if (!resultVisible && Config.showOutOfFocusWarning) {
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

ConfigEvent.subscribe((key, value) => {
  if (key === "quickRestart") {
    if (value === "off") {
      $(".pageTest #restartTestButton").removeClass("hidden");
    } else {
      $(".pageTest #restartTestButton").addClass("hidden");
    }
  }
  if (key === "maxLineWidth") {
    updateWordsWidth();
  }
  if (key === "timerOpacity") {
    updateLiveStatsOpacity(value as TimerOpacity);
  }
  if (key === "timerColor") {
    updateLiveStatsColor(value as TimerColor);
  }
});
