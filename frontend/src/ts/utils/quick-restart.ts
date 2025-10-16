import { CustomTextSettings } from "../test/custom-text";

export function canQuickRestart(
  mode: string,
  words: number,
  time: number,
  CustomText: CustomTextSettings,
  customTextIsLong: boolean
): boolean {
  const wordsLong = mode === "words" && (words >= 1000 || words === 0);
  const timeLong = mode === "time" && (time >= 900 || time === 0);
  const customTextLong = mode === "custom" && customTextIsLong;

  const customTextRandomWordsLong =
    mode === "custom" &&
    (CustomText.limit.mode === "word" || CustomText.limit.mode === "section") &&
    (CustomText.limit.value >= 1000 || CustomText.limit.value === 0);
  const customTextRandomTimeLong =
    mode === "custom" &&
    CustomText.limit.mode === "time" &&
    (CustomText.limit.value >= 900 || CustomText.limit.value === 0);

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
