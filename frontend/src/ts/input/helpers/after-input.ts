// What follows each test input: render buffer writes, keymap
// highlight, focus mode and sounds. Buffered, rendered in the next words frame.
import { Config } from "../../config/store";
import { createEvent } from "../../hooks/createEvent";
import { playClick, playError } from "../../audio";
import {
  getCompositionData,
  highlightKeymapKey,
  setFocusMode,
} from "../../states/test";
import { getActiveWordIndex } from "../../test/engine/state";
import {
  setActiveWord,
  setWordInput,
  setWordTyped,
  truncateWords,
} from "../../states/words-render";
import { getCurrentInput } from "../../test/engine/events/data";
import * as TestWords from "../../test/engine/test-words";

/** Dispatched after each typed character, with whether it was correct. */
export const textInsertedEvent = createEvent<boolean>();

function updateWordLetters(input: string): void {
  setWordInput(getActiveWordIndex(), input, getCompositionData());
}

function highlightNextKey(): void {
  if (Config.keymapMode !== "next") return;
  const keyToHighlight =
    TestWords.words.getCurrent()?.textWithCommit[getCurrentInput().length];
  if (keyToHighlight !== undefined) {
    highlightKeymapKey(keyToHighlight);
  }
}

// this means input, delete or composition
function afterAnyTestInput(
  type: "textInput" | "delete" | "compositionUpdate",
  correctInput: boolean | null,
): void {
  if (type === "textInput" || type === "compositionUpdate") {
    if (
      correctInput === true ||
      Config.playSoundOnError === "off" ||
      Config.blindMode
    ) {
      void playClick();
    } else {
      void playError();
    }
  } else if (type === "delete") {
    void playClick();
  }

  highlightNextKey();

  setFocusMode(true);
}

export function afterTestTextInput(
  correct: boolean,
  inputOverride?: string,
  goingToNextWord = false,
): void {
  textInsertedEvent.dispatch(correct);

  let input = inputOverride ?? getCurrentInput();
  if (goingToNextWord) {
    input = input.replace(/ $/, "");
  }

  updateWordLetters(input);

  afterAnyTestInput("textInput", correct);
}

export function afterTestCompositionUpdate(): void {
  updateWordLetters(getCurrentInput());
  // correct needs to be true to get the normal click sound
  afterAnyTestInput("compositionUpdate", true);
}

export function afterTestDelete(): void {
  updateWordLetters(getCurrentInput());
  afterAnyTestInput("delete", null);
}

export function beforeTestWordChange(direction: "forward" | "back"): void {
  if (direction === "back") {
    updateWordLetters(getCurrentInput());
  }
}

export function afterTestWordChange(direction: "forward" | "back"): void {
  const activeWordIndex = getActiveWordIndex();
  if (direction === "forward") setWordTyped(activeWordIndex - 1, true);
  setWordTyped(activeWordIndex, false);
  setActiveWord(activeWordIndex, direction);

  highlightNextKey();

  if (direction === "back" && Config.mode === "zen") {
    truncateWords(activeWordIndex + 1);
  }
}
