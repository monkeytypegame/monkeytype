import type { JSAnimation } from "animejs";

import { Config } from "../../../config/store";
import {
  getActiveWordIndex,
  isDirectionReversed,
  isLanguageRightToLeft,
  isSlowTimer,
  isTestFinished,
  setOutOfFocusMaxHeight,
  setWordsWrapperHidden,
  wordsHaveNewline,
} from "../../../states/test";
import {
  getLineBreakElements,
  getWordElement as getRenderedWordElement,
} from "../../../states/word-elements";
import {
  firstMountedIndex,
  getPendingWordInput,
  invalidateTypoHintsLayout,
  isWordRendered,
  setFirstRenderedLine,
  setFirstRenderedWordIndex,
  wordsRenderState,
} from "../../../states/words-render";
import * as Joining from "../../../test/break-joining";
import * as Caret from "../../../test/caret";
import * as CustomText from "../../../test/custom-text";
import { getCurrentInput } from "../../../test/events/data";
import * as PaceCaret from "../../../test/pace-caret";
import { ElementWithUtils } from "../../../utils/dom";
import * as Misc from "../../../utils/misc";
import * as Strings from "../../../utils/strings";

export type WordChange = "forward" | "back" | "initial";

/** A rendered word or line break, in #words' order. */
type LayoutItem =
  | { kind: "word"; index: number; el: ElementWithUtils }
  | {
      kind: "lineBreak";
      /** of the word ending the line */
      index: number;
      before: ElementWithUtils;
      after: ElementWithUtils;
    };

type LineBreakItem = Extract<LayoutItem, { kind: "lineBreak" }>;

function isLineBreak(item: LayoutItem): item is LineBreakItem {
  return item.kind === "lineBreak";
}

/**
 * Layout of the test words (#words): line jump, tape scroll, the words
 * wrapper's height. Created by the Words component, driven by test-ui through
 * intents. Each intent is a future effect inside Words.
 */
export type WordsLayout = {
  /** A words flush landed: lays out the word change and the updated words. */
  layout(change: {
    wordChange?: WordChange;
    updatedWords: number[];
    /** restart flush: the caret snaps to the new words */
    snapCaret: boolean;
  }): void;
  /** New words or a config change: lays everything out from scratch. */
  relayout(): void;
  /** The window was resized. */
  resized(): void;
  fontChanged(): void;
  typedEffectChanged(): void;
  /** The words are replaced: drops async layout started for the old ones. */
  reset(): void;
  /**
   * Whether appending `data` to the active word would push it onto the next
   * line or wrap its letters. Expensive - causes layout reflows.
   */
  wouldActiveWordOverflow(inputValue: string, data: string): boolean;
};

export function createWordsLayout(options: {
  words: () => HTMLElement | undefined;
  wordsWrapper: () => HTMLElement | undefined;
  /** the active word got its final position (after line jump/tape scroll) */
  onActiveWordLaidOut: () => void;
}): WordsLayout {
  function wordsEl(): ElementWithUtils {
    const el = options.words();
    if (el === undefined) throw new Error("#words not mounted");
    return new ElementWithUtils(el);
  }

  function wordsWrapperEl(): ElementWithUtils {
    const el = options.wordsWrapper();
    if (el === undefined) throw new Error("#wordsWrapper not mounted");
    return new ElementWithUtils(el);
  }

  let activeWordTop = 0;
  let activeWordHeight = 0;
  let wordTopBeforeLineJump = 0;
  let lineTransition = false;

  let currentTestLine = 0;
  let currentLinesJumping = 0;

  // bumped when the words are reset: async layout (line jump animation, tape
  // scroll) started for the previous words must not touch the new ones
  let layoutGeneration = 0;
  let lineJumpAnimation: JSAnimation | undefined;

  let laidOutActiveWordIndex: number | undefined;
  let centeringActiveLine: Promise<void> = Promise.resolve();

  function invalidateAsyncLayout(): void {
    layoutGeneration++;
    lineJumpAnimation?.cancel();
    lineJumpAnimation = undefined;
    currentLinesJumping = 0;
    lineTransition = false;
  }

  function isTestRightToLeft(): boolean {
    return isDirectionReversed()
      ? !isLanguageRightToLeft()
      : isLanguageRightToLeft();
  }

  function getWordElement(index: number): ElementWithUtils | null {
    const el = getRenderedWordElement(index);
    return el === undefined ? null : new ElementWithUtils(el);
  }

  function getActiveWordElement(): ElementWithUtils | null {
    return getWordElement(getActiveWordIndex());
  }

  /**
   * The rendered words and line breaks in #words' order, as of the last
   * flush. Words hidden by tape scroll keep only their line break.
   */
  function getLayoutItems(): LayoutItem[] {
    const items: LayoutItem[] = [];
    const renderedWords = wordsRenderState.words;
    for (let i = firstMountedIndex(); i < renderedWords.length; i++) {
      if (isWordRendered(i)) {
        const el = getWordElement(i);
        if (el !== null) items.push({ kind: "word", index: i, el });
      }
      if (renderedWords[i]?.endsLine !== true) continue;
      const lineBreak = getLineBreakElements(i);
      if (lineBreak === undefined) continue;
      items.push({
        kind: "lineBreak",
        index: i,
        before: new ElementWithUtils(lineBreak.before),
        after: new ElementWithUtils(lineBreak.after),
      });
    }
    return items;
  }

  function getActiveItemIndex(items: LayoutItem[]): number {
    const activeWordIndex = getActiveWordIndex();
    return items.findIndex(
      (item) => item.kind === "word" && item.index === activeWordIndex,
    );
  }

  function isTimedTest(): boolean {
    return (
      Config.mode === "time" ||
      (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
      (Config.mode === "custom" && CustomText.getLimitValue() === 0)
    );
  }

  /**
   * Top of the closest line above word `wordIndex`, undefined if it's on the
   * first rendered line.
   */
  function getLineAboveTop(
    wordIndex: number,
    wordTop: number,
  ): number | undefined {
    for (
      let i = wordIndex - 1;
      i >= wordsRenderState.firstRenderedWordIndex;
      i--
    ) {
      const top = getRenderedWordElement(i)?.offsetTop;
      if (top !== undefined && top < wordTop) return top;
    }
    return undefined;
  }

  async function layoutActiveWord(wordChange: WordChange): Promise<void> {
    const generation = layoutGeneration;
    const newActiveWordIndex = getActiveWordIndex();
    let previousActiveWordTop: number | null = null;
    if (wordChange !== "initial" && laidOutActiveWordIndex !== undefined) {
      // in zen mode, going back removes the previous word, so check for null
      previousActiveWordTop =
        getWordElement(laidOutActiveWordIndex)?.getOffsetTop() ?? null;
      // several word changes can land in one frame: every word passed is
      // typed, every word gone back over is not
      for (let i = laidOutActiveWordIndex; i < newActiveWordIndex; i++) {
        const passedWord = getWordElement(i);
        if (passedWord !== null) Joining.set(passedWord, true);
      }
      for (let i = newActiveWordIndex + 1; i < laidOutActiveWordIndex; i++) {
        const untypedWord = getWordElement(i);
        if (untypedWord !== null) Joining.set(untypedWord, false);
      }
    }

    const newActiveWord = getActiveWordElement();
    laidOutActiveWordIndex = newActiveWordIndex;
    if (newActiveWord === null) return;

    Joining.set(newActiveWord, false);

    activeWordTop = newActiveWord.getOffsetTop();
    activeWordHeight = newActiveWord.getOffsetHeight();

    if (previousActiveWordTop !== null) {
      if (isTimedTest() || !Config.showAllLines) {
        const newActiveWordTop = newActiveWord.getOffsetTop();
        if (newActiveWordTop > previousActiveWordTop) {
          // several word changes in one frame can cross more than one line:
          // jump to the line right above the active word, hiding all lines
          // before it
          const lineAboveTop = getLineAboveTop(
            newActiveWordIndex,
            newActiveWordTop,
          );
          const crossedLines =
            lineAboveTop !== undefined && lineAboveTop > previousActiveWordTop;
          await lineJump(
            crossedLines ? lineAboveTop : previousActiveWordTop,
            crossedLines,
          );
          if (generation !== layoutGeneration) return;
        }
      }
    }

    if (wordChange !== "initial" && Config.tapeMode !== "off") {
      await scrollTape();
    }

    options.onActiveWordLaidOut();
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

  async function centerActiveLine(): Promise<void> {
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
    if (isTestFinished()) return;
    if (!force && Config.mode !== "custom") return;
    const activeWordEl = getActiveWordElement();
    if (!activeWordEl) return;

    setWordsWrapperHidden(false);

    const wordComputedStyle = window.getComputedStyle(activeWordEl.native);
    const wordMargin =
      parseInt(wordComputedStyle.marginTop) +
      parseInt(wordComputedStyle.marginBottom);
    const wordHeight = activeWordEl.getOffsetHeight() + wordMargin;

    const showAllLines = Config.showAllLines && !isTimedTest();

    if (showAllLines) {
      //allow the wrapper to grow and shink with the words
      wordsWrapperEl().setStyle({ height: "" });
    } else if (Config.mode === "zen") {
      //zen mode, showAllLines off
      wordsWrapperEl().setStyle({ height: `${wordHeight * 2}px` });
    } else {
      if (Config.tapeMode === "off") {
        //tape off, showAllLines off, non-zen mode
        let lines = 0;
        let lastTop = 0;
        let wordIndex = wordsRenderState.firstRenderedWordIndex;
        let wrapperHeight = 0;

        while (lines < 3) {
          const word = getWordElement(wordIndex);
          if (word === null) break;
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
      wordsEl().setStyle({ marginLeft: "0", marginTop: "0" });
      for (const lineBreak of getLayoutItems().filter(isLineBreak)) {
        lineBreak.after.setStyle({ marginLeft: "0" });
      }
    }
  }

  // this is needed in tape mode because sometimes we want the newline character to appear above the next line
  // and sometimes we want it to be shifted to the left
  // (for example if the newline is typed incorrectly, or there are any extra letters after it)
  function getNlCharWidth(
    lastWordInLine: { index: number; el: ElementWithUtils } | undefined,
  ): number {
    // no word: its line's words are removed
    if (lastWordInLine === undefined) return 0;
    const word = wordsRenderState.words[lastWordInLine.index];
    if (word === undefined) return 0;
    // the line break's own letter, not a typed newline (extra or typo) after it
    const chars = Strings.splitIntoCharacters(
      wordsRenderState.rendersLettersFromInput ? word.input : word.text,
    );
    if (chars[chars.length - 1] !== "\n") return 0;
    const nlChar = lastWordInLine.el.qsa("letter")[chars.length - 1];
    if (nlChar === undefined || nlChar.hasClass("incorrect")) return 0;
    const letterComputedStyle = window.getComputedStyle(nlChar.native);
    const letterMargin =
      parseFloat(letterComputedStyle.marginLeft) +
      parseFloat(letterComputedStyle.marginRight);
    return nlChar.getOffsetWidth() + letterMargin;
  }

  async function scrollTape(noAnimation = false): Promise<void> {
    if (isTestFinished()) return;

    const generation = layoutGeneration;
    await centeringActiveLine;
    if (generation !== layoutGeneration) return;

    const isRtl = isTestRightToLeft();

    const wordsWrapperWidth = wordsWrapperEl().getOffsetWidth();
    const items = getLayoutItems();
    // index of the active word in items
    const activeItemIndex = getActiveItemIndex(items);
    const activeItem = items[activeItemIndex];
    if (activeItem?.kind !== "word") return;
    const activeWordEl = activeItem.el;
    const lineBreaks = items.filter(isLineBreak);

    let wordsWidthBeforeActive = 0;
    let fullLineWidths = 0;
    let widthRemoved = 0;
    // removed width per line, the first line of #words first
    const lineWidthRemoved: number[] = [0];
    const afterNewlinesNewMargins: number[] = [];
    // overflown words are only removed from the start. Their line breaks stay
    // rendered until line jump removes their line
    let removing = true;
    let lastWordToRemove: number | undefined;

    /* get last item to loop over */
    let lastItemIndex: number;
    // this will between 0 and 2
    const newLinesBeforeActiveWord = items
      .slice(0, activeItemIndex)
      .filter(isLineBreak).length;
    // the second line break after active word is visible during line jump
    let lastVisibleLineBreak = lineBreaks[newLinesBeforeActiveWord + 1];
    if (lastVisibleLineBreak) {
      lastItemIndex = items.indexOf(lastVisibleLineBreak);
    } else {
      lastVisibleLineBreak = lineBreaks[newLinesBeforeActiveWord];
      if (lastVisibleLineBreak) {
        lastItemIndex = items.indexOf(lastVisibleLineBreak);
      } else {
        lastItemIndex = activeItemIndex - 1;
      }
    }

    const wordRightMargin = parseFloat(
      window.getComputedStyle(activeWordEl.native).marginRight,
    );

    /*calculate .afterNewline & #words new margins + determine elements to remove*/
    for (let i = 0; i <= lastItemIndex; i++) {
      const item = items[i] as LayoutItem;
      if (item.kind === "word") {
        const child = item.el;
        const wordOuterWidth = child.getOuterWidth();
        const wordLeft = Math.floor(child.getOffsetLeft());
        const wordWidth = Math.floor(child.getOffsetWidth());
        removing &&=
          (!isRtl && wordLeft < 0 - wordWidth) ||
          (isRtl && wordLeft > wordsWrapperWidth);
        if (removing) {
          lastWordToRemove = item.index;
          widthRemoved += wordOuterWidth;
          const line = lineWidthRemoved.length - 1;
          lineWidthRemoved[line] =
            (lineWidthRemoved[line] ?? 0) + wordOuterWidth;
        } else {
          fullLineWidths += wordOuterWidth;
          if (i < activeItemIndex) wordsWidthBeforeActive = fullLineWidths;
        }
      } else {
        // a line of removed words has no newline glyph (getNlCharWidth: 0).
        // Its offset carries to every later line and #words' margin, so the
        // lines stay in place relative to each other
        const lineEnd = items[i - 1];
        const nlCharWidth = getNlCharWidth(
          lineEnd?.kind === "word" ? lineEnd : undefined,
        );
        fullLineWidths -= nlCharWidth + wordRightMargin;
        if (i < activeItemIndex) wordsWidthBeforeActive = fullLineWidths;

        /** words that are wider than limit can cause a barely visible bottom line shifting,
         * increase limit if that ever happens, but keep the limit because browsers hate
         * ridiculously wide margins which may cause the words to not be displayed
         */
        const limit = 3 * wordsEl().getOffsetWidth();
        lineWidthRemoved.push(0);
        if (fullLineWidths < limit) {
          afterNewlinesNewMargins.push(fullLineWidths);
        } else {
          afterNewlinesNewMargins.push(limit);
          if (i < lastItemIndex) {
            // for the second line break after active word
            afterNewlinesNewMargins.push(limit);
            lineWidthRemoved.push(0);
          }
          break;
        }
      }
    }

    /* remove overflown elements */
    if (lastWordToRemove !== undefined) {
      setFirstRenderedWordIndex(lastWordToRemove + 1);
      // keep every line in place: the first line starts at #words' margin, the
      // others at #words' margin plus their .afterNewline's margin
      const firstLineWidthRemoved = lineWidthRemoved[0] ?? 0;
      for (let i = 0; i < lineWidthRemoved.length - 1; i++) {
        const afterNewlineEl = lineBreaks[i]?.after;
        if (afterNewlineEl === undefined) break;
        const currentLineIndent =
          parseFloat(afterNewlineEl.getStyle().marginLeft) || 0;
        const lineIndentChange =
          (lineWidthRemoved[i + 1] ?? 0) - firstLineWidthRemoved;
        afterNewlineEl.setStyle({
          marginLeft: `${currentLineIndent + lineIndentChange}px`,
        });
      }
      const wordsMarginChange = isRtl
        ? -firstLineWidthRemoved
        : firstLineWidthRemoved;
      if (isRtl) widthRemoved *= -1;
      const currentWordsMargin =
        parseFloat(wordsEl().native.style.marginLeft) || 0;
      wordsEl().setStyle({
        marginLeft: `${currentWordsMargin + wordsMarginChange}px`,
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
    if (isRtl) {
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
        lineBreaks[i]?.after.animate({
          marginLeft: newMargin,
          duration,
          ease,
        });
      }
    } else {
      wordsEl().setStyle({ marginLeft: `${newMargin}px` });
      for (let i = 0; i < afterNewlinesNewMargins.length; i++) {
        const newMargin = afterNewlinesNewMargins[i] ?? 0;
        lineBreaks[i]?.after.setStyle({ marginLeft: `${newMargin}px` });
      }
    }
  }

  /**
   * Stops rendering the lines up to the word or line break of
   * `lastRemovedIndex`: everything before the first word after it.
   */
  function removeLines(lastRemovedIndex: number): void {
    const items = getLayoutItems();
    // the removed lines may hold only line breaks (tape removed their words)
    const firstKeptItemIndex = items.findIndex(
      (item) => item.kind === "word" && item.index > lastRemovedIndex,
    );
    const firstKeptWord = items[firstKeptItemIndex];
    if (firstKeptWord === undefined) return;

    // tape mode indents the line after a newline with its `.afterNewline`
    const beforeFirstKept = items[firstKeptItemIndex - 1];
    const indent =
      beforeFirstKept?.kind === "lineBreak"
        ? parseFloat(beforeFirstKept.after.getStyle().marginLeft) || 0
        : 0;

    setFirstRenderedLine(firstKeptWord.index);

    if (indent === 0) return;
    // the indent is gone: shift #words by it instead, keeping the lines in place
    for (const lineBreak of getLayoutItems().filter(isLineBreak)) {
      const currentLineIndent =
        parseFloat(lineBreak.after.getStyle().marginLeft) || 0;
      lineBreak.after.setStyle({
        marginLeft: `${currentLineIndent - indent}px`,
      });
    }
    const widthRemoved = isTestRightToLeft() ? -indent : indent;
    const currentWordsMargin =
      parseFloat(wordsEl().native.style.marginLeft) || 0;
    wordsEl().setStyle({
      marginLeft: `${currentWordsMargin + widthRemoved}px`,
    });
    Caret.caret?.handleTapeWordsRemoved(widthRemoved);
    PaceCaret.caret?.handleTapeWordsRemoved(widthRemoved);
  }

  async function lineJump(currentTop: number, force = false): Promise<void> {
    //last word of the line
    if (currentTestLine > 0 || force) {
      const hideBound = currentTop;

      const activeWordEl = getActiveWordElement();
      if (!activeWordEl) return;

      const items = getLayoutItems();

      // the word or line break (word index) closest before the active word
      // that is above the bound
      let lastRemovedIndex: number | undefined = undefined;
      for (let i = getActiveItemIndex(items) - 1; i >= 0; i--) {
        const item = items[i] as LayoutItem;
        // a line break is measured at .beforeNewline, it's the most reliable
        const el = item.kind === "word" ? item.el : item.before;
        if (Math.floor(el.getOffsetTop()) < hideBound) {
          lastRemovedIndex = item.index;
          break;
        }
      }

      if (lastRemovedIndex === undefined) {
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
        const generation = layoutGeneration;
        await new Promise<void>((resolve) => {
          lineJumpAnimation = wordsEl().animate({
            marginTop: newMarginTop,
            duration,
            onComplete: () => resolve(),
          });
        });
        // words were reset meanwhile, everything measured above is stale
        if (generation !== layoutGeneration) return;
        lineJumpAnimation = undefined;
        currentLinesJumping = 0;
        activeWordTop = activeWordEl.getOffsetTop();
        activeWordHeight = activeWordEl.getOffsetHeight();
        removeLines(lastRemovedIndex);
        wordsEl().setStyle({ marginTop: "0" });
        lineTransition = false;
      } else {
        currentLinesJumping = 0;
        removeLines(lastRemovedIndex);
      }
    }
    currentTestLine++;
    updateWordsWrapperHeight();
    return;
  }

  function getTopAndHeightWithDifferentData(
    activeWord: ElementWithUtils,
    data: string,
  ): {
    top: number;
    height: number;
  } {
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

  return {
    layout({ wordChange, updatedWords, snapCaret }) {
      if (wordChange !== undefined) {
        void layoutActiveWord(wordChange);
      } else if (updatedWords.length > 0 && Config.tapeMode !== "off") {
        void scrollTape();
      }
      for (const wordIndex of updatedWords) {
        void lineJumpIfWrapped(wordIndex);
      }
      Caret.updatePosition(snapCaret);
    },

    relayout() {
      updateWordsWrapperHeight(true);
      if (!Config.showAllLines) {
        void centerActiveLine();
      }
      updateWordsMargin();
      invalidateTypoHintsLayout();
      Caret.updatePosition(true);
    },

    resized() {
      if (Config.tapeMode !== "off") {
        void scrollTape();
      } else {
        void centerActiveLine();
        invalidateTypoHintsLayout();
      }
    },

    fontChanged() {
      Joining.update("fontSize", wordsEl());
      // letter widths changed once the new font is applied (next frame) and
      // loaded (async)
      const generation = layoutGeneration;
      requestAnimationFrame(() => {
        void document.fonts.ready.then(() => {
          // words reset (restart, unmount) or the test ended meanwhile
          if (generation !== layoutGeneration || isTestFinished()) return;
          Caret.updatePosition(true);
        });
      });
    },

    typedEffectChanged() {
      Joining.update("typedEffect", wordsEl());
    },

    reset() {
      invalidateAsyncLayout();
      wordsEl().setStyle({ marginTop: "0" });
      currentTestLine = 0;
      laidOutActiveWordIndex = undefined;
    },

    wouldActiveWordOverflow(inputValue, data) {
      const activeWordIndex = getActiveWordIndex();
      const activeWord = getActiveWordElement();
      // Active word not rendered yet (word change and append in the same
      // frame). Rendering here would put a reactive render on the input path,
      // so assume the worst: this guard only runs for extra letters, blocking
      // one is cheap, letting it wrap the word is not.
      if (activeWord === null) return true;

      // The words frame hasn't laid out the active word yet,
      // activeWordTop/Height still belong to the previous one: measure the
      // word itself instead. Its rendered letters are a lower bound for its
      // unrendered input, so this can't miss an overflow.
      const laidOut = laidOutActiveWordIndex === activeWordIndex;
      const baseTop = laidOut ? activeWordTop : activeWord.getOffsetTop();
      const baseHeight = laidOut
        ? activeWordHeight
        : activeWord.getOffsetHeight();

      // pending (not yet rendered) input has to be accounted for
      const pending = getPendingWordInput(activeWordIndex);
      const { top, height } = getTopAndHeightWithDifferentData(
        activeWord,
        (pending ?? inputValue) + data,
      );
      // word jumped to next line, or letters wrapped to next line
      return top > baseTop || height > baseHeight;
    },
  };
}
