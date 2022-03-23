import * as DB from "../db";
import * as Misc from "../utils/misc";
import Config from "../config";
import * as TestWords from "../test/test-words";

let averageWPM = 0;
let averageAcc = 0;

export async function update(): Promise<void> {
  const mode2 = Misc.getMode2(Config, TestWords.randomQuote);
  let wpm = await DB.getUserAverageWpm10(
    Config.mode,
    mode2 as never,
    Config.punctuation,
    Config.language,
    Config.difficulty,
    Config.lazyMode
  );
  wpm = Misc.roundTo2(wpm);
  if (!Config.alwaysShowDecimalPlaces) wpm = Math.round(wpm);
  averageWPM = wpm;

  let acc = await DB.getUserAverageAcc10(
    Config.mode,
    mode2 as never,
    Config.punctuation,
    Config.language,
    Config.difficulty,
    Config.lazyMode
  );
  acc = Misc.roundTo2(acc);
  if (!Config.alwaysShowDecimalPlaces) acc = Math.round(acc);
  averageAcc = acc;
}

export function getWPM(): number {
  return averageWPM;
}

export function getAcc(): number {
  return averageAcc;
}
