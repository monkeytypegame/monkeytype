import * as Misc from "./misc";
import Config from "../config";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";

export type FormatOptions = {
  showDecimalPlaces?: boolean;
  suffix?: string;
  fallback?: string;
};

const FORMAT_DEFAULT_OPTIONS: FormatOptions = {
  suffix: "",
  fallback: "-",
};

export function typingSpeed(
  wpm: number | null | undefined,
  formatOptions: FormatOptions = FORMAT_DEFAULT_OPTIONS
): string {
  const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
  if (wpm === undefined || wpm === null) return options.fallback ?? "";

  const result = getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(wpm);

  return decimals(result, options);
}

export function percentage(
  percentage: number | null | undefined,
  formatOptions: FormatOptions = FORMAT_DEFAULT_OPTIONS
): string {
  const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
  options.suffix = "%" + (options.suffix ?? "");

  return decimals(percentage, options);
}

export function decimals(
  value: number | null | undefined,
  formatOptions: FormatOptions
): string {
  if (value === undefined || value === null)
    return formatOptions.fallback ?? "";

  if (
    formatOptions.showDecimalPlaces !== undefined
      ? formatOptions.showDecimalPlaces
      : Config.alwaysShowDecimalPlaces
  ) {
    return Misc.roundTo2(value).toFixed(2) + (formatOptions.suffix ?? "");
  }
  return Math.round(value).toString() + (formatOptions.suffix ?? "");
}
