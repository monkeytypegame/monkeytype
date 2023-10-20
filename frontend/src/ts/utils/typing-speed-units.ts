import { roundTo2 } from "../utils/misc";

class Unit implements MonkeyTypes.TypingSpeedUnitSettings {
  unit: MonkeyTypes.TypingSpeedUnit;
  convertFactor: number;
  fullUnitString: string;
  histogramDataBucketSize: number;
  historyStepSize: number;

  constructor(
    unit: MonkeyTypes.TypingSpeedUnit,
    convertFactor: number,
    fullUnitString: string,
    histogramDataBucketSize: number,
    historyStepSize: number
  ) {
    this.unit = unit;
    this.convertFactor = convertFactor;
    this.fullUnitString = fullUnitString;
    this.histogramDataBucketSize = histogramDataBucketSize;
    this.historyStepSize = historyStepSize;
  }

  fromWpm(wpm: number): number {
    return wpm * this.convertFactor;
  }

  toWpm(val: number): number {
    return val / this.convertFactor;
  }

  convertWithUnitSuffix(wpm: number, withDecimals: boolean): string {
    if (withDecimals) {
      return roundTo2(this.fromWpm(wpm)).toFixed(2) + " " + this.unit;
    } else {
      return Math.round(this.fromWpm(wpm)) + " " + this.unit;
    }
  }
}

const typingSpeedUnits: Record<MonkeyTypes.TypingSpeedUnit, Unit> = {
  wpm: new Unit("wpm", 1, "Words per Minute", 10, 10),
  cpm: new Unit("cpm", 5, "Characters per Minute", 50, 100),
  wps: new Unit("wps", 1 / 60, "Words per Second", 0.5, 2),
  cps: new Unit("cps", 5 / 60, "Characters per Second", 5, 5),
  wph: new Unit("wph", 60, "Words per Hour", 250, 1000),
};

export function get(
  unit: MonkeyTypes.TypingSpeedUnit
): MonkeyTypes.TypingSpeedUnitSettings {
  return typingSpeedUnits[unit];
}
