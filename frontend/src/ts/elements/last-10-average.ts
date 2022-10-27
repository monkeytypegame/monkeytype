import * as DB from "../db";
import * as Misc from "../utils/misc";
import Config from "../config";
import * as TestWords from "../test/test-words";

let averageWPM = 0;
let averageAcc = 0;

export async function update(): Promise<void> {
  const mode2 = Misc.getMode2(Config, TestWords.randomQuote);

  const average = await DB.getUserAverage10(
    Config.mode,
    mode2 as never,
    Config.punctuation,
    Config.language,
    Config.difficulty,
    Config.lazyMode
  );
  const [wpm, acc] = average.map((element) => Misc.roundTo2(element));

  averageWPM = Config.alwaysShowDecimalPlaces ? wpm : Math.round(wpm);
  averageAcc = Config.alwaysShowDecimalPlaces ? acc : Math.floor(acc);
}

export function getWPM(): number {
  return averageWPM;
}

export function getAcc(): number {
  return averageAcc;
}
