import { CaretStyle } from "@monkeytype/schemas/configs";
import { EasingParam, JSAnimation } from "animejs";
import { createSignal } from "solid-js";

import { Config } from "../../../config/store";
import { getWordElement, LETTER_SELECTOR } from "../../../states/word-elements";
import * as TestWords from "../../../test/test-words";
import { ElementWithUtils } from "../../../utils/dom";
import { getTotalInlineMargin } from "../../../utils/misc";
import type { Direction } from "../../../utils/strings";

const lockedMainCaretInTape = true;
const [isCaretDebug, setCaretDebug] = createSignal(false);
/** Dev options: outlines the pace caret and marks the letters it targets. */
export { isCaretDebug };

export function toggleCaretDebug(): void {
  const caretDebug = !isCaretDebug();
  setCaretDebug(caretDebug);
  if (!caretDebug) {
    for (const l of document.querySelectorAll(`.word ${LETTER_SELECTOR}`)) {
      l.classList.remove("debugCaret");
      l.classList.remove("debugCaretTarget");
      l.classList.remove("debugCaretTarget2");
    }
  } else {
    for (const l of document.querySelectorAll(`.word ${LETTER_SELECTOR}`)) {
      l.classList.add("debugCaret");
    }
  }
}

/**
 * How far letter tape moves the words for the active word's typed letters
 * (the first `inputLength`): their widths, minus the last positive width if
 * the next letter has none.
 */
export function getTapeLetterShift(
  letters: ArrayLike<ElementWithUtils>,
  inputLength: number,
): number {
  let shift = 0;
  let lastPositiveLetterWidth = 0;
  for (let i = 0; i < inputLength; i++) {
    const letter = letters[i];
    if (
      (Config.blindMode || Config.hideExtraLetters) &&
      letter?.getAttribute("data-ui-state") === "extra"
    ) {
      continue;
    }
    const letterOuterWidth = letter?.getOffsetWidth() ?? 0;
    shift += letterOuterWidth;
    if (letterOuterWidth > 0) lastPositiveLetterWidth = letterOuterWidth;
  }
  // if current letter has zero width move the tape to previous positive width letter
  if (letters[inputLength]?.getOffsetWidth() === 0) {
    shift -= lastPositiveLetterWidth;
  }
  return shift;
}

/**
 * Imperative handle on a caret element (#caret, #paceCaret), private to the
 * Words layout: positions it on a letter and keeps it in sync with line
 * jumps and tape scrolls. Its style class, visibility and blinking are
 * rendered by Words.
 */
export class Caret {
  private element: ElementWithUtils;
  private getWordsWrapper: () => HTMLElement;
  private getStyle: () => CaretStyle;
  private readyToResetMarginTop: boolean = false;
  private readyToResetMarginLeft: boolean = false;
  private isMainCaret: boolean;
  private cumulativeTapeMarginCorrection: number = 0;

  private posAnimation: JSAnimation | null = null;
  private marginTopAnimation: JSAnimation | null = null;
  private marginLeftAnimation: JSAnimation | null = null;

  constructor(
    element: HTMLElement,
    options: {
      /** the typist's caret, else the pace caret */
      isMainCaret: boolean;
      style: () => CaretStyle;
      wordsWrapper: () => HTMLElement;
    },
  ) {
    this.element = new ElementWithUtils(element);
    this.isMainCaret = options.isMainCaret;
    this.getStyle = options.style;
    this.getWordsWrapper = options.wordsWrapper;
  }

  /** The element, eg. to check it's still the rendered one. */
  public get native(): HTMLElement {
    return this.element.native;
  }

  private get style(): CaretStyle {
    return this.getStyle();
  }

  private getWidth(): number {
    return this.element.getOffsetWidth();
  }

  /** Drops the width a full width style set, after a style change. */
  public resetWidth(): void {
    this.element.setStyle({ width: "" });
  }

  private getHeight(): number {
    if (!this.element.isHidden()) {
      return this.element.getOffsetHeight();
    }

    // measured shown, hidden again right away (no paint in between)
    this.element.show();
    const height = this.element.getOffsetHeight();
    this.element.hide();
    return height;
  }

  private isFullWidth(): boolean {
    return ["block", "outline", "underline"].includes(this.style);
  }

  private setPosition(options: {
    left: number;
    top: number;
    width?: number;
  }): void {
    this.posAnimation?.cancel();
    let newStyle: Record<string, string> = {
      left: `${options.left}px`,
      top: `${options.top}px`,
    };
    if (options.width !== undefined) {
      newStyle = { ...newStyle, width: `${options.width}px` };
    }
    this.element.setStyle(newStyle);
  }

  public stopAllAnimations(): void {
    this.posAnimation?.cancel();
    this.marginTopAnimation?.cancel();
    this.marginLeftAnimation?.cancel();
  }

  public clearMargins(): void {
    this.element.setStyle({ marginTop: "", marginLeft: "" });
    this.readyToResetMarginTop = false;
    this.readyToResetMarginLeft = false;
    this.cumulativeTapeMarginCorrection = 0;
  }

  public handleTapeWordsRemoved(widthRemoved: number): void {
    // Removing tape words reduces the absolute value of options.newValue passed to handleTapeScroll().
    // To keep the target marginLeft accurate, we reduce the absolute value of cumulative correction by the same amount.
    this.cumulativeTapeMarginCorrection += widthRemoved;
  }

  public handleTapeScroll(options: {
    newValue: number;
    duration: number;
    ease: EasingParam;
  }): void {
    if (this.isMainCaret && lockedMainCaretInTape) return;
    this.readyToResetMarginLeft = false;

    /**
     * options.newValue is the total width of all previously typed characters, and assuming we didn't
     * reset marginLeft or remove any tape words, then it would be the correct marginLeft to go to.
     *
     * Each time marginLeft is reset, the distance between options.newValue and the current
     * marginLeft-after-reset increases, making the caret shift too much left (in LTR).
     *
     * To correct this, we decrease the new target marginLeft by how much we've
     * reset the margin so far (cumulativeTapeMarginCorrection).
     */
    const newMarginLeft =
      options.newValue - this.cumulativeTapeMarginCorrection;

    if (options.duration === 0) {
      this.marginLeftAnimation?.cancel();
      this.element.setStyle({ marginLeft: `${newMarginLeft}px` });
      this.readyToResetMarginLeft = true;
      return;
    }

    this.marginLeftAnimation = this.element.animate({
      marginLeft: newMarginLeft,
      duration: options.duration,
      ease: options.ease,
      onComplete: () => {
        this.readyToResetMarginLeft = true;
      },
    });
  }

  public handleLineJump(options: {
    newMarginTop: number;
    duration: number;
  }): void {
    // smooth line jump works by animating the words top margin.
    // to sync the carets to the lines, we need to do the same here.

    // using a readyToResetMarginTop flag here to make sure the animation
    // is fully finished before we reset the marginTop to 0

    // making sure to use a separate animation queue so that it doesnt
    // affect the position animations
    if (this.isMainCaret && options.duration === 0) return;

    // in case we have two line jumps in a row
    if (this.readyToResetMarginTop) {
      this.element.setStyle({
        marginTop: "0px",
      });
    }

    this.readyToResetMarginTop = false;

    if (options.duration === 0) {
      this.marginTopAnimation?.cancel();
      this.element.setStyle({ marginTop: `${options.newMarginTop}px` });
      this.readyToResetMarginTop = true;
      return;
    }

    this.marginTopAnimation = this.element.animate({
      marginTop: options.newMarginTop,
      duration: options.duration,
      onComplete: () => {
        this.readyToResetMarginTop = true;
      },
    });
  }

  private animatePosition(options: {
    left: number;
    top: number;
    duration?: number;
    easing?: EasingParam;
    width?: number;
  }): void {
    const smoothCaretSpeed =
      Config.smoothCaret === "off"
        ? 0
        : Config.smoothCaret === "slow"
          ? 150
          : Config.smoothCaret === "medium"
            ? 100
            : Config.smoothCaret === "fast"
              ? 85
              : 0;

    const finalDuration = options.duration ?? smoothCaretSpeed;

    const animation: Record<string, number> = {
      left: options.left,
      top: options.top,
    };

    if (options.width !== undefined) {
      animation["width"] = options.width;
    }

    this.posAnimation = this.element.animate({
      ...animation,
      duration: finalDuration,
      ease: options.easing ?? "inOut(1.25)",
    });
  }

  public goTo(options: {
    wordIndex: number;
    letterIndex: number;
    testDirection: Direction;
    /** zen words have no direction of their own, it comes from the input */
    zenWordDirection?: Direction;
    animate?: boolean;
    animationOptions?: {
      duration?: number;
      easing?: string;
    };
  }): void {
    if (this.style === "off") return;
    const wordEl = getWordElement(options.wordIndex);
    const word = wordEl === undefined ? null : new ElementWithUtils(wordEl);
    const testWord = TestWords.words.get(options.wordIndex);
    const wordLength = Array.from(testWord?.display ?? "").length;
    // the typed letters, before clamping to the word's letters below
    const inputLength = options.letterIndex;

    // caret can be either on the left side of the target letter or the right
    // we stick to the left side unless we are on the last letter or beyond
    // then we switch to the right side

    // we also clamp the letterIndex to be within the range of actual letters
    // anything beyond just goes to the edge of the word
    let side: "beforeLetter" | "afterLetter" = "beforeLetter";
    if (Config.mode === "zen") {
      if (options.letterIndex > 0) {
        side = "afterLetter";
        options.letterIndex -= 1;
      }
    } else {
      if (options.letterIndex >= wordLength) {
        side = "afterLetter";

        if (Config.blindMode || Config.hideExtraLetters) {
          options.letterIndex = wordLength - 1;
        } else {
          options.letterIndex -= 1;
        }
      }
    }

    if (options.letterIndex < 0) {
      options.letterIndex = 0;
    }

    if (word === null) return;

    const { left, top, width } = this.getTargetPositionAndWidth({
      word,
      letterIndex: options.letterIndex,
      inputLength,
      side,
      testDirection: options.testDirection,
      wordDirection:
        testWord?.direction ??
        options.zenWordDirection ??
        options.testDirection,
    });

    // animation uses inline styles, so its fine to read inline here instead
    // of computed styles which would be much slower

    // if the margin animation finished, we reset it here by removing the margin
    // and offsetting the top by the same amount
    let currentMarginTop = parseFloat(this.element.getStyle().marginTop || "0");
    if (this.readyToResetMarginTop) {
      this.readyToResetMarginTop = false;
      const currentTop = parseFloat(this.element.getStyle().top || "0");

      this.element.setStyle({
        marginTop: "0px",
        top: `${currentTop + currentMarginTop}px`,
      });
      currentMarginTop = 0;
    }

    // same for marginLeft
    let currentMarginLeft = parseFloat(
      this.element.getStyle().marginLeft || "0",
    );
    if (this.readyToResetMarginLeft) {
      this.readyToResetMarginLeft = false;
      const currentLeft = parseFloat(this.element.getStyle().left || "0");

      this.element.setStyle({
        marginLeft: "0px",
        left: `${currentLeft + currentMarginLeft}px`,
      });
      this.cumulativeTapeMarginCorrection += currentMarginLeft;
      currentMarginLeft = 0;
    }

    /**
     * we subtract the margin from the target position in order to arrive at the intended location
     * if my margin is +20 and I wanna go to +50, then if I set my inline style left/top to +50
     * I will arrive to +70. However if I set it to (50 - 20), my left/top will be +30 and my margin
     * will be +20 and I will end up at (30 + 20) = 50
     */

    const animateOrPositionOptions = {
      left: left - currentMarginLeft,
      top: top - currentMarginTop,
      ...(this.isFullWidth() && { width }),
      ...(options.animate && options.animationOptions),
    };

    if (options.animate) {
      this.animatePosition(animateOrPositionOptions);
    } else {
      this.setPosition(animateOrPositionOptions);
    }
  }

  private getTargetPositionAndWidth(options: {
    word: ElementWithUtils;
    letterIndex: number;
    inputLength: number;
    side: "beforeLetter" | "afterLetter";
    testDirection: Direction;
    wordDirection: Direction;
  }): { left: number; top: number; width: number } {
    const letters = options.word?.qsa(LETTER_SELECTOR);

    if (letters.length === 0) {
      throw new Error(
        "Caret getTargetPositionAndWidth: no letters found in word",
      );
    }

    let letter = letters[options.letterIndex] ?? letters[letters.length - 1];

    if (!letter) {
      throw new Error(
        `Caret getTargetPositionAndWidth: letter not found for index ${options.letterIndex}`,
      );
    }

    const caretDebug = isCaretDebug();
    if (caretDebug && !this.isMainCaret) {
      for (const l of document.querySelectorAll(`.word ${LETTER_SELECTOR}`)) {
        l.classList.remove("debugCaretTarget");
        l.classList.remove("debugCaretTarget2");
        l.classList.add("debugCaret");
      }
      letter?.addClass("debugCaretTarget");
    }

    //if the letter is not visible, use the closest visible letter
    const isLetterVisible = letter.getOffsetWidth() > 0;
    if (!isLetterVisible) {
      for (let i = options.letterIndex - 1; i >= 0; i--) {
        const loopLetter = letters[i] as ElementWithUtils;

        // find the closest visible letter before the current letter
        if (loopLetter.getOffsetWidth() > 0) {
          letter = loopLetter;
          break;
        }
      }
      if (caretDebug) {
        letter.addClass("debugCaretTarget2");
      }
    }

    const spaceWidth = getTotalInlineMargin(options.word.native);
    let width = spaceWidth;
    if (this.isFullWidth() && options.side === "beforeLetter") {
      width = letter.getOffsetWidth();
    }

    let left = 0;
    let top = 0;

    // the tape is anchored by the test's direction, whatever the word's is
    const wrapperWidth = this.getWordsWrapper().offsetWidth;
    const tapeOffset =
      options.testDirection === "rtl"
        ? wrapperWidth * (1 - Config.tapeMargin / 100)
        : wrapperWidth * (Config.tapeMargin / 100);

    const lockedInTape =
      this.isMainCaret && lockedMainCaretInTape && Config.tapeMode !== "off";
    // the tape anchors the word's start in the test's direction. A word
    // running the other way starts at its other edge: the caret can't stay at
    // the anchor, it goes to its letter in the word as laid out once the tape
    // scroll lands (it's measured before the scroll)
    let wordLeft = options.word.getOffsetLeft();
    let tapeAnchorsLetter = lockedInTape;
    if (lockedInTape && options.wordDirection !== options.testDirection) {
      tapeAnchorsLetter = false;
      const wordWidth = options.word.getOffsetWidth();
      const shift =
        Config.tapeMode === "letter"
          ? getTapeLetterShift(letters, options.inputLength)
          : 0;
      wordLeft =
        options.testDirection === "rtl"
          ? tapeOffset - wordWidth + shift
          : tapeOffset - shift;
    }

    // yes, this is all super verbose, but its easier to maintain and understand
    if (options.wordDirection === "rtl") {
      let afterLetterCorrection = 0;
      if (options.side === "afterLetter") {
        if (this.isFullWidth()) {
          afterLetterCorrection += spaceWidth * -1;
        } else {
          afterLetterCorrection += letter.getOffsetWidth() * -1;
        }
      }
      if (Config.tapeMode === "off" || (lockedInTape && !tapeAnchorsLetter)) {
        if (!this.isFullWidth()) {
          left += letter.getOffsetWidth();
        }
        left += letter.getOffsetLeft();
        left += wordLeft;
        left += afterLetterCorrection;
      } else if (Config.tapeMode === "word") {
        if (!this.isFullWidth()) {
          left += letter.getOffsetWidth();
        }
        left += options.word.getOffsetWidth() * -1;
        left += letter.getOffsetLeft();
        left += afterLetterCorrection;
        if (tapeAnchorsLetter) {
          left += tapeOffset;
        } else {
          left += options.word.getOffsetLeft();
          left += options.word.getOffsetWidth();
        }
      } else if (Config.tapeMode === "letter") {
        if (this.isFullWidth()) {
          left += width * -1;
        }
        if (tapeAnchorsLetter) {
          left += tapeOffset;
        } else {
          left += letter.getOffsetLeft();
          left += options.word.getOffsetLeft();
          left += afterLetterCorrection;
          left += width;
        }
      }
    } else {
      let afterLetterCorrection = 0;
      if (options.side === "afterLetter") {
        afterLetterCorrection += letter.getOffsetWidth();
      }
      if (Config.tapeMode === "off" || (lockedInTape && !tapeAnchorsLetter)) {
        left += letter.getOffsetLeft();
        left += wordLeft;
        left += afterLetterCorrection;
      } else if (Config.tapeMode === "word") {
        left += letter.getOffsetLeft();
        left += afterLetterCorrection;
        if (tapeAnchorsLetter) {
          left += tapeOffset;
        } else {
          left += options.word.getOffsetLeft();
        }
      } else if (Config.tapeMode === "letter") {
        if (tapeAnchorsLetter) {
          left += tapeOffset;
        } else {
          left += letter.getOffsetLeft();
          left += options.word.getOffsetLeft();
          left += afterLetterCorrection;
        }
      }
    }

    //top position
    top += letter.getOffsetTop();
    top += options.word.getOffsetTop();

    if (this.style === "underline") {
      // if style is underline, add the height of the letter to the top
      top += letter.getOffsetHeight();
    } else {
      // else center vertically in the letter
      top += (letter.getOffsetHeight() - this.getHeight()) / 2;
    }

    // also center horizontally
    if (!this.isFullWidth()) {
      left += (this.getWidth() / 2) * -1;
    }

    return {
      left,
      top,
      width,
    };
  }
}
