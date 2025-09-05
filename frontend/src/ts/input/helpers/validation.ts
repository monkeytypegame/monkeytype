import Config from "../../config";
import * as TestWords from "../../test/test-words";
import * as TestState from "../../test/test-state";
import * as TestInput from "../../test/test-input";
import { findSingleActiveFunboxWithFunction } from "../../test/funbox/list";
import { isSpace } from "../../utils/strings";

export function isCharCorrect(data: string, inputValue: string): boolean {
  if (Config.mode === "zen") return true;

  if (data === "\n") {
    inputValue += "\n";
  }

  const index = inputValue.length - 1;

  const targetWord = TestWords.words.get(TestState.activeWordIndex);

  const input = inputValue[index];
  const target = targetWord[index];

  if (replaceSpaceLikeCharacters(inputValue) === targetWord + " ") {
    return true;
  }

  if (input === undefined) {
    return false;
  }

  if (target === undefined) {
    return false;
  }

  if (target === input) {
    return true;
  }

  const funbox = findSingleActiveFunboxWithFunction("isCharCorrect");
  if (funbox) {
    return funbox.functions.isCharCorrect(input, target);
  }

  if (Config.language.startsWith("russian")) {
    if (
      (input === "ё" || input === "е" || input === "e") &&
      (target === "ё" || target === "е" || target === "e")
    ) {
      return true;
    }
  }

  if (
    (input === "’" ||
      input === "‘" ||
      input === "'" ||
      input === "ʼ" ||
      input === "׳" ||
      input === "ʻ") &&
    (target === "’" ||
      target === "‘" ||
      target === "'" ||
      target === "ʼ" ||
      target === "׳" ||
      target === "ʻ")
  ) {
    return true;
  }

  if (
    (input === `"` || input === "”" || input === "“" || input === "„") &&
    (target === `"` || target === "”" || target === "“" || target === "„")
  ) {
    return true;
  }

  if (
    (input === "–" || input === "—" || input === "-") &&
    (target === "-" || target === "–" || target === "—")
  ) {
    return true;
  }

  return false;
}

// boolean if data is space, null if not
export function shouldInsertSpaceCharacter(data: string): boolean | null {
  if (!isSpace(data)) {
    return null;
  }
  const correctSoFar = (TestWords.words.getCurrent() + " ").startsWith(
    TestInput.input.current + " "
  );
  const stopOnErrorLetterAndIncorrect =
    Config.stopOnError === "letter" && !correctSoFar;
  const stopOnErrorWordAndIncorrect =
    Config.stopOnError === "word" && !correctSoFar;
  const strictSpace =
    TestInput.input.current.length === 0 && Config.strictSpace;
  const incorrectAndNotNormalDifficulty =
    !correctSoFar && Config.difficulty !== "normal";
  return (
    stopOnErrorLetterAndIncorrect ||
    stopOnErrorWordAndIncorrect ||
    strictSpace ||
    incorrectAndNotNormalDifficulty
  );
}
