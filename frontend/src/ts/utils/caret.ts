import { CaretStyle } from "@monkeytype/schemas/configs";
import Config from "../config";
import { getWordDirection } from "./strings";
import * as SlowTimer from "../states/slow-timer";
import * as TestWords from "../test/test-words";
import { getTotalInlineMargin, SingleAnimationFrame } from "./misc";

const wordsCache = document.querySelector<HTMLElement>("#words") as HTMLElement;
const wordsWrapperCache = document.querySelector<HTMLElement>(
  "#wordsWrapper"
) as HTMLElement;

let lockedMainCaretInTape = false;

let caretDebug = true;
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
  private element: HTMLElement;
  private style: CaretStyle = "default";
  private readyToResetMarginTop: boolean = false;
  private readyToResetMarginLeft: boolean = false;
  private singleAnimationFrame = new SingleAnimationFrame();
  private isMainCaret: boolean = false;

  constructor(element: HTMLElement, style: CaretStyle) {
    this.element = element;
    this.setStyle(style);
    if (this.element.id === "caret") {
      this.isMainCaret = true;
    }
  }

  public setStyle(style: CaretStyle): void {
    this.style = style;
    this.element.style.width = "";
    this.element.classList.remove(
      ...["off", "default", "underline", "outline", "block", "carrot", "banana"]
    );
    this.element.classList.add(style);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getWidth(): number {
    return this.element.offsetWidth;
  }

  public getHeight(): number {
    return this.element.offsetHeight;
  }

  public isFullWidth(): boolean {
    return ["block", "outline", "underline"].includes(this.style);
  }

  public setPosition(options: { left: number; top: number }): void {
    this.element.style.left = `${options.left}px`;
    this.element.style.top = `${options.top}px`;
  }

  public setWidth(width: number): void {
    this.element.style.width = `${width}px`;
  }

  public resetWidth(): void {
    this.element.style.width = "";
  }

  public startBlinking(): void {
    if (Config.smoothCaret !== "off" && !SlowTimer.get()) {
      this.element.style.animationName = "caretFlashSmooth";
    } else {
      this.element.style.animationName = "caretFlashHard";
    }
  }

  public stopBlinking(): void {
    this.element.style.animationName = "none";
    this.element.style.opacity = "1";
  }

  public updateBlinkingAnimation(): void {
    if (Config.smoothCaret === "off") {
      this.element.style.animationName = "caretFlashHard";
    } else {
      this.element.style.animationName = "caretFlashSmooth";
    }
  }

  public stopAllAnimations(): void {
    $(this.element).stop(true, false);
  }

  public clearMargins(): void {
    this.element.style.marginTop = "";
    this.element.style.marginLeft = "";
    this.readyToResetMarginTop = false;
    this.readyToResetMarginLeft = false;
  }

  public getMarginLeft(): number {
    return parseFloat(this.element.style.marginLeft || "0");
  }

  public handleTapeScroll(options: {
    marginDelta: number;
    duration: number;
  }): void {
    if (this.isMainCaret && lockedMainCaretInTape) return;

    this.readyToResetMarginLeft = false;

    const newMarginLeft = this.getMarginLeft() + options.marginDelta;

    if (options.duration === 0) {
      $(this.element).stop("marginLeft", true, false).css({
        marginLeft: newMarginLeft,
      });
      this.readyToResetMarginLeft = true;
      return;
    }

    $(this.element)
      .stop("marginLeft", true, false)
      .animate(
        {
          marginLeft: newMarginLeft,
        },
        {
          // this NEEDS to be the same duration as the
          // line scroll otherwise it will look weird
          duration: options.duration,
          queue: "marginLeft",
          complete: () => {
            this.readyToResetMarginLeft = true;
          },
        }
      );
    $(this.element).dequeue("marginLeft");
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
    this.readyToResetMarginTop = false;

    if (options.duration === 0) {
      $(this.element).stop("marginTop", true, false).css({
        marginTop: options.newMarginTop,
      });
      this.readyToResetMarginTop = true;
      return;
    }

    $(this.element)
      .stop("marginTop", true, false)
      .animate(
        {
          marginTop: options.newMarginTop,
        },
        {
          // this NEEDS to be the same duration as the
          // line scroll otherwise it will look weird
          duration: options.duration,
          queue: "marginTop",
          complete: () => {
            this.readyToResetMarginTop = true;
          },
        }
      );
    $(this.element).dequeue("marginTop");
  }

  public animatePosition(options: {
    left: number;
    top: number;
    duration?: number;
    easing?: string;
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

    const finalDuration = SlowTimer.get()
      ? 0
      : options.duration ?? smoothCaretSpeed;

    // accounting for marginTop set by smooth line scroll
    // animation uses inline styles, so its fine to read inline here instead
    // of computed styles which would be much slower
    const currentMarginTop = parseFloat(this.element.style.marginTop || "0");

    const animation: Record<string, number> = {
      left: options.left,
      top: options.top + currentMarginTop * -1,
    };

    if (options.width !== undefined) {
      animation["width"] = options.width;
    }

    $(this.element)
      .stop("pos", true, false)
      .animate(animation, {
        duration: finalDuration,
        easing: options.easing ?? "swing",
        queue: "pos",
      });
    $(this.element).dequeue("pos");
  }

  public goTo(options: {
    wordIndex: number;
    letterIndex: number;
    isLanguageRightToLeft: boolean;
    animate?: boolean;
    animationOptions?: {
      duration?: number;
      easing?: string;
    };
  }): void {
    this.singleAnimationFrame.request(() => {
      if (this.style === "off") return;

      const word = wordsCache.querySelector<HTMLElement>(
        `.word[data-wordindex="${options.wordIndex}"]`
      );
      const letters = word?.querySelectorAll<HTMLElement>("letter") ?? [];
      const wordText = TestWords.words.get(options.wordIndex);

      // caret can be either on the left side of the target letter or the right
      // we stick to the left side unless we are on the last letter or beyond
      // then we switch to the right side

      // we also clamp the letterIndex to be within the range of actual letters
      // anything beyond just goes to the edge of the word
      let side: "beforeLetter" | "afterLetter" = "beforeLetter";
      if (options.letterIndex >= letters.length) {
        side = "afterLetter";
        options.letterIndex = letters.length - 1;
      }
      if (options.letterIndex < 0) {
        options.letterIndex = 0;
      }

      let letter =
        word?.querySelectorAll<HTMLElement>("letter")[options.letterIndex];

      if (word === null || letter === undefined) {
        return;
      }

      if (caretDebug) {
        if (this.element.id === "paceCaret") {
          for (const l of document.querySelectorAll(".word letter")) {
            l.classList.remove("debugCaretTarget");
            l.classList.remove("debugCaretTarget2");
            l.classList.add("debugCaret");
          }
          letter?.classList.add("debugCaretTarget");
          this.element.classList.add("debug");
        }
      } else {
        this.element.classList.remove("debug");
      }

      const { left, top, width } = this.getTargetPositionAndWidth({
        word,
        letter,
        wordText,
        side,
        isLanguageRightToLeft: options.isLanguageRightToLeft,
      });

      // if the margin animation finished, we reset it here by removing the margin
      // and offsetting the top by the same amount
      if (this.readyToResetMarginTop) {
        this.readyToResetMarginTop = false;
        const currentMarginTop = parseFloat(
          this.element.style.marginTop || "0"
        );
        const currentTop = parseFloat(this.element.style.top || "0");
        $(this.element).css({
          marginTop: 0,
          top: currentTop + currentMarginTop,
        });
      }

      // same for marginLeft
      let currentMarginLeft = parseFloat(this.element.style.marginLeft || "0");
      if (this.readyToResetMarginLeft) {
        this.readyToResetMarginLeft = false;
        const currentLeft = parseFloat(this.element.style.left || "0");
        $(this.element).css({
          marginLeft: 0,
          left: currentLeft + currentMarginLeft,
        });
        currentMarginLeft = 0;
      }

      if (options.animate) {
        // to be honst, im not 100% sure why we need to offset the left by currentMarginLeft,
        // but not currentMarginTop, but it seems that way after testing
        const animation: {
          left: number;
          top: number;
          width?: number;
          duration?: number;
          easing?: string;
        } = { left: left - currentMarginLeft, top };
        if (this.isFullWidth()) {
          animation["width"] = width;
        }

        if (options.animationOptions) {
          if (options.animationOptions.duration !== undefined) {
            animation.duration = options.animationOptions.duration;
          }
          if (options.animationOptions.easing !== undefined) {
            animation.easing = options.animationOptions.easing;
          }
        }

        this.animatePosition(animation);
      } else {
        this.setPosition({ left, top });

        if (this.isFullWidth()) {
          this.setWidth(width);
        } else {
          this.resetWidth();
        }
      }
    });
  }

  private getTargetPositionAndWidth(options: {
    word: HTMLElement;
    letter: HTMLElement;
    wordText: string;
    side: "beforeLetter" | "afterLetter";
    isLanguageRightToLeft: boolean;
  }): { left: number; top: number; width: number } {
    const isWordRightToLeft = getWordDirection(
      options.wordText,
      options.isLanguageRightToLeft
    );

    //if the letter is not visible, use the closest visible letter (but only for full width carets)
    const isLetterVisible = options.letter.offsetWidth > 0;
    if (!isLetterVisible && this.isFullWidth()) {
      const letters = options.word.querySelectorAll<HTMLElement>("letter");
      if (letters.length === 0) {
        throw new Error("Caret getLeftTopWidth: no letters found in word");
      }

      // ignore letters after the current letter
      let ignore = true;
      for (let i = letters.length - 1; i >= 0; i--) {
        const loopLetter = letters[i] as HTMLElement;
        if (loopLetter === options.letter) {
          // at the current letter, stop ignoring, continue to the next
          ignore = false;
          continue;
        }
        if (ignore) continue;

        // found the closest visible letter before the current letter
        if (loopLetter.offsetWidth > 0) {
          options.letter = loopLetter;
          break;
        }
      }
      if (caretDebug) {
        options.letter.classList.add("debugCaretTarget2");
      }
    }

    const spaceWidth = getTotalInlineMargin(options.word);
    let width = spaceWidth;
    if (this.isFullWidth() && options.side === "beforeLetter") {
      width = options.letter.offsetWidth;
    }

    let left = 0;
    let top = 0;

    // yes, this is all super verbose, but its easier to maintain and understand
    if (isWordRightToLeft) {
      let afterLetterCorrection = 0;
      if (options.side === "afterLetter") {
        if (this.isFullWidth()) {
          afterLetterCorrection += spaceWidth * -1;
        } else {
          afterLetterCorrection += options.letter.offsetWidth * -1;
        }
      }
      if (Config.tapeMode === "off") {
        if (!this.isFullWidth()) {
          left += options.letter.offsetWidth;
        }
        left += options.letter.offsetLeft;
        left += options.word.offsetLeft;
        left += afterLetterCorrection;
      } else if (Config.tapeMode === "word") {
        if (!this.isFullWidth()) {
          left += options.letter.offsetWidth;
        }
        left += options.word.offsetWidth * -1;
        left += options.letter.offsetLeft;
        left += afterLetterCorrection;
        if (this.isMainCaret && lockedMainCaretInTape) {
          left += wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);
        } else {
          left += options.word.offsetLeft;
          left += options.word.offsetWidth;
        }
      } else if (Config.tapeMode === "letter") {
        if (this.isFullWidth()) {
          left += width * -1;
        }
        if (this.isMainCaret && lockedMainCaretInTape) {
          left += wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);
        } else {
          left += options.letter.offsetLeft;
          left += options.word.offsetLeft;
          left += afterLetterCorrection;
          left += width;
        }
      }
    } else {
      let afterLetterCorrection = 0;
      if (options.side === "afterLetter") {
        afterLetterCorrection += options.letter.offsetWidth;
      }
      if (Config.tapeMode === "off") {
        left += options.letter.offsetLeft;
        left += options.word.offsetLeft;
        left += afterLetterCorrection;
      } else if (Config.tapeMode === "word") {
        left += options.letter.offsetLeft;
        left += afterLetterCorrection;
        if (this.isMainCaret && lockedMainCaretInTape) {
          left += wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);
        } else {
          left += options.word.offsetLeft;
        }
      } else if (Config.tapeMode === "letter") {
        if (this.isMainCaret && lockedMainCaretInTape) {
          left += wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);
        } else {
          left += options.letter.offsetLeft;
          left += options.word.offsetLeft;
          left += afterLetterCorrection;
        }
      }
    }

    //top position
    top += options.letter.offsetTop;
    top += options.word.offsetTop;

    // center the caret vertically and horizontally
    if (this.style !== "underline") {
      top += (options.letter.offsetHeight - this.getHeight()) / 2;
    }
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
