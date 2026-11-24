import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as Numbers from "@monkeytype/util/numbers";
import { getConfig } from "../config/store";

export type FormatOptions = {
  showDecimalPlaces?: boolean;
  suffix?: string;
  rounding?: (val: number) => number;
} & FallbackOptions;

const FORMAT_DEFAULT_OPTIONS: FormatOptions = {
  suffix: "",
  fallback: "-",
  showDecimalPlaces: undefined,
  rounding: Math.round,
};

export type FallbackOptions = {
  fallback?: string;
};

// Formatters read the config store: always current, and reactive when called
// in a tracking scope.

export function formatTypingSpeed(
  wpm: number | null | undefined,
  formatOptions: FormatOptions = {},
): string {
  const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
  if (wpm === undefined || wpm === null) return options.fallback ?? "";

  const result = getTypingSpeedUnit(getConfig.typingSpeedUnit).fromWpm(wpm);

  return number(result, options);
}

export function formatPercentage(
  percentage: number | null | undefined,
  formatOptions: FormatOptions = {},
): string {
  const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
  options.suffix = `%${options.suffix ?? ""}`;

  return number(percentage, options);
}

export function formatAccuracy(
  accuracy: number | null | undefined,
  formatOptions: FormatOptions = {},
): string {
  return formatPercentage(accuracy, {
    rounding: Math.floor,
    ...formatOptions,
  });
}

export function formatDecimals(
  value: number | null | undefined,
  formatOptions: FormatOptions = {},
): string {
  const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
  return number(value, options);
}

function number(
  value: number | null | undefined,
  formatOptions: FormatOptions,
): string {
  if (value === undefined || value === null) {
    return formatOptions.fallback ?? "";
  }
  const suffix = formatOptions.suffix ?? "";

  if (formatOptions.showDecimalPlaces ?? getConfig.alwaysShowDecimalPlaces) {
    return Numbers.roundTo2(value).toFixed(2) + suffix;
  }
  return (formatOptions.rounding ?? Math.round)(value).toString() + suffix;
}

export function formatRank(
  position: number | null | undefined,
  formatOptions: FallbackOptions = {},
): string {
  const options = { fallback: "-", ...formatOptions };

  if (position === undefined || position === null) {
    return options.fallback ?? "";
  }
  let numend = "th";
  const t = position % 10;
  const h = position % 100;
  if (t === 1 && h !== 11) {
    numend = "st";
  }
  if (t === 2 && h !== 12) {
    numend = "nd";
  }
  if (t === 3 && h !== 13) {
    numend = "rd";
  }
  return position + numend;
}
