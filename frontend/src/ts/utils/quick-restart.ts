import { CustomTextSettings } from "@monkeytype/schemas/results";

export function canQuickRestart(
  mode: string,
  words: number,
  time: number,
  customText: CustomTextSettings,
  customTextIsLong: boolean,
): boolean {
  const wordsLong = mode === "words" && (words >= 1000 || words === 0);
  const timeLong = mode === "time" && (time >= 900 || time === 0);
  const customTextLong = mode === "custom" && customTextIsLong;

  const customTextRandomWordsLong =
    mode === "custom" &&
    (customText.limit.mode === "word" || customText.limit.mode === "section") &&
    (customText.limit.value >= 1000 || customText.limit.value === 0);
  const customTextRandomTimeLong =
    mode === "custom" &&
    customText.limit.mode === "time" &&
    (customText.limit.value >= 900 || customText.limit.value === 0);

  if (
    wordsLong ||
    timeLong ||
    customTextLong ||
    customTextRandomWordsLong ||
    customTextRandomTimeLong
  ) {
    return false;
  } else {
    return true;
  }
}
