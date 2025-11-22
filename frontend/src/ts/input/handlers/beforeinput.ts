import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as TestState from "../../test/test-state";
import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import { isAnyPopupVisible } from "../../utils/misc";
import { isSpace } from "../../utils/strings";
import { getInputValue } from "../core/input-element";
import { isAwaitingNextWord } from "../core/state";
import { onBeforeDelete } from "./beforedelete";
import { shouldInsertSpaceCharacter } from "../helpers/validation";
import { isSupportedInputType } from "../helpers/input-type";

// returns true if input should be blocked
export function onBeforeInsertText(data: string): boolean {
  if (TestState.testRestarting) {
    return true;
  }

  const { inputValue } = getInputValue();
  const dataIsSpace = isSpace(data);
  const shouldInsertSpaceAsCharacter = shouldInsertSpaceCharacter({
    data,
    inputValue,
    targetWord: TestWords.words.getCurrent(),
  });

  //prevent space from being inserted if input is empty
  //allow if strict space is enabled
  if (
    dataIsSpace &&
    inputValue === "" &&
    Config.difficulty === "normal" &&
    !Config.strictSpace
  ) {
    return true;
  }

  //prevent space in nospace funbox
  if (dataIsSpace && isFunboxActiveWithProperty("nospace")) {
    return true;
  }

  //only allow newlines if the test has newlines
  if (data === "\n" && !TestWords.hasNewline) {
    return true;
  }

  // space characters sometimes are inserted as a character, need this distinction
  const shouldInsertSpace = shouldInsertSpaceAsCharacter === true;

  // block input if the word is too long
  const inputLimit =
    Config.mode === "zen" ? 30 : TestWords.words.getCurrent().length + 20;
  const overLimit = TestInput.input.current.length >= inputLimit;
  if (overLimit && ((dataIsSpace && shouldInsertSpace) || !dataIsSpace)) {
    console.error("Hitting word limit");
    return true;
  }

  // prevent the word from jumping to the next line if the word is too long
  // this will not work for the first word of each line, but that has a low chance of happening
  // make sure to only check this when necessary (hide extra letters is off or input is longer than word)
  // because this check is expensive (causes layout reflows)

  const dataIsNotFalsy = data !== null && data !== "";
  const inputIsLongerThanOrEqualToWord =
    TestInput.input.current.length >= TestWords.words.getCurrent().length;
  const isSpaceAndShouldInsert =
    dataIsSpace && shouldInsertSpaceAsCharacter === true;

  if (
    dataIsNotFalsy &&
    !Config.blindMode &&
    !Config.hideExtraLetters &&
    inputIsLongerThanOrEqualToWord &&
    (isSpaceAndShouldInsert || !dataIsSpace) &&
    Config.mode !== "zen"
  ) {
    const topAfterAppend = TestUI.getActiveWordTopAfterAppend(data);
    const wordJumped = topAfterAppend > TestUI.activeWordTop;
    if (wordJumped) {
      return true;
    }
  }

  return false;
}

export async function handleBeforeInput(event: InputEvent): Promise<void> {
  // todo: this check might not be necessary because this function only fires
  // if wordsInput is focused
  const popupVisible = isAnyPopupVisible();
  if (popupVisible) {
    event.preventDefault();
    console.warn("Prevented beforeinput due to popup visibility");
    return;
  }

  if (!isSupportedInputType(event.inputType)) {
    event.preventDefault();
    return;
  }

  if (isAwaitingNextWord()) {
    event.preventDefault();
    return;
  }

  if (TestUI.resultCalculating) {
    event.preventDefault();
    return;
  }

  const inputType = event.inputType;

  if (
    (inputType === "insertText" && event.data !== null) ||
    inputType === "insertLineBreak"
  ) {
    let data = event.data as string;
    if (inputType === "insertLineBreak") {
      // insertLineBreak events dont have data set
      data = "\n";
    }

    const preventDefault = onBeforeInsertText(data);
    if (preventDefault) {
      event.preventDefault();
    }
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    onBeforeDelete(event);
  } else if (inputType === "insertCompositionText" && !event.isComposing) {
    // firefox fires this extra event which we dont want to handle
    event.preventDefault();
  } else {
    throw new Error("Unhandled beforeinput type: " + inputType);
  }
}
