/**
 * This highlighting system makes use of absolutely positioned, overflow hidden divs
 * that are placed on top of the text to be highlighted. These divs are called
 * ".highlightContainer". The actual highlight element is called ".highlight"
 *
 * export function init(): ()=>void
 *      * initializes highlightContainers
 *      * if destroy() is called, must be called again
 *
 * export function highlight(firstWordIndex, lastWordIndex): (num, num) => void
 *      * given firstWordIndex <= lastWordIndex, highlights the words in the range
 *      * if called back to back, will animate towards second highlight
 *      * will be cleared by clear()
 *
 * export function clear(): ()=>void
 *     * clears all highlights, but keeps highlightContainers
 *
 *
 * export function destroy(): ()=>void
 *    * clears all highlights and removes highlightContainers
 *    * init() must be called in order to use highlight() again
 *
 *
 * line: {
 *      firstWordIndex: number,
 *      lastWordIndex: number,
 *      width: string,
 *
 * }
 *
 * function geLeftOffsets(wordIndex): number[] -- returns [left] offset for each line
 * function getHighlightWidth(startWordIndex, endWordIndex): number
 * function getContainerBounds(elements: JQuery[]): any
 *
 */

type Line = {
  firstWordIndex: number;
  lastWordIndex: number;
  width: number;
};

let lines: Line[] = [];
let wordEls: JQuery<HTMLElement>;
let wordIndexToLineIndexDict: { [wordIndex: number]: number } = {};
let highlightContainers: HTMLElement[] = [];
let highlightEls: HTMLElement[] = [];

export let isInitialized = false;

export function init() {
  // if exists, alert already initialized
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  // initialize lines array
  let prevLineEndWordIndex = -1;
  let containerBounds;
  let width;
  let currLineIndex = 0;
  wordEls = $("#resultWordsHistory .words .word");

  // construct lines array and wordIndexToLineIndexDict
  wordIndexToLineIndexDict[0] = 0;
  for (let i = 1; i < wordEls.length; i++) {
    let word = wordEls[i];
    let prevWord = wordEls[i - 1];

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

  // set top and left as % realtive to "#resultWordsHistory"
  const PADDING = 0;
  const PADDING_OFFSET = 0;
  let PARENT_CONTAINER = $("#resultWordsHistory");
  const RWH_top = PARENT_CONTAINER.offset().top;
  const RWH_left = PARENT_CONTAINER.offset().left | 0;
  const RWH_width = $("#resultWordsHistory").width();
  const RWH_height = $("#resultWordsHistory").height();

  // create highlightContainers
  lines.forEach((line) => {
    let highlightContainer = document.createElement("div");
    highlightContainer.classList.add("highlightContainer");
    highlightContainers.push(highlightContainer);

    // calculate top, left, width, height
    let HC_top =
      wordEls && wordEls[line.firstWordIndex].offsetTop - PADDING_OFFSET;
    let HC_left =
      wordEls && wordEls[line.firstWordIndex].offsetLeft - PADDING_OFFSET;
    let HC_width = line.width + PADDING;
    let HC_height =
      wordEls && wordEls[line.firstWordIndex].offsetHeight + PADDING;

    // calculate top, left as % relative to "#resultWordsHistory"
    let HC_top_percent = (HC_top / RWH_height) * 100 + "%";
    let HC_left_percent = (HC_left / RWH_width) * 100 + "%";
    let HC_width_percent = (HC_width / RWH_width) * 100 + "%";
    let HC_height_percent = (HC_height / RWH_height) * 100 + "%";

    highlightContainer.style.width = HC_width_percent;
    highlightContainer.style.top = HC_top_percent;
    highlightContainer.style.left = HC_left_percent;
    highlightContainer.style.height = HC_height_percent;

    $("#resultWordsHistory").append(highlightContainer);
  });
}

export function highlight(firstWordIndex: number, lastWordIndex: number) {
  if (!isInitialized) {
    throw Error("highlight controller not initialized");
  }
  // get all lines that are in range
  let highlightWidth = getHighlightWidth(firstWordIndex, lastWordIndex);
  let offsets = getOffsets(firstWordIndex);

  // for each line, set to new width and new
  if (highlightEls.length === 0) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      // create highlight elements, append to corresponding highlight container, add to highlightEls
      let highlightEl = document.createElement("div");
      highlightEl.classList.add("highlight");
      highlightEls.push(highlightEl);

      highlightContainers[lineIndex].append(highlightEl);
    }
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    // set width and left of highlight elements
    let highlightEl = highlightEls[lineIndex];
    highlightEl.style.width = highlightWidth + "px";
    highlightEl.style.left = offsets[lineIndex] + "px";
  }
}

function getHighlightWidth(wordStartIndex: number, wordEndIndex: number) {
  // get lineIndexOfWordStart and lineIndexOfWordEnd
  let lineIndexOfWordStart = wordIndexToLineIndexDict[wordStartIndex];
  let lineIndexOfWordEnd = wordIndexToLineIndexDict[wordEndIndex];

  // if wordStart and wordEnd are on the same line
  if (lineIndexOfWordStart == lineIndexOfWordEnd) {
    let bounds = getContainerBounds([
      wordEls[wordStartIndex],
      wordEls[wordEndIndex],
    ]);
    return bounds[1] - bounds[0];
  }

  // if wordStart and wordEnd are on different lines
  // add first line highlight to width
  let firstLineBounds = getContainerBounds([
    wordEls[wordStartIndex],
    wordEls[lines[lineIndexOfWordStart].lastWordIndex],
  ]);

  let lastLineBounds = getContainerBounds([
    wordEls[lines[lineIndexOfWordEnd].firstWordIndex],
    wordEls[wordEndIndex],
  ]);

  let width =
    firstLineBounds[1] -
    firstLineBounds[0] +
    lastLineBounds[1] -
    lastLineBounds[0];

  // add middle line highlights to width
  for (let i = lineIndexOfWordStart + 1; i < lineIndexOfWordEnd; i++) {
    width += lines[i].width;
  }

  return width;
}

function getOffsets(firstWordIndex: number): number[] {
  let lineIndexOfWord = wordIndexToLineIndexDict[firstWordIndex];
  let offsets = new Array(lineIndexOfWord + 1).fill(0);

  // calculate offset for this line
  offsets[lineIndexOfWord] = wordEls[firstWordIndex].offsetLeft;

  // calculate offsets for lines above, going from zero to lineIndexOfWord
  for (let i = lineIndexOfWord - 1; i >= 0; i--) {
    offsets[i] = offsets[i + 1] + lines[i].width;
  }

  // calculate offsets for lines below, going from lineIndexOfWord to lines.length
  if (lineIndexOfWord != lines.length - 1) {
    offsets[lineIndexOfWord + 1] =
      -1 * (lines[lineIndexOfWord].width - offsets[lineIndexOfWord]);
    for (let i = lineIndexOfWord + 2; i < lines.length; i++) {
      offsets[i] = offsets[i - 1] - lines[i - 1].width;
    }
  }

  return offsets;
}

export function clear() {
  $(".highlight").remove();
  highlightEls = [];
}

export function destroy() {
  if (!isInitialized) return;
  $(".highlightContainer").remove();
  highlightEls = [];
  highlightContainers = [];
  wordIndexToLineIndexDict = {};
  lines = [];
  isInitialized = false;
}

// given array elements, returns tightbound container [left, right, top, bottom]
function getContainerBounds(elements: HTMLElement[]): any {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  elements.forEach((element) => {
    let rect = element.getBoundingClientRect();

    // Adjust for scrolling
    let scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    let scrollTop = window.scrollY || document.documentElement.scrollTop;

    minX = Math.min(minX, rect.left + scrollLeft);
    minY = Math.min(minY, rect.top + scrollTop);
    maxX = Math.max(maxX, rect.right + scrollLeft);
    maxY = Math.max(maxY, rect.bottom + scrollTop);
  });

  return [minX, maxX, minY, maxY];
}
