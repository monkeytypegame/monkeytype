// The code defines the necessary operations for a text highlighting system in a web page.
// This system utilizes absolutely positioned, overflow hidden divs, known as "highlightContainer",
// to place a highlight (".highlight") on top of the text to be highlighted.
// Constants for padding around the highlights
const PADDING_X = 16;
const PADDING_Y = 14;
const PADDING_OFFSET_X = PADDING_X / 2;
const PADDING_OFFSET_Y = PADDING_Y / 2;

// Type definition for a Line object, which represents a line of text
type Line = {
  rect: DOMRect;
  firstWordIndex: number;
  lastWordIndex: number;
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

// Array of user inputs aligned with .word elements
let inputWords: HTMLElement[] = [];

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

export function setIsHoverChart(state: boolean): void {
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
  let lineRect;
  let currLineIndex = 0;
  wordEls = $("#resultWordsHistory .words .word");

  // Construct lines array and wordIndexToLineIndexDict
  wordIndexToLineIndexDict[0] = 0;
  for (let i = 1; i < wordEls.length; i++) {
    const word = wordEls[i];
    const prevWord = wordEls[i - 1];

    if (word.offsetTop != prevWord.offsetTop) {
      currLineIndex++;
      lineRect = getContainerBounds([
        wordEls[prevLineEndWordIndex + 1],
        wordEls[i - 1],
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
  lineRect = getContainerBounds([
    wordEls[prevLineEndWordIndex + 1],
    wordEls[wordEls.length - 1],
  ]);
  lines.push({
    firstWordIndex: prevLineEndWordIndex + 1,
    lastWordIndex: wordEls.length - 1,
    rect: lineRect,
  });

  // Set top and left as % realtive to "#resultWordsHistory"
  const RWH = $("#resultWordsHistory");
  const RWH_width = RWH.width()!;
  const RWH_height = RWH.height()!;
  const RWH_rect_top = RWH[0].getBoundingClientRect().top;
  const RWH_rect_left = RWH[0].getBoundingClientRect().left;

  // Create highlightContainers
  lines.forEach((line) => {
    const highlightContainer = document.createElement("div");
    highlightContainer.classList.add("highlightContainer");
    highlightContainers.push(highlightContainer);

    // Calculate highlightContainer properties
    const HC_rect_top = line.rect.top - PADDING_OFFSET_Y;
    const HC_rect_left = line.rect.left - PADDING_OFFSET_X;
    const HC_rel_top = HC_rect_top - RWH_rect_top;
    const HC_rel_left = HC_rect_left - RWH_rect_left;
    const HC_width = line.rect.width + PADDING_X;
    const HC_height = line.rect.height + PADDING_Y;

    // Calculate inputWordsContainer positions
    const IWC_rect_top = line.rect.top;
    const IWC_rect_left = line.rect.left;
    const IWC_rel_top = IWC_rect_top - HC_rect_top;
    const IWC_rel_left = IWC_rect_left - HC_rect_left;
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

    // Construct and inject highlightPlaceholder elements
    let highlightPlaceholderEl = document.createElement("div");
    let inputWordsContainerEl = document.createElement("div");

    highlightPlaceholderEl.className = "highlightPlaceholder";
    inputWordsContainerEl.className = "inputWordsContainer";

    // Calculate inputWordsContainerEl properties relative to highlightContainer
    inputWordsContainerEl.style.top = line.rect.top - HC_rect_top + "px";
    inputWordsContainerEl.style.left = line.rect.left - HC_rect_left + "px";
    inputWordsContainerEl.style.width = IWC_width + "px";
    inputWordsContainerEl.style.height = IWC_height + "px";

    for (let i = line.firstWordIndex; i <= line.lastWordIndex; i += 1) {
      const wordEl = wordEls[i];
      const userInputString = wordEl.getAttribute("input")!;

      if (!userInputString) {
        continue;
      }

      let inputWordEl = document.createElement("div");
      inputWordEl.className = "inputWord";

      // Calculate inputWordEl properties relative to inputWordsContainerEl
      const wordRect = wordEl.getBoundingClientRect();
      inputWordEl.style.top = wordRect.top - IWC_rect_top + "px";
      inputWordEl.style.left = wordRect.left - IWC_rect_left + "px";

      inputWordEl.style.left = wordEl.offsetLeft + PADDING_OFFSET_X + "px";
      inputWordEl.innerHTML = userInputString
        .replace(/\t/g, "_")
        .replace(/\n/g, "_")
        .replace(/</g, "&lt")
        .replace(/>/g, "&gt")
        .slice(0, wordEl.childElementCount);

      inputWordsContainerEl.append(inputWordEl);
      inputWords.push(inputWordEl);
    }

    highlightPlaceholderEl.append(inputWordsContainerEl);
    highlightContainer.append(highlightPlaceholderEl);
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
    const highlightRect = getContainerBounds([
      wordEls[wordStartIndex],
      wordEls[wordEndIndex],
    ]);
    return highlightRect.width + PADDING_X;
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

  let width = firstLineBounds.width + lastLineBounds.width;

  // Add middle line highlights to width
  for (let i = lineIndexOfWordStart + 1; i < lineIndexOfWordEnd; i++) {
    width += lines[i].rect.width;
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
    offsets[i] = offsets[i + 1] + lines[i].rect.width + PADDING_X;
  }

  // calculate offsets for lines below, going from lineIndexOfWord to lines.length
  if (lineIndexOfWord != lines.length - 1) {
    offsets[lineIndexOfWord + 1] =
      -1 *
      (lines[lineIndexOfWord].rect.width -
        offsets[lineIndexOfWord] +
        PADDING_X);
    for (let i = lineIndexOfWord + 2; i < lines.length; i++) {
      offsets[i] = offsets[i - 1] - lines[i - 1].rect.width + PADDING_X;
    }
  }

  return offsets;
}

// Function to get the bounding rectangle of a collection of elements
function getContainerBounds(elements: HTMLElement[]): DOMRect {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();

    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.right);
    maxY = Math.max(maxY, rect.bottom);
  });

  // Create a new object with the same properties as a DOMRect
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    top: minY,
    right: maxX,
    bottom: maxY,
    left: minX,
    toJSON: function () {
      return JSON.stringify({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        top: this.top,
        right: this.right,
        bottom: this.bottom,
        left: this.left,
      });
    },
  };
}
