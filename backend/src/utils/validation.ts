import _ from "lodash";
import { CompletedEvent } from "@monkeytype/contracts/schemas/results";

export function isTestTooShort(result: CompletedEvent): boolean {
  const { mode, mode2, customText, testDuration, bailedOut } = result;

  if (mode === "time") {
    const seconds = parseInt(mode2);

    const setTimeTooShort = seconds > 0 && seconds < 15;
    const infiniteTimeTooShort = seconds === 0 && testDuration < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return setTimeTooShort || infiniteTimeTooShort || bailedOutTooShort;
  }

  if (mode === "words") {
    const wordCount = parseInt(mode2);

    const setWordTooShort = wordCount > 0 && wordCount < 10;
    const infiniteWordTooShort = wordCount === 0 && testDuration < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return setWordTooShort || infiniteWordTooShort || bailedOutTooShort;
  }

  if (mode === "custom") {
    if (!customText) return true;
    const wordLimitTooShort =
      (customText.limit.mode === "word" ||
        customText.limit.mode === "section") &&
      customText.limit.value < 10;
    const timeLimitTooShort =
      customText.limit.mode === "time" && customText.limit.value < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return wordLimitTooShort || timeLimitTooShort || bailedOutTooShort;
  }

  if (mode === "zen") {
    return testDuration < 15;
  }

  return false;
}
