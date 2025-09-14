import Config from "../config";
import * as TestInput from "./test-input";
import * as TestState from "../test/test-state";
import * as TestWords from "./test-words";
import { subscribe } from "../observables/config-event";
import { Caret } from "../utils/caret";
import * as JSONData from "../utils/json-data";

export function stopAnimation(): void {
  caret.stopBlinking();
}

export function startAnimation(): void {
  caret.startBlinking();
}

export function hide(): void {
  caret.getElement().classList.add("hidden");
}

export async function updatePosition(noAnim = false): Promise<void> {
  const word = document.querySelector<HTMLElement>(
    `.word[data-wordindex="${TestState.activeWordIndex}"]`
  );
  const letters = word?.querySelectorAll<HTMLElement>("letter");

  if (word === null || letters === undefined) return;

  let side: "beforeLetter" | "afterLetter" = "beforeLetter";
  let letter =
    word.querySelectorAll<HTMLElement>("letter")[
      TestInput.input.current.length
    ];

  if (letter === undefined) {
    if (TestInput.input.current.length >= TestWords.words.getCurrent().length) {
      letter =
        word.querySelectorAll<HTMLElement>("letter")[
          TestInput.input.current.length - 1
        ];
      side = "afterLetter";
    } else {
      throw new Error(
        "Caret updatePosition: letter is undefined but input not longer or equal word"
      );
    }
  }

  for (const l of document.querySelectorAll(".word letter")) {
    l.classList.remove("debugCaretTarget");
    l.classList.remove("debugCaretTarget2");
  }

  letter?.classList.add("debugCaretTarget");

  const isLanguageRightToLeft =
    (await JSONData.getLanguage(Config.language)).rightToLeft ?? false;

  caret.goTo({
    word: word,
    letter: letter as HTMLElement,
    wordText: TestWords.words.getCurrent(),
    isLanguageRightToLeft,
    letters,
    side,
    animate: Config.smoothCaret !== "off" && !noAnim,
  });

  //this should probably be somewhere else, or might not even be needed?
  // if (Config.showAllLines) {
  //   const browserHeight = window.innerHeight;
  //   const middlePos = browserHeight / 2 - (jqcaret.outerHeight() as number) / 2;
  //   const contentHeight = document.body.scrollHeight;

  //   if (
  //     newTop >= middlePos &&
  //     contentHeight > browserHeight &&
  //     TestState.isActive
  //   ) {
  //     const newscrolltop = newTop - middlePos / 2;
  //     window.scrollTo({
  //       left: 0,
  //       top: newscrolltop,
  //       behavior: prefersReducedMotion() ? "instant" : "smooth",
  //     });
  //   }
  // }
}

const caret = new Caret(
  document.getElementById("caret") as HTMLElement,
  Config.caretStyle
);

subscribe((eventKey) => {
  if (eventKey === "caretStyle") {
    caret.setStyle(Config.caretStyle);
    void updatePosition(true);
  }
  if (eventKey === "smoothCaret") {
    caret.updateBlinkingAnimation();
  }
});

export function show(noAnim = false): void {
  caret.getElement().classList.remove("hidden");
  void updatePosition(noAnim);
  startAnimation();
}
