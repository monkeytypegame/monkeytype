import _ from "lodash";
import profanities from "../constants/profanities";

export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function isUsernameValid(name: string): boolean {
  if (_.isNil(name) || !inRange(name.length, 1, 14)) {
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

  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

export function isTagPresetNameValid(name: string): boolean {
  if (_.isNil(name) || !inRange(name.length, 1, 16)) {
    return false;
  }

  return /^[0-9a-zA-Z_.-]+$/.test(name);
}
