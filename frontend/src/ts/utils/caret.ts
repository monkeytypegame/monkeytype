import { CaretStyle } from "@monkeytype/schemas/configs";
import Config from "../config";
import * as TestWords from "../test/test-words";
import { getTotalInlineMargin } from "./misc";
import { isWordRightToLeft } from "./strings";
import { requestDebouncedAnimationFrame } from "./debounced-animation-frame";
import { EasingParam, JSAnimation } from "animejs";
import { ElementWithUtils, qsr } from "./dom";

const wordsCache = qsr("#words");
const wordsWrapperCache = qsr("#wordsWrapper");

let lockedMainCaretInTape = true;
let caretDebug = false;

export function toggleCaretDebug(): void {
  caretDebug = !caretDebug;
  if (!caretDebug) {
    for (const l of document.querySelectorAll(".word letter")) {
      l.classList.remove("debugCaret");
      l.classList.remove("debugCaretTarget");
      l.classList.remove("debugCaretTarget2");
    }
  } else {
    for (const l of document.querySelectorAll(".word letter")) {
      l.classList.add("debugCaret");
    }
  }
}

export class Caret {
  private id: string;
  private element: ElementWithUtils;
  private style: CaretStyle = "default";
  private readyToResetMarginTop: boolean = false;
  private readyToResetMarginLeft: boolean = false;
  private isMainCaret: boolean = false;
  private cumulativeTapeMarginCorrection: number = 0;

  private posAnimation: JSAnimation | null = null;
  private marginTopAnimation: JSAnimation | null = null;
  private marginLeftAnimation: JSAnimation | null = null;

  constructor(element: ElementWithUtils, style: CaretStyle) {
    this.id = element.native.id;
    this.element = element;
    this.setStyle(style);
    if (this.id === "caret") {
      this.isMainCaret = true;
    }
  }

  public setStyle(style: CaretStyle): void {
    this.style = style;
    this.resetWidth();
    this.element.removeClass([
      "off",
      "default",
      "underline",
      "outline",
      "block",
      "carrot",
      "banana",
      "monkey",
    ]);
    this.element.addClass(style);
  }

  public show(): void {
    this.element.show();
    this.element.setStyle({ display: "" });
  }

  public hide(): void {
    this.element.hide();
  }

  public isHidden(): boolean {
    return this.element.hasClass("hidden");
  }

  public getWidth(): number {
    return this.element.getOffsetWidth();
  }

  public resetWidth(): void {
    this.element.setStyle({ width: "" });
  }

  public getHeight(): number {
    if (!this.isHidden()) {
      return this.element.getOffsetHeight();
    }

    let height = 0;
    this.show();
    height = this.element.getOffsetHeight();
    this.hide();
    return height;
  }

  public isFullWidth(): boolean {
    return ["block", "outline", "underline"].includes(this.style);
  }

  public setPosition(options: {
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

  public startBlinking(): void {
    if (Config.smoothCaret !== "off") {
      this.element.setStyle({ animationName: "caretFlashSmooth" });
    } else {
      this.element.setStyle({ animationName: "caretFlashHard" });
    }
  }

  public stopBlinking(): void {
    this.element.setStyle({ animationName: "none", opacity: "1" });
  }

  public updateBlinkingAnimation(): void {
    if (Config.smoothCaret === "off") {
      this.element.setStyle({ animationName: "caretFlashHard" });
    } else {
      this.element.setStyle({ animationName: "caretFlashSmooth" });
    }
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

  public animatePosition(options: {
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
    isLanguageRightToLeft: boolean;
    isDirectionReversed: boolean;
    animate?: boolean;
    animationOptions?: {
      duration?: number;
      easing?: string;
    };
  }): void {
    if (this.style === "off") return;
    requestDebouncedAnimationFrame(`caret.${this.id}.goTo`, () => {
      const word = wordsCache.qs(
        `.word[data-wordindex="${options.wordIndex}"]`,
      );
      const letters = word?.qsa("letter") ?? [];
      const wordText = TestWords.words.get(options.wordIndex);

      // caret can be either on the left side of the target letter or the right
      // we stick to the left side unless we are on the last letter or beyond
      // then we switch to the right side

      // we also clamp the letterIndex to be within the range of actual letters
      // anything beyond just goes to the edge of the word
      let side: "beforeLetter" | "afterLetter" = "beforeLetter";
      if (options.letterIndex >= letters.length) {
        side = "afterLetter";

        if (Config.blindMode || Config.hideExtraLetters) {
          options.letterIndex = wordText?.length - 1;
        } else {
          options.letterIndex = letters.length - 1;
        }
      }

      if (options.letterIndex < 0) {
        options.letterIndex = 0;
      }

      let letter = word?.qsa("letter")[options.letterIndex];

      if (word === null || letter === undefined) {
        return;
      }

      if (caretDebug) {
        if (this.id === "paceCaret") {
          for (const l of document.querySelectorAll(".word letter")) {
            l.classList.remove("debugCaretTarget");
            l.classList.remove("debugCaretTarget2");
            l.classList.add("debugCaret");
          }
          letter?.addClass("debugCaretTarget");
          this.element.addClass("debug");
        }
      } else {
        this.element.removeClass("debug");
      }

      const { left, top, width } = this.getTargetPositionAndWidth({
        word,
        letter,
        wordText,
        side,
        isLanguageRightToLeft: options.isLanguageRightToLeft,
        isDirectionReversed: options.isDirectionReversed,
      });

      // animation uses inline styles, so its fine to read inline here instead
      // of computed styles which would be much slower

      // if the margin animation finished, we reset it here by removing the margin
      // and offsetting the top by the same amount
      let currentMarginTop = parseFloat(
        this.element.getStyle().marginTop || "0",
      );
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
    });
  }

  private getTargetPositionAndWidth(options: {
    word: ElementWithUtils;
    letter: ElementWithUtils;
    wordText: string;
    side: "beforeLetter" | "afterLetter";
    isLanguageRightToLeft: boolean;
    isDirectionReversed: boolean;
  }): { left: number; top: number; width: number } {
    const [isWordRTL, isFullMatch] = isWordRightToLeft(
      options.wordText,
      options.isLanguageRightToLeft,
      options.isDirectionReversed,
    );

    //if the letter is not visible, use the closest visible letter
    const isLetterVisible = options.letter.getOffsetWidth() > 0;
    if (!isLetterVisible) {
      const letters = options.word.qsa("letter");
      if (letters.length === 0) {
        throw new Error("Caret getLeftTopWidth: no letters found in word");
      }

      // ignore letters after the current letter
      let ignore = true;
      for (let i = letters.length - 1; i >= 0; i--) {
        const loopLetter = letters[i] as ElementWithUtils;
        if (loopLetter === options.letter) {
          // at the current letter, stop ignoring, continue to the next
          ignore = false;
          continue;
        }
        if (ignore) continue;

        // found the closest visible letter before the current letter
        if (loopLetter.getOffsetWidth() > 0) {
          options.letter = loopLetter;
          break;
        }
      }
      if (caretDebug) {
        options.letter.addClass("debugCaretTarget2");
      }
    }

    const spaceWidth = getTotalInlineMargin(options.word.native);
    let width = spaceWidth;
    if (this.isFullWidth() && options.side === "beforeLetter") {
      width = options.letter.getOffsetWidth();
    }

    let left = 0;
    let top = 0;

    const tapeOffset =
      wordsWrapperCache.getOffsetWidth() * (Config.tapeMargin / 100);

    // yes, this is all super verbose, but its easier to maintain and understand
    if (isWordRTL) {
      if (isFullMatch) options.word.addClass("wordRtl");
      let afterLetterCorrection = 0;
      if (options.side === "afterLetter") {
        if (this.isFullWidth()) {
          afterLetterCorrection += spaceWidth * -1;
        } else {
          afterLetterCorrection += options.letter.getOffsetWidth() * -1;
        }
      }
      if (Config.tapeMode === "off") {
        if (!this.isFullWidth()) {
          left += options.letter.getOffsetWidth();
        }
        left += options.letter.getOffsetLeft();
        left += options.word.getOffsetLeft();
        left += afterLetterCorrection;
      } else if (Config.tapeMode === "word") {
        if (!this.isFullWidth()) {
          left += options.letter.getOffsetWidth();
        }
        left += options.word.getOffsetWidth() * -1;
        left += options.letter.getOffsetLeft();
        left += afterLetterCorrection;
        if (this.isMainCaret && lockedMainCaretInTape) {
          left += wordsWrapperCache.getOffsetWidth() - tapeOffset;
        } else {
          left += options.word.getOffsetLeft();
          left += options.word.getOffsetWidth();
        }
      } else if (Config.tapeMode === "letter") {
        if (this.isFullWidth()) {
          left += width * -1;
        }
        if (this.isMainCaret && lockedMainCaretInTape) {
          left += wordsWrapperCache.getOffsetWidth() - tapeOffset;
        } else {
          left += options.letter.getOffsetLeft();
          left += options.word.getOffsetLeft();
          left += afterLetterCorrection;
          left += width;
        }
      }
    } else {
      let afterLetterCorrection = 0;
      if (options.side === "afterLetter") {
        afterLetterCorrection += options.letter.getOffsetWidth();
      }
      if (Config.tapeMode === "off") {
        left += options.letter.getOffsetLeft();
        left += options.word.getOffsetLeft();
        left += afterLetterCorrection;
      } else if (Config.tapeMode === "word") {
        left += options.letter.getOffsetLeft();
        left += afterLetterCorrection;
        if (this.isMainCaret && lockedMainCaretInTape) {
          left += tapeOffset;
        } else {
          left += options.word.getOffsetLeft();
        }
      } else if (Config.tapeMode === "letter") {
        if (this.isMainCaret && lockedMainCaretInTape) {
          left += tapeOffset;
        } else {
          left += options.letter.getOffsetLeft();
          left += options.word.getOffsetLeft();
          left += afterLetterCorrection;
        }
      }
    }

    //top position
    top += options.letter.getOffsetTop();
    top += options.word.getOffsetTop();

    if (this.style === "underline") {
      // if style is underline, add the height of the letter to the top
      top += options.letter.getOffsetHeight();
    } else {
      // else center vertically in the letter
      top += (options.letter.getOffsetHeight() - this.getHeight()) / 2;
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
