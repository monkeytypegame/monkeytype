import {
  isJoiningScript,
  isLanguageRightToLeft,
} from "../../../../states/test";
import { cn } from "../../../../utils/cn";
import type { WordStatus } from "../Word";

// shared by the words history and the replay

export function wordsClass(): string {
  return cn("words flex w-full flex-wrap content-start", {
    "[direction:rtl]": isLanguageRightToLeft(),
    "[&_.word]:pb-[2px] [&_.word]:[overflow-wrap:anywhere] [&_letter]:inline":
      isJoiningScript(),
  });
}

export const wordClass =
  "word relative mt-[0.18rem] mr-[0.6rem] mb-[0.15rem] ml-0";

type ResultLetter = {
  state?: "" | "correct" | "corrected" | "incorrect";
  extra?: boolean;
  extraCorrected?: boolean;
};

export type ResultLetterStatus = "untyped" | "correct" | "incorrect" | "extra";

function letterStatus(letter: ResultLetter): ResultLetterStatus {
  if (letter.extra) return "extra";
  if (letter.state === "incorrect") return "incorrect";
  if (letter.state === "correct" || letter.state === "corrected") {
    return "correct";
  }
  return "untyped";
}

function letterCorrections(letter: ResultLetter): string | undefined {
  const corrections = [];
  if (letter.state === "corrected") corrections.push("corrected");
  if (letter.extraCorrected) corrections.push("extraCorrected");
  return corrections.length > 0 ? corrections.join(" ") : undefined;
}

/** The theme-facing data-ui-* attributes of a result letter. */
export function letterAttributes(letter: ResultLetter): {
  "data-ui-element": "letter";
  "data-ui-state": ResultLetterStatus;
  "data-ui-corrections": string | undefined;
} {
  return {
    "data-ui-element": "letter",
    "data-ui-state": letterStatus(letter),
    "data-ui-corrections": letterCorrections(letter),
  };
}

type ResultWord = {
  // committed with space or newline
  typed: boolean;
  error: boolean;
};

/** The theme-facing data-ui-* attributes of a result word, as the test's. */
export function wordAttributes(word: ResultWord): {
  "data-ui-element": "word";
  "data-ui-state": WordStatus;
} {
  let status: WordStatus = "untyped";
  if (word.error) status = "typedIncorrectly";
  else if (word.typed) status = "typed";
  return { "data-ui-element": "word", "data-ui-state": status };
}

export function letterClass(letter: ResultLetter): string {
  return cn({
    "text-text": letter.state === "correct" || letter.state === "corrected",
    "text-error": letter.state === "incorrect",
    "text-error-extra": letter.state === "incorrect" && letter.extra,
    "border-b-2 border-dotted border-main": letter.state === "corrected",
    "border-r-2 border-dotted border-main": letter.extraCorrected,
  });
}
