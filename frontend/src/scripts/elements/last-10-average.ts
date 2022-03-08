import * as DB from "../db";
import * as Misc from "../misc";
import Config from "../config";
import * as TestWords from "../test/test-words";

let value = 0;

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
  value = wpm;
}

export function get(): number {
  return value;
}
