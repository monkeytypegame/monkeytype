import { Config } from "../config/store";
import britishEnglishReplacements from "../constants/british-english";
import { capitalizeFirstLetterOfEachWord } from "../utils/strings";

export function replace(
  word: string,
  previousWord: string | undefined,
): string {
  // Convert American-style double quotes to British-style single quotes
  if (word.includes('"')) {
    word = word.replace(/"/g, "'");
  }

  if (word.includes("-")) {
    //this handles hyphenated words (for example "cream-colored") to make sure
    //we don't have to add every possible combination to the list
    return word
      .split("-")
      .map((wordPart) => replace(wordPart, previousWord))
      .join("-");
  } else {
    const cleanedWord = word.replace(/^[\W]+|[\W]+$/g, "").toLowerCase();
    if (
      !Object.prototype.hasOwnProperty.call(
        britishEnglishReplacements,
        cleanedWord,
      )
    ) {
      return word;
    }
    const rule = britishEnglishReplacements[cleanedWord];

    if (rule === undefined) return word;

    const [britishWord, exceptions] =
      typeof rule === "string"
        ? [rule, []]
        : [rule.britishWord, rule.exceptPreviousWords];

    if (
      Config.mode === "quote" &&
      previousWord !== undefined &&
      exceptions.includes(previousWord)
    ) {
      return word;
    }

    return word.replace(
      RegExp(`^(?:([\\W]*)(${cleanedWord})([\\W]*))$`, "gi"),
      (_, $1, $2, $3) =>
        $1 +
        // oxlint-disable-next-line typescript/prefer-string-starts-ends-with
        (($2 as string).charAt(0) === ($2 as string).charAt(0).toUpperCase()
          ? $2 === ($2 as string).toUpperCase()
            ? britishWord.toUpperCase()
            : capitalizeFirstLetterOfEachWord(britishWord)
          : britishWord) +
        $3,
    );
  }
}
