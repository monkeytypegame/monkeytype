import Config from "../../config";
import * as TestInput from "../../test/test-input";
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

export function onBeforeInsertText(data: string): boolean {
  let preventDefault = false;

  const { inputValue } = getInputValue();

  //prevent space from being inserted if input is empty
  //allow if strict space is enabled
  if (
    isSpace(data) &&
    inputValue === "" &&
    Config.difficulty === "normal" &&
    !Config.strictSpace
  ) {
    preventDefault = true;
  }

  //prevent space in nospace funbox
  if (isSpace(data) && isFunboxActiveWithProperty("nospace")) {
    preventDefault = true;
  }

  // we need this here because space characters sometimes need to be blocked,
  // while space skips to next word shouldnt
  const shouldInsertSpace = shouldInsertSpaceCharacter(data) === true;

  //prevent the word from jumping to the next line if the word is too long
  //this will not work for the first word of each line, but that has a low chance of happening

  const topAfterAppend = TestUI.getActiveWordTopAfterAppend(data);
  const wordJumped = topAfterAppend > TestUI.activeWordTop;
  if (
    data !== null &&
    data !== "" &&
    ((isSpace(data) && shouldInsertSpace) || !isSpace(data)) &&
    TestInput.input.current.length >= TestWords.words.getCurrent().length &&
    wordJumped &&
    Config.mode !== "zen"
  ) {
    return true;
  }

  // block input if the word is too long
  const inputLimit =
    Config.mode === "zen" ? 30 : TestWords.words.getCurrent().length + 20;
  const overLimit = TestInput.input.current.length >= inputLimit;
  if (overLimit && ((isSpace(data) && shouldInsertSpace) || !isSpace(data))) {
    console.error("Hitting word limit");
    preventDefault = true;
  }

  return preventDefault;
}

export async function handleBeforeInput(event: InputEvent): Promise<void> {
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
  // const now = performance.now();

  if (inputType === "insertText" && event.data !== null) {
    const preventDefault = onBeforeInsertText(event.data);
    if (preventDefault) {
      event.preventDefault();
    }
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    onBeforeDelete(event);
  }
}
