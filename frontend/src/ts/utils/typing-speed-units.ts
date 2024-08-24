import { TypingSpeedUnit } from "@monkeytype/contracts/schemas/configs";

class Unit implements MonkeyTypes.TypingSpeedUnitSettings {
  unit: TypingSpeedUnit;
  convertFactor: number;
  fullUnitString: string;
  histogramDataBucketSize: number;
  historyStepSize: number;

  constructor(
    unit: TypingSpeedUnit,
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
}

const typingSpeedUnits: Record<TypingSpeedUnit, Unit> = {
  wpm: new Unit("wpm", 1, "Words per Minute", 10, 10),
  cpm: new Unit("cpm", 5, "Characters per Minute", 50, 100),
  wps: new Unit("wps", 1 / 60, "Words per Second", 0.5, 2),
  cps: new Unit("cps", 5 / 60, "Characters per Second", 5, 5),
  wph: new Unit("wph", 60, "Words per Hour", 250, 1000),
};

export function get(
  unit: TypingSpeedUnit
): MonkeyTypes.TypingSpeedUnitSettings {
  return typingSpeedUnits[unit];
}
