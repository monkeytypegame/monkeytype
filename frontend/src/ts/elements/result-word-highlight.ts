// The code defines the necessary operations for a text highlighting system in a web page.
// This system utilizes absolutely positioned, overflow hidden divs, known as "highlightContainer",
// to place a highlight (".highlight") on top of the text to be highlighted.
// Constants for padding around the highlights

import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import Config from "../config";

const PADDING_X = 16;
const PADDING_Y = 12;
const PADDING_OFFSET_X = PADDING_X / 2;
const PADDING_OFFSET_Y = PADDING_Y / 2;
const TOGGLE_RESULT_WORDS_BUFFER = 250;

// Type definition for a Line object, each representing a line of text in #resultWordsHistory
type Line = {
  rect: DOMRect;
  firstWordIndex: number;
  lastWordIndex: number;
};

// Array of Line objects
let lines: Line[] = [];

// JQuery collection of all word elements
let wordEls: JQuery;

// Dictionary mapping word indices to line indices
let wordIndexToLineIndexDict: Record<number, number> = {};

// Array of container elements for highlights
let highlightContainerEls: HTMLElement[] = [];

// Array of highlight elements
let highlightEls: HTMLElement[] = [];

// Array of input word container elements
let inputWordsContainerEls: HTMLElement[] = [];

// Array of user inputs aligned with .word elements
let inputWordEls: HTMLElement[] = [];

// Range of currently highlighted words
let highlightRange: number[] = [];

// #resultWordsHistory element and its bounding rect
let RWH_el: HTMLElement;
let RWH_rect: DOMRect;

// Last time toggleResultWords was toggled on
let lastToggleWordsHistoryTime = new Date();

// Flags
let isInitialized = false;
let isHoveringChart = false;
let isFirstHighlightSinceInit = true;
let isFirstHighlightSinceClear = true;
let isLanguageRightToLeft = false;
let isInitInProgress = false;

// Highlights .word elements in range [firstWordIndex, lastWordIndex]
export async function highlightWordsInRange(
  firstWordIndex: number,
  lastWordIndex: number
): Promise<boolean> {
  // Early exit if not hovering over chart
  if (!isHoveringChart) {
    return false;
  }

  // Early exit if highlight range has not changed
  if (
    highlightRange !== undefined &&
    firstWordIndex === highlightRange[0] &&
    lastWordIndex === highlightRange[1]
  ) {
    return false;
  }

  // Initialize highlight system if not already initialized
  if (!isInitialized) {
    const initResponse = await init();
    if (!initResponse) {
      return false;
    }
  }

  // Make sure both indices are valid
  if (
    firstWordIndex === undefined ||
    lastWordIndex === undefined ||
    firstWordIndex < 0 ||
    lastWordIndex < 0 ||
    lastWordIndex < firstWordIndex
  ) {
    return false;
  }

  // Update lastWordIndex if it is out of bounds
  lastWordIndex = Math.min(lastWordIndex, wordEls.length - 1);

  // Get highlight properties
  const newHighlightElementPositions = getHighlightElementPositions(
    firstWordIndex,
    lastWordIndex,
    isLanguageRightToLeft
  );

  // For each line...
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const highlightEl = highlightEls[lineIndex] as HTMLElement;
    const inputWordsContainer: HTMLElement = highlightEl
      .children[0] as HTMLElement;
    highlightEl.classList.remove("highlight-hidden");

    // Make highlight appear instantly for first highlight
    if (!isFirstHighlightSinceInit && !isFirstHighlightSinceClear) {
      highlightEl.classList.add("withAnimation");
      inputWordsContainer.classList.add("withAnimation");
    } else {
      highlightEl.classList.remove("withAnimation");
      inputWordsContainer.classList.remove("withAnimation");
    }

    const position = newHighlightElementPositions[lineIndex];
    if (!position) continue;

    // Update highlight element positions
    highlightEl.style.right = position.highlightRight + "px";
    // inputWordsContainer.style.right = 0 + "px";

    inputWordsContainer.style.left = position.inputContainerLeft + "px";
    highlightEl.style.left = position.highlightLeft + "px";
  }

  // Update flags and variables
  isFirstHighlightSinceInit = false;
  isFirstHighlightSinceClear = false;
  highlightRange = [firstWordIndex, lastWordIndex];
  return true;
}

// Function to clear all highlights
export function clear(): void {
  for (const highlightEl of highlightEls) {
    highlightEl.classList.add("highlight-hidden");
  }
  isFirstHighlightSinceClear = true;
  highlightRange = [];
}

// Function to completely destroy the highlight system.
export function destroy(): void {
  if (!isInitialized) return;

  // Remove highlight containers from DOM
  for (const highlightContainerEl of highlightContainerEls) {
    highlightContainerEl.remove();
  }

  // Reset variables
  highlightEls = [];
  highlightContainerEls = [];
  wordIndexToLineIndexDict = {};
  lines = [];
  inputWordsContainerEls = [];
  inputWordEls = [];
  isInitialized = false;
  isFirstHighlightSinceInit = true;
  isFirstHighlightSinceClear = true;
  highlightRange = [];
}

// Sets isHoveringChart flag
export function setIsHoverChart(state: boolean): void {
  isHoveringChart = state;
}

// Function to initialize the highlight system
async function init(): Promise<boolean> {
  // Early exit if already initialized or initialization is in progress
  if (isInitialized || isInitInProgress) {
    return false;
  }

  isInitInProgress = true;

  // Wait for toggle button to fully populate resultWordHighlights before highlighting
  const TIME_DIFF_SINCE_LAST_TOGGLE =
    new Date().getTime() - lastToggleWordsHistoryTime.getTime();
  if (TIME_DIFF_SINCE_LAST_TOGGLE < TOGGLE_RESULT_WORDS_BUFFER) {
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        TOGGLE_RESULT_WORDS_BUFFER - TIME_DIFF_SINCE_LAST_TOGGLE
      )
    );
  }

  // Set isLanguageRTL
  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  isLanguageRightToLeft = currentLanguage.rightToLeft;

  RWH_el = $("#resultWordsHistory")[0] as HTMLElement;
  RWH_rect = RWH_el.getBoundingClientRect();
  wordEls = $(RWH_el).find(".words .word[input]");

  // remove non-input words
  if (wordEls.length === 0) {
    isInitInProgress = false;
    return false;
  }

  let prevLineEndWordIndex = -1;
  let lineRect;
  let currLineIndex = 0;

  // Construct lines array and wordIndexToLineIndexDict
  wordIndexToLineIndexDict[0] = 0;
  for (let i = 1; i < wordEls.length; i++) {
    const word = wordEls[i] as HTMLElement;
    const prevWord = wordEls[i - 1] as HTMLElement;

    if (word.offsetTop != prevWord.offsetTop) {
      currLineIndex++;
      lineRect = Misc.getBoundingRectOfElements([
        wordEls[prevLineEndWordIndex + 1] as HTMLElement,
        prevWord,
      ]);
      lines.push({
        firstWordIndex: prevLineEndWordIndex + 1,
        lastWordIndex: i - 1,
        rect: lineRect,
      });
      prevLineEndWordIndex = i - 1;
    }
    wordIndexToLineIndexDict[i] = currLineIndex;
  }

  // Construct last line
  lineRect = Misc.getBoundingRectOfElements([
    wordEls[prevLineEndWordIndex + 1] as HTMLElement,
    wordEls[wordEls.length - 1] as HTMLElement,
  ]);
  lines.push({
    firstWordIndex: prevLineEndWordIndex + 1,
    lastWordIndex: wordEls.length - 1,
    rect: lineRect,
  });

  // Set top and left as % realtive to "#resultWordsHistory"
  const RWH_width = RWH_rect.width;
  const RWH_height = RWH_rect.height;
  const RWH_rect_top = RWH_rect.top;
  const RWH_rect_left = RWH_rect.left;

  // Create highlightContainers
  lines.forEach((line) => {
    const highlightContainer = document.createElement("div");
    highlightContainer.classList.add("highlightContainer");
    highlightContainerEls.push(highlightContainer);

    // Calculate highlightContainer properties
    const HC_rect_top = line.rect.top - PADDING_OFFSET_Y;
    const HC_rect_left = line.rect.left - PADDING_OFFSET_X;
    const HC_rel_top = HC_rect_top - RWH_rect_top;
    const HC_rel_left = HC_rect_left - RWH_rect_left;
    const HC_width = line.rect.width + PADDING_X;
    const HC_height = line.rect.height + PADDING_Y;

    // Calculate inputWordsContainer positions
    const IWC_width = line.rect.width;
    const IWC_height = line.rect.height;

    // Calculate top, left as % relative to "#resultWordsHistory"
    const HC_top_percent = (HC_rel_top / RWH_height) * 100 + "%";
    const HC_left_percent = (HC_rel_left / RWH_width) * 100 + "%";
    const HC_width_percent = (HC_width / RWH_width) * 100 + "%";
    const HC_height_percent = (HC_height / RWH_height) * 100 + "%";

    highlightContainer.style.width = HC_width_percent;
    highlightContainer.style.top = HC_top_percent;
    highlightContainer.style.left = HC_left_percent;
    highlightContainer.style.height = HC_height_percent;

    // Construct and inject highlight elements
    const highlightEl = document.createElement("div");
    const inputWordsContainerEl = document.createElement("div");

    // Calculate inputWordsContainerEl properties relative to highlightContainer
    inputWordsContainerEl.style.top = line.rect.top - HC_rect_top + "px";
    inputWordsContainerEl.style.left = line.rect.left - HC_rect_left + "px";
    inputWordsContainerEl.style.width = IWC_width + "px";
    inputWordsContainerEl.style.height = IWC_height + "px";

    highlightEl.className = "highlight highlight-hidden";
    inputWordsContainerEl.className = "inputWordsContainer";

    for (let i = line.firstWordIndex; i <= line.lastWordIndex; i += 1) {
      const wordEl = wordEls[i] as HTMLElement;
      const userInputString = wordEl.getAttribute("input") ?? "";

      if (!userInputString) {
        continue;
      }

      const inputWordEl = document.createElement("div");

      // For RTL languages, account for difference between highlightContainer left and RWH_el left
      let RTL_offset;
      if (isLanguageRightToLeft) {
        RTL_offset = line.rect.left - RWH_rect.left + PADDING_X;
      } else {
        RTL_offset = 0;
      }

      // Calculate inputWordEl properties relative to inputWordsContainerEl
      inputWordEl.style.left =
        wordEl.offsetLeft + PADDING_OFFSET_X - RTL_offset + "px";
      inputWordEl.innerHTML = userInputString
        .replace(/\t/g, "_")
        .replace(/\n/g, "_")
        .replace(/</g, "&lt")
        .replace(/>/g, "&gt")
        .slice(0, wordEl.childElementCount);

      inputWordEl.className = "inputWord";
      inputWordsContainerEl.append(inputWordEl);
      inputWordEls.push(inputWordEl);
    }

    inputWordsContainerEls.push(inputWordsContainerEl);
    highlightEls.push(highlightEl);
    highlightEl.append(inputWordsContainerEl);
    highlightContainer.append(highlightEl);
    RWH_el.append(highlightContainer);
  });

  isInitialized = true;
  isInitInProgress = false;
  return true;
}

type HighlightPosition = {
  highlightLeft: number;
  highlightRight: number;
  inputContainerLeft: number;
  inputContainerRight: number;
};

function getHighlightElementPositions(
  firstWordIndex: number,
  lastWordIndex: number,
  isRTL = false
): HighlightPosition[] {
  const lineIndexOfFirstWord = wordIndexToLineIndexDict[
    firstWordIndex
  ] as number;
  const highlightPositions = new Array(lines.length).fill(null).map(() => ({
    highlightLeft: 0,
    highlightRight: 0,
    inputContainerLeft: 0,
    inputContainerRight: 0,
  })) as HighlightPosition[];

  const highlightWidth: number = getHighlightWidth(
    firstWordIndex,
    lastWordIndex
  );

  const firstWordEl = wordEls[firstWordIndex];
  const line = lines[lineIndexOfFirstWord];
  const linePos = highlightPositions[lineIndexOfFirstWord];
  const container = highlightContainerEls[lineIndexOfFirstWord];
  const inputContainer = inputWordsContainerEls[lineIndexOfFirstWord];

  if (
    firstWordEl === undefined ||
    line === undefined ||
    linePos === undefined ||
    container === undefined ||
    inputContainer === undefined
  ) {
    return highlightPositions;
  }

  // Get origin for line highlight starts at
  if (!isRTL) {
    linePos.highlightLeft = firstWordEl.offsetLeft;
    linePos.highlightRight =
      line.rect.width - (linePos.highlightLeft + highlightWidth) + PADDING_X;
  } else {
    const offsetLeftOfHighlightContainer = container.offsetLeft;

    linePos.highlightRight =
      line.rect.width -
      (firstWordEl.offsetLeft + firstWordEl.offsetWidth) +
      offsetLeftOfHighlightContainer +
      PADDING_OFFSET_X;

    linePos.highlightLeft =
      line.rect.width - (linePos.highlightRight + highlightWidth) + PADDING_X;
  }

  if (!isRTL) {
    linePos.inputContainerLeft = -1 * linePos.highlightLeft;
  } else {
    linePos.inputContainerLeft =
      -1 *
      (inputContainer.getBoundingClientRect().width -
        highlightWidth -
        linePos.highlightRight);
  }

  // Calculate offsets for lines above, going from zero to lineIndexOfWord
  for (let i = lineIndexOfFirstWord - 1; i >= 0; i--) {
    const position = highlightPositions[i];
    const nextPosition = highlightPositions[i + 1];
    const line = lines[i];
    const container = inputWordsContainerEls[i];
    if (
      position === undefined ||
      line === undefined ||
      nextPosition === undefined ||
      container === undefined
    )
      continue;

    if (!isRTL) {
      position.highlightLeft =
        nextPosition.highlightLeft + line.rect.width + PADDING_X;

      position.highlightRight =
        line.rect.width - (position.highlightLeft + highlightWidth) + PADDING_X;

      position.inputContainerLeft = -1 * position.highlightLeft;
    } else {
      position.highlightRight =
        nextPosition.highlightRight + line.rect.width + PADDING_X;

      position.highlightLeft =
        line.rect.width -
        (position.highlightRight + highlightWidth) +
        PADDING_X;

      position.inputContainerLeft =
        -1 *
        (container.getBoundingClientRect().width -
          highlightWidth -
          position.highlightRight);
    }
  }

  // Calculate offsets for lines below, going from lineIndexOfWord to lines.length
  for (let i = lineIndexOfFirstWord + 1; i < lines.length; i++) {
    const position = highlightPositions[i];
    const previousLine = lines[i - 1];
    const line = lines[i];
    const prevHighlightPosition = highlightPositions[i - 1];
    const container = inputWordsContainerEls[i];

    if (
      position === undefined ||
      previousLine === undefined ||
      line === undefined ||
      prevHighlightPosition === undefined ||
      container === undefined
    )
      continue;

    if (!isRTL) {
      position.highlightLeft =
        -1 *
        (previousLine.rect.width -
          prevHighlightPosition.highlightLeft +
          PADDING_X);

      position.highlightRight =
        line.rect.width - (position.highlightLeft + highlightWidth) + PADDING_X;

      position.inputContainerLeft = -1 * position.highlightLeft;
    } else {
      position.highlightRight =
        -1 *
        (previousLine.rect.width -
          prevHighlightPosition.highlightRight +
          PADDING_X);

      position.highlightLeft =
        line.rect.width -
        (position.highlightRight + highlightWidth) +
        PADDING_X;

      position.inputContainerLeft =
        -1 *
        (container.getBoundingClientRect().width -
          highlightWidth -
          position.highlightRight);
    }
  }

  return highlightPositions;
}

// Function to calculate the width of the highlight for a given range of words
function getHighlightWidth(
  wordStartIndex: number,
  wordEndIndex: number
): number {
  const lineIndexOfWordStart = wordIndexToLineIndexDict[wordStartIndex];
  const lineIndexOfWordEnd = wordIndexToLineIndexDict[wordEndIndex];

  if (lineIndexOfWordStart === undefined || lineIndexOfWordEnd === undefined) {
    return 0;
  }

  const startWord = wordEls[wordStartIndex];
  const endWord = wordEls[wordEndIndex];
  const inputEndWord = inputWordEls[wordEndIndex];
  const startLineLastWord =
    wordEls[lines[lineIndexOfWordStart]?.lastWordIndex ?? -1];
  const endLineFirstWord =
    wordEls[lines[lineIndexOfWordEnd]?.firstWordIndex ?? -1];

  if (
    startWord === undefined ||
    endWord === undefined ||
    inputEndWord === undefined ||
    startLineLastWord === undefined ||
    endLineFirstWord === undefined
  ) {
    return 0;
  }

  // If highlight is just one line...
  if (lineIndexOfWordStart == lineIndexOfWordEnd) {
    const highlightRect = Misc.getBoundingRectOfElements([startWord, endWord]);
    const lastWordElRect = endWord.getBoundingClientRect();

    const lastInputWordElRect = inputEndWord.getBoundingClientRect();
    let width = highlightRect.width + PADDING_X;
    width -= lastWordElRect.width - lastInputWordElRect.width;
    return width;
  }

  // Multiple lines
  const firstLineBounds = Misc.getBoundingRectOfElements([
    startWord,
    startLineLastWord,
  ]);

  const lastLineBounds = Misc.getBoundingRectOfElements([
    endLineFirstWord,
    endWord,
  ]);

  let width = firstLineBounds.width + lastLineBounds.width;

  // Add middle line highlights to width
  for (let i = lineIndexOfWordStart + 1; i < lineIndexOfWordEnd; i++) {
    width += (lines[i] as Line).rect.width;
  }

  // Account for padding
  width += 2 * PADDING_X * (lineIndexOfWordEnd - lineIndexOfWordStart);

  // Subtract difference between last wordEl and last inputWordEl
  const lastWordElRect = endWord.getBoundingClientRect();
  const lastInputWordElRect = inputEndWord.getBoundingClientRect();
  width -= lastWordElRect.width - lastInputWordElRect.width;
  return width;
}

export function updateToggleWordsHistoryTime(): void {
  lastToggleWordsHistoryTime = new Date();
}
