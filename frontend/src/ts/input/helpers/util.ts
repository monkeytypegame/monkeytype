import { isFunboxActiveWithProperty } from "../../test/funbox/active";
import { isSpace } from "../../utils/strings";

export function isCommitCharacter(options: {
  data: string;
  inputValue: string;
  targetWord: string;
}): boolean {
  const { data, inputValue, targetWord } = options;

  if (isSpace(data)) {
    return true;
  }

  if (data === "\n") {
    return true;
  }

  const nospace = isFunboxActiveWithProperty("nospace");

  if (nospace && (inputValue + data).length === targetWord.length) {
    return true;
  }

  return false;
}
