import { CaretStyle } from "@monkeytype/schemas/configs";
import Config from "../config";
import { getWordDirection } from "./strings";
import * as SlowTimer from "../states/slow-timer";
import * as TestState from "../test/test-state";

export function isCaretFullWidth(): boolean {
  return ["block", "outline", "underline"].includes(Config.caretStyle);
}

export function getTargetPositionLeft(
  fullWidthCaret: boolean,
  isLanguageRightToLeft: boolean,
  activeWordElement: HTMLElement,
  currentWordNodeList: NodeListOf<HTMLElement>,
  fullWidthCaretWidth: number,
  wordLen: number,
  inputLen: number,
  currentWord?: string
): number {
  const invisibleExtraLetters = Config.blindMode || Config.hideExtraLetters;
  let result = 0;

  // use word-specific direction if available and different from language direction
  const isWordRightToLeft = getWordDirection(
    currentWord,
    isLanguageRightToLeft
  );

  if (Config.tapeMode === "off") {
    let positionOffsetToWord = 0;

    const currentLetter = currentWordNodeList[inputLen];
    const lastWordLetter = currentWordNodeList[wordLen - 1];
    const lastInputLetter = currentWordNodeList[inputLen - 1];

    if (isWordRightToLeft) {
      if (inputLen <= wordLen && currentLetter) {
        // at word beginning in zen mode both lengths are 0, but currentLetter is defined "_"
        positionOffsetToWord =
          currentLetter.offsetLeft + (fullWidthCaret ? 0 : fullWidthCaretWidth);
      } else if (!invisibleExtraLetters) {
        positionOffsetToWord =
          (lastInputLetter?.offsetLeft ?? 0) -
          (fullWidthCaret ? fullWidthCaretWidth : 0);
      } else {
        positionOffsetToWord =
          (lastWordLetter?.offsetLeft ?? 0) -
          (fullWidthCaret ? fullWidthCaretWidth : 0);
      }
    } else {
      if (inputLen < wordLen && currentLetter) {
        positionOffsetToWord = currentLetter.offsetLeft;
      } else if (!invisibleExtraLetters) {
        positionOffsetToWord =
          (lastInputLetter?.offsetLeft ?? 0) +
          (lastInputLetter?.offsetWidth ?? 0);
      } else {
        positionOffsetToWord =
          (lastWordLetter?.offsetLeft ?? 0) +
          (lastWordLetter?.offsetWidth ?? 0);
      }
    }
    result = activeWordElement.offsetLeft + positionOffsetToWord;
  } else {
    const wordsWrapperWidth =
      $(document.querySelector("#wordsWrapper") as HTMLElement).width() ?? 0;
    const tapeMargin =
      wordsWrapperWidth *
      (isWordRightToLeft
        ? 1 - Config.tapeMargin / 100
        : Config.tapeMargin / 100);

    result =
      tapeMargin -
      (fullWidthCaret && isWordRightToLeft ? fullWidthCaretWidth : 0);

    if (Config.tapeMode === "word" && inputLen > 0) {
      let currentWordWidth = 0;
      let lastPositiveLetterWidth = 0;
      for (let i = 0; i < inputLen; i++) {
        if (invisibleExtraLetters && i >= wordLen) break;
        const letterOuterWidth =
          $(currentWordNodeList[i] as Element).outerWidth(true) ?? 0;
        currentWordWidth += letterOuterWidth;
        if (letterOuterWidth > 0) lastPositiveLetterWidth = letterOuterWidth;
      }
      // if current letter has zero width move the caret to previous positive width letter
      if ($(currentWordNodeList[inputLen] as Element).outerWidth(true) === 0)
        currentWordWidth -= lastPositiveLetterWidth;
      if (isWordRightToLeft) currentWordWidth *= -1;
      result += currentWordWidth;
    }
  }

  //if not full width, center the caret
  if (!fullWidthCaret) {
    // result -= caretWidth / ;
  }

  return result;
}

export class Caret {
  private element: HTMLElement;
  private style: CaretStyle;
  private wordCache: HTMLElement;

  constructor(element: HTMLElement, style: CaretStyle) {
    this.element = element;

    this.style = "default";
    this.setStyle(style);

    const wordsEl = document.querySelector<HTMLElement>("#words");
    if (!wordsEl) throw new Error("Words element not found");
    this.wordCache = wordsEl;
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
    const caretComputedStyle = window.getComputedStyle(this.element);
    return parseInt(caretComputedStyle.width) || 0;
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

  public animatePosition(options: {
    left: number;
    top: number;
    duration?: number;
    easing?: string;
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

    const left = this.isFullWidth()
      ? options.left
      : options.left - this.getWidth() / 2;

    $(this.element)
      .stop(true, false)
      .animate(
        { left: left, top: options.top },
        finalDuration,
        options.easing ?? "swing"
      );
  }

  public goTo(options: {
    wordIndex: number;
    letterIndex: number;
    animate?: boolean;
  }): void {
    const { left, top } = this.getLeftAndTop(
      options.wordIndex,
      options.letterIndex
    );

    if (options.animate) {
      this.animatePosition({ left, top });
    } else {
      this.setPosition({ left, top });
    }
  }

  private getLeftAndTop(
    wordIndex: number,
    letterIndex: number
  ): { left: number; top: number } {
    const word = this.wordCache.querySelector<HTMLElement>(
      `.word[data-wordindex='${wordIndex}']`
    );
    const letters = word?.querySelectorAll<HTMLElement>("letter");

    if (word === null) {
      throw new Error("Caret goTo: word is null");
    }

    if (letters === undefined || letters.length === 0) {
      throw new Error("Caret goTo: letters is null or empty");
    }

    let lIndex = letterIndex;
    if (letterIndex < 0) lIndex = 0;
    if (letterIndex >= letters.length + 1) lIndex = letters.length;

    let letter = letters[lIndex];

    // because the caret is on the left side of the letter, we need a special case
    // for when we want it to be after the last letter
    let lastLetter = false;
    if (letter === undefined) {
      letter = letters[lIndex - 1];
      lastLetter = true;
    }

    if (
      word === null ||
      word === undefined ||
      letter === null ||
      letter === undefined
    ) {
      throw new Error("Caret goTo: word or letter is null");
    }

    const verticalCorrection =
      (letter.offsetHeight - this.element.offsetHeight) / 2;

    const horizontalCorrection = this.isFullWidth() ? 0 : -this.getWidth() / 2;

    return {
      left:
        word.offsetLeft +
        letter.offsetLeft +
        horizontalCorrection +
        (lastLetter ? letter.offsetWidth : 0),
      top:
        word.offsetTop +
        letter.offsetTop +
        verticalCorrection -
        TestState.lineScrollDistance,
    };

    // this.setPosition({
    //   left:
    //     ,
    //   top: word.offsetTop + letter.offsetTop + verticalCorrection,
    // };

    // this.setPosition({
    //   left:
    //     word.offsetLeft +
    //     letter.offsetLeft +
    //     horizontalCorrection +
    //     (lastLetter ? letter.offsetWidth : 0),
    //   top: word.offsetTop + letter.offsetTop + verticalCorrection,
    // });

    // if (this.isFullWidth()) {
    //   this.setWidth(letter.offsetWidth);
    // } else {
    //   this.resetWidth();
    // }
  }
}
