import _ from "lodash";
import { replaceHomoglyphs } from "../constants/homoglyphs";
import { profanities, regexProfanities } from "../constants/profanities";
import { matchesAPattern, sanitizeString } from "./misc";

export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

const VALID_NAME_PATTERN = /^[\da-zA-Z_.-]+$/;

export function isUsernameValid(name: string): boolean {
  if (_.isNil(name) || !inRange(name.length, 1, 16)) {
    return false;
  }

  const normalizedName = name.toLowerCase();

  const beginsWithPeriod = /^\..*/.test(normalizedName);
  if (beginsWithPeriod) {
    return false;
  }

  const isProfanity = profanities.find((profanity) =>
    normalizedName.includes(profanity)
  );
  if (isProfanity) {
    return false;
  }

  return VALID_NAME_PATTERN.test(name);
}

export function containsProfanity(text: string): boolean {
  const normalizedText = text
    .toLowerCase()
    .split(/[.,"/#!?$%^&*;:{}=\-_`~()\s\n]+/g)
    .map((str) => {
      return replaceHomoglyphs(sanitizeString(str) ?? "");
    });

  const hasProfanity = regexProfanities.some((profanity) => {
    return normalizedText.some((word) => {
      return matchesAPattern(word, profanity);
    });
  });

  return hasProfanity;
}

export function isTagPresetNameValid(name: string): boolean {
  if (_.isNil(name) || !inRange(name.length, 1, 16)) {
    return false;
  }

  return VALID_NAME_PATTERN.test(name);
}

export function isTestTooShort(result: MonkeyTypes.CompletedEvent): boolean {
  const { mode, mode2, customText, testDuration, bailedOut } = result;

  if (mode === "time") {
    const setTimeTooShort = mode2 > 0 && mode2 < 15;
    const infiniteTimeTooShort = mode2 === 0 && testDuration < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return setTimeTooShort || infiniteTimeTooShort || bailedOutTooShort;
  }

  if (mode === "words") {
    const setWordTooShort = mode2 > 0 && mode2 < 10;
    const infiniteWordTooShort = mode2 === 0 && testDuration < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return setWordTooShort || infiniteWordTooShort || bailedOutTooShort;
  }

  if (mode === "custom") {
    if (!customText) return true;
    const { isWordRandom, isTimeRandom, textLen, word, time } = customText;
    const setTextTooShort =
      !isWordRandom && !isTimeRandom && _.isNumber(textLen) && textLen < 10;
    const randomWordsTooShort = isWordRandom && !isTimeRandom && word < 10;
    const randomTimeTooShort = !isWordRandom && isTimeRandom && time < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return (
      setTextTooShort ||
      randomWordsTooShort ||
      randomTimeTooShort ||
      bailedOutTooShort
    );
  }

  if (mode === "zen") {
    return testDuration < 15;
  }

  return false;
}
