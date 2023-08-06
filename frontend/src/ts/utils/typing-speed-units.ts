import { roundTo2 } from "../utils/misc";
const typingSpeedUnits: Record<
  MonkeyTypes.TypingSpeedUnit,
  MonkeyTypes.TypingSpeedUnitSettings
> = {
  wpm: {
    fromWpm: (wpm: number) => wpm,
    toWpm: (wpm: number) => wpm,
    convertWithUnitSuffix: (wpm: number) => {
      return convertTypingSpeedWithUnitSuffix("wpm", wpm);
    },

    fullUnitString: "Words per Minute",
    histogramDataBucketSize: 10,
    historyStepSize: 10,
  },
  cpm: {
    fromWpm: (wpm: number) => wpm * 5,
    toWpm: (cpm: number) => cpm / 5,
    convertWithUnitSuffix: (wpm: number) => {
      return convertTypingSpeedWithUnitSuffix("cpm", wpm);
    },
    fullUnitString: "Characters per Minute",
    histogramDataBucketSize: 50,
    historyStepSize: 100,
  },
  wps: {
    fromWpm: (wpm: number) => wpm / 60,
    toWpm: (wps: number) => wps * 60,
    convertWithUnitSuffix: (wpm: number) => {
      return convertTypingSpeedWithUnitSuffix("wps", wpm);
    },
    fullUnitString: "Words per Second",
    histogramDataBucketSize: 0.5,
    historyStepSize: 2,
  },
  cps: {
    fromWpm: (wpm: number) => (wpm * 5) / 60,
    toWpm: (cps: number) => (cps * 60) / 5,
    convertWithUnitSuffix: (wpm: number) => {
      return convertTypingSpeedWithUnitSuffix("cps", wpm);
    },
    fullUnitString: "Characters per Second",
    histogramDataBucketSize: 5,
    historyStepSize: 5,
  },
  wph: {
    fromWpm: (wpm: number) => wpm * 60,
    toWpm: (wph: number) => wph / 60,
    convertWithUnitSuffix: (wpm: number) => {
      return convertTypingSpeedWithUnitSuffix("wph", wpm);
    },

    fullUnitString: "Words per Hour",
    histogramDataBucketSize: 60,
    historyStepSize: 1000,
  },
};

export function get(
  unit: MonkeyTypes.TypingSpeedUnit
): MonkeyTypes.TypingSpeedUnitSettings {
  return typingSpeedUnits[unit];
}

function convertTypingSpeedWithUnitSuffix(
  unit: MonkeyTypes.TypingSpeedUnit,
  wpm: number
): string {
  return roundTo2(get(unit).fromWpm(wpm)).toFixed(2) + " " + unit;
}
