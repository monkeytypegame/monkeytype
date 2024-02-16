import * as Misc from "./misc";
import Config from "../config";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";

export function formatTypingSpeed(
  wpm: number | null | undefined,
  showDecimals?: boolean,
  fallback?: "-"
): string {
  if (wpm === undefined || wpm === null) return fallback ?? "";
  const result = getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(wpm);
  if (
    showDecimals !== undefined ? showDecimals : Config.alwaysShowDecimalPlaces
  ) {
    return Misc.roundTo2(result).toFixed(2);
  }
  return Math.round(result).toString();
}

export function formatPercentage(
  percentage: number | null | undefined,
  showDecimals?: boolean,
  fallback?: "-"
): string {
  if (percentage === undefined || percentage === null) return fallback ?? "";

  if (
    showDecimals !== undefined ? showDecimals : Config.alwaysShowDecimalPlaces
  ) {
    return Misc.roundTo2(percentage).toFixed(2) + "%";
  }
  return Math.round(percentage).toString() + "%";
}
