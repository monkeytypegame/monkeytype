import * as DB from "../db.js";
import * as Misc from "../utils/misc.js";
import * as Numbers from "../utils/numbers.js";
import Config from "../config.js";
import * as TestWords from "../test/test-words.js";

let averageWPM = 0;
let averageAcc = 0;

export async function update(): Promise<void> {
  const mode2 = Misc.getMode2(Config, TestWords.currentQuote);

  const [wpm, acc] = (
    await DB.getUserAverage10(
      Config.mode,
      mode2 as never,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode
    )
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
