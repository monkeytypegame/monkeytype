// The code defines the necessary operations for a text highlighting system in a web page.
// This system utilizes absolutely positioned, overflow hidden divs, known as "highlightContainer",
// to place a highlight (".highlight") on top of the text to be highlighted.

// Constants for padding around the highlights
const PADDING_X = 18;
const PADDING_Y = 14;
const PADDING_OFFSET_X = PADDING_X / 2;
const PADDING_OFFSET_Y = PADDING_Y / 2 + 0.5;

// Type definition for a Line object, which represents a line of text
type Line = {
  firstWordIndex: number;
  lastWordIndex: number;
  width: number;
};

// Array of Line objects
let lines: Line[] = [];

// JQuery collection of all word elements
let wordEls: JQuery<HTMLElement>;

// Dictionary mapping word indices to line indices
let wordIndexToLineIndexDict: { [wordIndex: number]: number } = {};

// Array of container elements for highlights
let highlightContainers: HTMLElement[] = [];

// Array of highlight elements
let highlightEls: HTMLElement[] = [];

// Flags
let isInitialized = false;
let isHoveringChart = false;

export function highlightWords(
  firstWordIndex: number,
  lastWordIndex: number
): boolean {
  if (!isHoveringChart) {
    return false;
  }
  if (!isInitialized) {
    const initResponse = init();
    if (!initResponse) {
      return false;
    }
  }

  const highlightWidth = getHighlightWidth(firstWordIndex, lastWordIndex);
  const offsets = getOffsets(firstWordIndex);

  if (highlightEls.length === 0) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const highlightEl: HTMLElement = document.querySelector(
        ".highlightPlaceholder"
      )!;
      highlightEl.classList.remove("highlightPlaceholder");
      highlightEl.classList.add("highlight");
      highlightEls.push(highlightEl);
    }
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const highlightEl: HTMLElement = highlightEls[lineIndex];
    const highlightWidthStr = highlightWidth + "px";
    const highlightLeftStr = offsets[lineIndex] + "px";

    if (highlightEl.children.length) {
      const inputWordsContainer: HTMLElement = highlightEl
        .children[0] as HTMLElement;
      inputWordsContainer.style.left = -1 * offsets[lineIndex] + "px";
    }
    highlightEl.style.left = highlightLeftStr;
    highlightEl.style.width = highlightWidthStr;
  }

  return true;
}

export function setIsHoverChart(state: boolean) {
  isHoveringChart = state;
}
// Function to clear all highlights
export function clear(): void {
  $(".highlight").addClass("highlightPlaceholder");
  $(".highlightPlaceholder").removeClass("highlight");
  highlightEls = [];
}

// Function to completely destroy the highlight system.
export function destroy(): void {
  if (!isInitialized) return;
  $(".highlightContainer").remove();
  highlightEls = [];
  highlightContainers = [];
  wordIndexToLineIndexDict = {};
  lines = [];
  isInitialized = false;
}

// Function to initialize the highlight system
function init(): boolean {
  if (isInitialized) {
    throw Error("highlight containers already initialized");
  }

  if ($("#resultWordsHistory .words .word").length === 0) {
    return false;
  }

  let prevLineEndWordIndex = -1;
  let containerBounds;
  let width;
  let currLineIndex = 0;
  wordEls = $("#resultWordsHistory .words .word");

  // Construct lines array and wordIndexToLineIndexDict
  wordIndexToLineIndexDict[0] = 0;
  for (let i = 1; i < wordEls.length; i++) {
    const word = wordEls[i];
    const prevWord = wordEls[i - 1];

    if (word.offsetTop != prevWord.offsetTop) {
      currLineIndex++;
      containerBounds = getContainerBounds([
        wordEls[prevLineEndWordIndex + 1],
        wordEls[i - 1],
      ]);
      width = containerBounds[1] - containerBounds[0];
      lines.push({
        firstWordIndex: prevLineEndWordIndex + 1,
        lastWordIndex: i - 1,
        width: width,
      });
      prevLineEndWordIndex = i - 1;
    }
    wordIndexToLineIndexDict[i] = currLineIndex;
  }

  containerBounds = getContainerBounds([
    wordEls[prevLineEndWordIndex + 1],
    wordEls[wordEls.length - 1],
  ]);
  width = containerBounds[1] - containerBounds[0];
  lines.push({
    firstWordIndex: prevLineEndWordIndex + 1,
    lastWordIndex: wordEls.length - 1,
    width: width,
  });

  // Set top and left as % realtive to "#resultWordsHistory"
  const RWH_width = $("#resultWordsHistory").width()!;
  const RWH_height = $("#resultWordsHistory").height()!;

  // Create highlightContainers
  lines.forEach((line) => {
    const highlightContainer = document.createElement("div");
    highlightContainer.classList.add("highlightContainer");
    highlightContainers.push(highlightContainer);

    // Calculate top, left, width, height
    const HC_top =
      wordEls && wordEls[line.firstWordIndex].offsetTop - PADDING_OFFSET_Y;
    const HC_left =
      wordEls && wordEls[line.firstWordIndex].offsetLeft - PADDING_OFFSET_X;
    const HC_width = line.width + PADDING_X;
    const HC_height =
      wordEls && wordEls[line.firstWordIndex].offsetHeight + PADDING_Y;

    // Calculate top, left as % relative to "#resultWordsHistory"
    const HC_top_percent = (HC_top / RWH_height) * 100 + "%";
    const HC_left_percent = (HC_left / RWH_width) * 100 + "%";
    const HC_width_percent = (HC_width / RWH_width) * 100 + "%";
    const HC_height_percent = (HC_height / RWH_height) * 100 + "%";

    highlightContainer.style.width = HC_width_percent;
    highlightContainer.style.top = HC_top_percent;
    highlightContainer.style.left = HC_left_percent;
    highlightContainer.style.height = HC_height_percent;

    // Construct highlightPlaceholder w/ inputWord elements
    let highlightPlaceholderEl = `<div class="highlightPlaceholder"> <div class="inputWordsContainer" style="top:${PADDING_OFFSET_Y}px;">`;
    for (let i = line.firstWordIndex; i <= line.lastWordIndex; i += 1) {
      const wordEl = wordEls[i];
      const userInputString = wordEl.getAttribute("input")!;

      if (!userInputString) {
        continue;
      }

      highlightPlaceholderEl += `<div class="inputWord" style="left:${
        wordEl.offsetLeft + PADDING_OFFSET_X
      }px;">${userInputString
        .replace(/\t/g, "_")
        .replace(/\n/g, "_")
        .replace(/</g, "&lt")
        .replace(/>/g, "&gt")
        .slice(0, wordEl.childElementCount)} </div>`;
    }

    highlightPlaceholderEl += "</div></div>";
    highlightContainer.innerHTML = highlightPlaceholderEl;

    $("#resultWordsHistory").append(highlightContainer);
  });

  isInitialized = true;
  return true;
}

// Function to calculate the width of the highlight for a given range of words
function getHighlightWidth(
  wordStartIndex: number,
  wordEndIndex: number
): number {
  const lineIndexOfWordStart = wordIndexToLineIndexDict[wordStartIndex];
  const lineIndexOfWordEnd = wordIndexToLineIndexDict[wordEndIndex];

  // If highlight is just one line...
  if (lineIndexOfWordStart == lineIndexOfWordEnd) {
    const bounds = getContainerBounds([
      wordEls[wordStartIndex],
      wordEls[wordEndIndex],
    ]);
    return bounds[1] - bounds[0] + PADDING_X;
  }

  // Multiple lines
  const firstLineBounds = getContainerBounds([
    wordEls[wordStartIndex],
    wordEls[lines[lineIndexOfWordStart].lastWordIndex],
  ]);

  const lastLineBounds = getContainerBounds([
    wordEls[lines[lineIndexOfWordEnd].firstWordIndex],
    wordEls[wordEndIndex],
  ]);

  let width =
    firstLineBounds[1] -
    firstLineBounds[0] +
    lastLineBounds[1] -
    lastLineBounds[0];

  // Add middle line highlights to width
  for (let i = lineIndexOfWordStart + 1; i < lineIndexOfWordEnd; i++) {
    width += lines[i].width;
  }

  // Account for padding
  width += 2 * PADDING_X * (lineIndexOfWordEnd - lineIndexOfWordStart);

  return width;
}

// Function to calculate the left offsets for a given word index
function getOffsets(firstWordIndex: number): number[] {
  const lineIndexOfWord = wordIndexToLineIndexDict[firstWordIndex];
  const offsets = new Array(lineIndexOfWord + 1).fill(0);

  // calculate offset for this line
  offsets[lineIndexOfWord] = wordEls[firstWordIndex].offsetLeft;

  // calculate offsets for lines above, going from zero to lineIndexOfWord
  for (let i = lineIndexOfWord - 1; i >= 0; i--) {
    offsets[i] = offsets[i + 1] + lines[i].width + PADDING_X;
  }

  // calculate offsets for lines below, going from lineIndexOfWord to lines.length
  if (lineIndexOfWord != lines.length - 1) {
    offsets[lineIndexOfWord + 1] =
      -1 *
      (lines[lineIndexOfWord].width - offsets[lineIndexOfWord] + PADDING_X);
    for (let i = lineIndexOfWord + 2; i < lines.length; i++) {
      offsets[i] = offsets[i - 1] - lines[i - 1].width + PADDING_X;
    }
  }

  return offsets;
}

// Function to get the bounding rectangle of a collection of elements
function getContainerBounds(elements: HTMLElement[]): number[] {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();

    // Adjust for scrolling
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    minX = Math.min(minX, rect.left + scrollLeft);
    minY = Math.min(minY, rect.top + scrollTop);
    maxX = Math.max(maxX, rect.right + scrollLeft);
    maxY = Math.max(maxY, rect.bottom + scrollTop);
  });

  return [minX, maxX, minY, maxY];
}
