import * as Misc from "../utils/misc";
import * as Numbers from "@monkeytype/util/numbers";
import { Config } from "../config/store";
import { getUserAverage10Once } from "../collections/results";
import { getCurrentQuote } from "../states/test";

let averageWPM = 0;
let averageAcc = 0;

export async function update(): Promise<void> {
  const mode2 = Misc.getMode2(Config, getCurrentQuote());

  const average = await getUserAverage10Once({ ...Config, mode2 });
  const wpm = Numbers.roundTo2(average.wpm);
  const acc = Numbers.roundTo2(average.acc);

  averageWPM = Config.alwaysShowDecimalPlaces ? wpm : Math.round(wpm);
  averageAcc = Config.alwaysShowDecimalPlaces ? acc : Math.floor(acc);
}

export function getWPM(): number {
  return averageWPM;
}

export function getAcc(): number {
  return averageAcc;
}
