import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import { isSpace } from "../../utils/strings";

/**
 * What kind of commit a character triggers, or false if it does not commit.
 * - "separator": a space or newline that ends the current word
 * - "nospace": the final letter of a word in a nospace funbox
 */
export type CommitCharacterType = "separator" | "nospace";

export function getCommitCharacterType(options: {
  data: string;
  inputValue: string;
  targetWord: string;
}): CommitCharacterType | false {
  const { data, inputValue, targetWord } = options;

  if (isSpace(data)) {
    return "separator";
  }

  if (data === "\n") {
    return "separator";
  }

  const nospace = isFunboxActiveWithProperty("nospace");

  if (nospace && (inputValue + data).length === targetWord.length) {
    return "nospace";
  }

  return false;
}
