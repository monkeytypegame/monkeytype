import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as Numbers from "@monkeytype/util/numbers";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import Config from "../config";

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

export class Formatting {
  private config: ConfigType;
  constructor(config: ConfigType) {
    this.config = config;
  }

  typingSpeed(
    wpm: number | null | undefined,
    formatOptions: FormatOptions = {},
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    if (wpm === undefined || wpm === null) return options.fallback ?? "";

    const result = getTypingSpeedUnit(this.config.typingSpeedUnit).fromWpm(wpm);

    return this.number(result, options);
  }

  percentage(
    percentage: number | null | undefined,
    formatOptions: FormatOptions = {},
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    options.suffix = "%" + (options.suffix ?? "");

    return this.number(percentage, options);
  }

  accuracy(
    accuracy: number | null | undefined,
    formatOptions: FormatOptions = {},
  ): string {
    return this.percentage(accuracy, {
      rounding: Math.floor,
      ...formatOptions,
    });
  }

  decimals(
    value: number | null | undefined,
    formatOptions: FormatOptions = {},
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    return this.number(value, options);
  }

  private number(
    value: number | null | undefined,
    formatOptions: FormatOptions,
  ): string {
    if (value === undefined || value === null) {
      return formatOptions.fallback ?? "";
    }
    const suffix = formatOptions.suffix ?? "";

    if (
      formatOptions.showDecimalPlaces ??
      this.config.alwaysShowDecimalPlaces
    ) {
      return Numbers.roundTo2(value).toFixed(2) + suffix;
    }
    return (formatOptions.rounding ?? Math.round)(value).toString() + suffix;
  }

  rank(
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
}

export default new Formatting(Config);
