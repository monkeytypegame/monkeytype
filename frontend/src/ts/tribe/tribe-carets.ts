import * as TestWords from "../test/test-words";
import * as TestUI from "../test/test-ui";
import Config from "../config";
import { convertRemToPixels, mapRange } from "../utils/misc";
import * as SlowTimer from "../states/slow-timer";
import { getRoom } from "./tribe-state";
import tribeSocket from "./tribe-socket";

const carets: { [key: string]: TribeCaret } = {};

export class TribeCaret {
  private element: JQuery<HTMLElement> | undefined;

  constructor(
    private socketId: string,
    private wordIndex: number,
    private letterIndex: number,
    private name: string
  ) {
    this.socketId = socketId;
    this.wordIndex = wordIndex;
    this.letterIndex = letterIndex;
    this.name = name;
  }

  public spawn(): void {
    if (this.element) {
      return this.destroy();
    }
    //create element and store
    const element = document.createElement("div");
    element.classList.add("tribeCaret", "default");
    element.style.fontSize = Config.fontSize + "rem";
    element.setAttribute("socketId", this.socketId);
    (document.querySelector(".pageTest #wordsWrapper") as HTMLElement).prepend(
      element
    );

    //create caretName element, fill the name and insert inside element
    const caretName = document.createElement("div");
    caretName.classList.add("caretName");
    caretName.innerText = this.name;
    element.appendChild(caretName);

    this.element = $(element);
  }

  public destroy(): void {
    if (!this.element) {
      return;
    }
    this.element.remove();
    this.element = undefined;
  }

  public updatePosition(newWordIndex: number, newLetterIndex: number): void {
    this.wordIndex = newWordIndex;
    this.letterIndex = newLetterIndex;
  }

  public animate(animationDuration: number): void {
    if (!this.element) {
      this.spawn();
      return this.animate(animationDuration);
    }
    // if ($("#paceCaret").hasClass("hidden")) {
    //   $("#paceCaret").removeClass("hidden");
    // }

    let animationLetterIndex = this.letterIndex;
    let animationWordIndex = this.wordIndex;

    try {
      //move to next word if needed
      while (
        animationLetterIndex >= TestWords.words.get(animationWordIndex).length
      ) {
        animationLetterIndex -= TestWords.words.get(animationWordIndex).length;
        animationWordIndex++;
      }

      let currentLetter;
      let newTop;
      let newLeft;
      try {
        const newIndex =
          animationWordIndex -
          (TestWords.words.currentIndex - TestUI.currentWordElementIndex);
        const word = document.querySelectorAll("#words .word")[newIndex];
        if (animationLetterIndex === -1) {
          currentLetter = <HTMLElement>word.querySelectorAll("letter")[0];
        } else {
          currentLetter = <HTMLElement>(
            word.querySelectorAll("letter")[animationLetterIndex]
          );
        }

        const currentLetterHeight = $(currentLetter).height(),
          currentLetterWidth = $(currentLetter).width(),
          caretWidth = this.element.width();

        if (
          currentLetterHeight === undefined ||
          currentLetterWidth === undefined ||
          caretWidth === undefined
        ) {
          throw ``;
        }

        newTop =
          currentLetter.offsetTop -
          Config.fontSize * convertRemToPixels(1) * 0.1;
        newLeft;
        if (animationLetterIndex === -1) {
          newLeft = currentLetter.offsetLeft;
        } else {
          newLeft =
            currentLetter.offsetLeft + currentLetterWidth - caretWidth / 2;
        }
        this.element.removeClass("hidden");
      } catch (e) {
        this.element.addClass("hidden");
      }

      if (newTop !== undefined) {
        let smoothlinescroll = $("#words .smoothScroller").height();
        if (smoothlinescroll === undefined) smoothlinescroll = 0;

        this.element.css({
          top: newTop - smoothlinescroll,
        });

        if (Config.smoothCaret) {
          this.element.stop(true, false).animate(
            {
              left: newLeft,
            },
            SlowTimer.get() ? 0 : animationDuration,
            "linear"
          );
        } else {
          this.element.stop(true, false).animate(
            {
              left: newLeft,
            },
            0,
            "linear"
          );
        }
      }
    } catch (e) {
      console.error(
        `Error updating tribe caret for socket id ${this.socketId}: ${e}`
      );
      this.destroy();
    }
  }
}

export function init(): void {
  const room = getRoom();
  if (!room) return;
  for (const socketId of Object.keys(room.users)) {
    if (socketId === tribeSocket.getId()) continue;

    const name = room.users[socketId].name;

    carets[socketId] = new TribeCaret(socketId, 0, -1, name);
  }
}

//todo remove
let durationDivider = 4;
export function setDurationDivider(newDurationDivider: number): void {
  newDurationDivider = mapRange(newDurationDivider, 1, 10, 1, 10);
  durationDivider = newDurationDivider;
}

export function updateAndAnimate(
  data: Record<string, TribeTypes.UserProgress>
): void {
  for (const socketId of Object.keys(data)) {
    if (!carets[socketId]) continue;
    carets[socketId].updatePosition(
      data[socketId].wordIndex,
      data[socketId].letterIndex
    );
    carets[socketId].animate((getRoom()?.updateRate ?? 500) / durationDivider);
  }
}

export function destroy(socketId: string): void {
  if (carets[socketId]) {
    carets[socketId].destroy();
    delete carets[socketId];
  }
}

export function destroyAll(): void {
  for (const socketId of Object.keys(carets)) {
    carets[socketId].destroy();
    delete carets[socketId];
  }
}
