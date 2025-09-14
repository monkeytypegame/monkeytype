import { CaretStyle } from "@monkeytype/schemas/configs";
import Config from "../config";
import { getWordDirection } from "./strings";
import * as SlowTimer from "../states/slow-timer";
import * as TestState from "../test/test-state";
import * as TestWords from "../test/test-words";

// export function isCaretFullWidth(): boolean {
//   return ["block", "outline", "underline"].includes(Config.caretStyle);
// }

export class Caret {
  private element: HTMLElement;
  private style: CaretStyle;
  private wordsCache: HTMLElement;
  private wordsWrapperCache: HTMLElement;
  private pendingFrame: number | null = null;

  constructor(element: HTMLElement, style: CaretStyle) {
    this.element = element;

    this.style = "default";
    this.setStyle(style);

    const wordsEl = document.querySelector<HTMLElement>("#words");
    if (!wordsEl) throw new Error("Words element not found");
    this.wordsCache = wordsEl;

    const wordsWrapperEl = document.querySelector<HTMLElement>("#wordsWrapper");
    if (!wordsWrapperEl) throw new Error("Words wrapper element not found");
    this.wordsWrapperCache = wordsWrapperEl;
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

    const animation: Record<string, number> = {
      left: options.left,
      top: options.top,
    };

    if (options.width !== undefined) {
      animation["width"] = options.width;
    }

    $(this.element)
      .stop(true, false)
      .animate(animation, finalDuration, options.easing ?? "swing");
  }

  public getSpaceWidth(wordElement: HTMLElement): number {
    const wordComputedStyle = window.getComputedStyle(wordElement);
    return (
      parseInt(wordComputedStyle.marginRight) +
      parseInt(wordComputedStyle.marginLeft)
    );
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
    if (this.pendingFrame !== null) {
      cancelAnimationFrame(this.pendingFrame);
    }
    this.pendingFrame = requestAnimationFrame(() => {
      this.pendingFrame = null;
      if (this.style === "off") return;

      const word = this.wordsCache.querySelector<HTMLElement>(
        `.word[data-wordindex="${options.wordIndex}"]`
      );
      const wordText = TestWords.words.get(options.wordIndex);

      let side: "beforeLetter" | "afterLetter" = "beforeLetter";
      if (options.letterIndex >= wordText.length) {
        side = "afterLetter";
        options.letterIndex = wordText.length - 1;
      }
      if (options.letterIndex < 0) {
        options.letterIndex = 0;
      }

      let letter =
        word?.querySelectorAll<HTMLElement>("letter")[options.letterIndex];

      if (word === null || letter === undefined) {
        return;
      }

      for (const l of document.querySelectorAll(".word letter")) {
        l.classList.remove("debugCaretTarget");
        l.classList.remove("debugCaretTarget2");
      }

      letter?.classList.add("debugCaretTarget");

      const { left, top, width } = this.getLeftTopWidth({
        word,
        letter,
        wordText,
        side,
        isLanguageRightToLeft: options.isLanguageRightToLeft,
      });

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

  private getLeftTopWidth(options: {
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
      options.letter.classList.add("debugCaretTarget2");
    }

    const spaceWidth = this.getSpaceWidth(options.word);
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
        left += this.wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);
        left += afterLetterCorrection;

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
      } else if (Config.tapeMode === "letter") {
        if (this.isFullWidth()) {
          left += width * -1;
        }
        left += this.wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);

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
        left += this.wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);
        left += afterLetterCorrection;

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
      } else if (Config.tapeMode === "letter") {
        left += this.wordsWrapperCache.offsetWidth * (Config.tapeMargin / 100);

        top += options.letter.offsetTop;
        top += options.word.offsetTop;
      }
    }

    top += TestState.lineScrollDistance * -1;

    // center the caret vertically and horizontally
    top += (options.letter.offsetHeight - this.getHeight()) / 2;
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
