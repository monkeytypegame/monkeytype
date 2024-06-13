import * as DateTime from "../utils/date-and-time";
import * as DB from "../db";

let seconds = 0;
let addedAllToday = false;
let dayToday: number;

export function addSeconds(s: number): void {
  if (addedAllToday) {
    const nowDate = new Date().getDate();
    if (nowDate > dayToday) {
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
  const todayDate = new Date();
  todayDate.setSeconds(0);
  todayDate.setMinutes(0);
  todayDate.setHours(0);
  todayDate.setMilliseconds(0);
  dayToday = todayDate.getDate();
  const todayDateMS = todayDate.getTime();

  seconds = 0;
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  const results = snapshot.results;

  results?.forEach((result) => {
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
  });

  addedAllToday = true;
}
