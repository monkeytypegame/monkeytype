import { isResultWordsJoiningScript } from "../../../../states/result";
import { isLanguageRightToLeft } from "../../../../states/test";
import { cn } from "../../../../utils/cn";

// shared by the words history and the replay

export function wordsClass(): string {
  return cn("words flex w-full flex-wrap content-start", {
    "[direction:rtl]": isLanguageRightToLeft(),
    "[&_.word]:pb-[2px] [&_.word]:[overflow-wrap:anywhere] [&_letter]:inline":
      isResultWordsJoiningScript(),
  });
}

export const wordClass =
  "word relative mt-[0.18rem] mr-[0.6rem] mb-[0.15rem] ml-0";

export function letterClass(letter: {
  state?: "" | "correct" | "corrected" | "incorrect";
  extra?: boolean;
  extraCorrected?: boolean;
}): string {
  return cn({
    "text-text": letter.state === "correct" || letter.state === "corrected",
    "text-error": letter.state === "incorrect",
    "text-error-extra": letter.state === "incorrect" && letter.extra,
    "border-b-2 border-dotted border-main": letter.state === "corrected",
    "border-r-2 border-dotted border-main": letter.extraCorrected,
  });
}
