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
  showDecimalPlaces: undefined,
};

export class Formatting {
  constructor(private config: SharedTypes.Config) {}

  typingSpeed(
    wpm: number | null | undefined,
    formatOptions: FormatOptions = FORMAT_DEFAULT_OPTIONS
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    if (wpm === undefined || wpm === null) return options.fallback ?? "";

    const result = getTypingSpeedUnit(this.config.typingSpeedUnit).fromWpm(wpm);

    return this.number(result, options);
  }
  percentage(
    percentage: number | null | undefined,
    formatOptions: FormatOptions = {}
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    options.suffix = "%" + (options.suffix ?? "");

    return this.number(percentage, options);
  }

  decimals(
    value: number | null | undefined,
    formatOptions: FormatOptions = {}
  ): string {
    const options = { ...FORMAT_DEFAULT_OPTIONS, ...formatOptions };
    return this.number(value, options);
  }
  private number(
    value: number | null | undefined,
    formatOptions: FormatOptions
  ): string {
    if (value === undefined || value === null)
      return formatOptions.fallback ?? "";
    const suffix = formatOptions.suffix ?? "";

    if (
      formatOptions.showDecimalPlaces !== undefined
        ? formatOptions.showDecimalPlaces
        : this.config.alwaysShowDecimalPlaces
    ) {
      return Misc.roundTo2(value).toFixed(2) + suffix;
    }
    return Math.round(value).toString() + suffix;
  }
}

export default new Formatting(Config);
