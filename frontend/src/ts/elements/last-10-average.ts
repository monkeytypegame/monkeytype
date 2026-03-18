import * as Misc from "../utils/misc";
import * as Numbers from "@monkeytype/util/numbers";
import { Config } from "../config/store";
import * as TestWords from "../test/test-words";
import { getUserAverage } from "../collections/results";

let averageWPM = 0;
let averageAcc = 0;

export async function update(): Promise<void> {
  const mode2 = Misc.getMode2(Config, TestWords.currentQuote);

  const [wpm, acc] = (
    await getUserAverage({ ...Config, mode2, last10Only: true })
  ).map(Numbers.roundTo2) as [number, number];

  averageWPM = Config.alwaysShowDecimalPlaces ? wpm : Math.round(wpm);
  averageAcc = Config.alwaysShowDecimalPlaces ? acc : Math.floor(acc);
}

export function getWPM(): number {
  return averageWPM;
}

export function getAcc(): number {
  return averageAcc;
}
