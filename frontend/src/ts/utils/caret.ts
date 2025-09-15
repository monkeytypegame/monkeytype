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
  private singleAnimationFrame = new SingleAnimationFrame();

  constructor(element: HTMLElement, style: CaretStyle) {
    this.element = element;
    this.setStyle(style);
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

  public handleSmoothLineScroll(options: {
    duration: number;
    newMarginTop: number;
  }): void {
    // smooth line scroll works by animating the words top margin.
    // to sync the carets to the lines, we need to do the same here.

    // using a readyToResetMarginTop flag here to make sure the animation
    // is fully finished before we reset the marginTop to 0

    // making sure to use a separate animation queue so that it doesnt
    // affect the position animations
    this.readyToResetMarginTop = false;
    $(this.element)
      .stop("marginTop", true, false)
      .animate(
        {
          marginTop: options.newMarginTop,
        },
        {
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
        for (const l of document.querySelectorAll(".word letter")) {
          l.classList.remove("debugCaretTarget");
          l.classList.remove("debugCaretTarget2");
          l.classList.add("debugCaret");
        }
        letter?.classList.add("debugCaretTarget");
        this.element.classList.add("debug");
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

      // again, animations use inline styles, so we read them here instead of computed
      // which would be much slower
      const currentMarginTop = parseFloat(this.element.style.marginTop || "0");
      const currentTop = parseFloat(this.element.style.top || "0");

      // if the margin animation finished, we reset it here by removing the margin
      // and offsetting the top by the same amount
      if (this.readyToResetMarginTop) {
        this.readyToResetMarginTop = false;
        $(this.element).css({
          marginTop: 0,
          top: currentTop + currentMarginTop,
        });
      }

      if (options.animate) {
        const animation: {
          left: number;
          top: number;
          width?: number;
          duration?: number;
          easing?: string;
        } = { left, top };
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

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
      } else if (Config.tapeMode === "word") {
        if (!this.isFullWidth()) {
          left += options.letter.offsetWidth;
        }
        left += options.letter.offsetLeft;
        left += options.word.offsetWidth * -1;
        left += wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);
        left += afterLetterCorrection;

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
      } else if (Config.tapeMode === "letter") {
        if (this.isFullWidth()) {
          left += width * -1;
        }
        left += wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
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

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
      } else if (Config.tapeMode === "word") {
        left += options.letter.offsetLeft;
        left += wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);
        left += afterLetterCorrection;

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
      } else if (Config.tapeMode === "letter") {
        left += wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
      }
    }

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
