import { __nonReactive } from "../collections/results";
import * as DateTime from "../utils/date-and-time";

let seconds = 0;
let addedAllToday = false;
// local midnight of the day being counted
let todayStart: number;

function startOfDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function addSeconds(s: number): void {
  if (addedAllToday) {
    const nowStart = startOfDay(Date.now());
    // a new day (or month, or year): count from this test
    if (nowStart > todayStart) {
      todayStart = nowStart;
      seconds = s;
      return;
    }
  }
  seconds += s;
}

export function getString(): string {
  const secString = DateTime.secondsToString(Math.round(seconds), true, true);
  return secString + (addedAllToday ? " today" : " session");
}

export function addAllFromToday(): void {
  todayStart = startOfDay(Date.now());
  const todayDateMS = todayStart;

  seconds = 0;
  const results = __nonReactive.getResults();

  for (const result of results) {
    const resultDate = new Date(result.timestamp);
    resultDate.setSeconds(0);
    resultDate.setMinutes(0);
    resultDate.setHours(0);
    resultDate.setMilliseconds(0);
    const resultDateMS = resultDate.getTime();

    if (resultDateMS >= todayDateMS) {
      seconds +=
        result.testDuration + result.incompleteTestSeconds - result.afkDuration;
    }
  }

  addedAllToday = true;
}
