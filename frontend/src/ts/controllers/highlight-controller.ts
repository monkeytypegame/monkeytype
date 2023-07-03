/**
 * This highlighting system makes use of absolutely positioned, overflow hidden divs
 * that are placed on top of the text to be highlighted. These divs are called
 * ".highlight-containers". The actual highlight element is called ".highlight"
 *
 * export function init(): ()=>void
 *      * initializes highlight-containers
 *      * if destroy() is called, must be called again
 *
 * export function highlight(firstWordIndex, lastWordIndex): (num, num) => void
 *      * given firstWordIndex <= lastWordIndex, highlights the words in the range
 *      * if called back to back, will animate towards second highlight
 *      * will be cleared by clear()
 *
 * export function clear(): ()=>void
 *     * clears all highlights, but keeps highlight-containers
 *
 *
 * export function destroy(): ()=>void
 *    * clears all highlights and removes highlight-containers
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
 * function getOffset(lineNumber, wordIndex): number
 * function getWidth(startWordIndex, endWordIndex): number
 *
 */

let lines = [];
let words;

export function init() {
  // if exists, alert already initialized
  if ($(".highlight-container").length > 0) {
    alert("highlighting already initialized");
    return;
  }

  // initialize lines array
  let currLineIndex = 0;
  let prevLineEndWordIndex = -1;
  words = $("#resultWordsHistory .words .word");
  for (let i = 1; i < words.length; i++) {
    let word = words[i];
    let prevWord = words[i - 1];

    if (word.offsetTop != prevWord.offsetTop) {
      lines.push({
        firstWordIndex: prevLineEndWordIndex + 1,
        lastWordIndex: i - 1,
        width: word.offsetLeft - prevWord.offsetLeft + prevWord.offsetWidth,
      });
      prevLineEndWordIndex = i - 1;
    }
  }
}
