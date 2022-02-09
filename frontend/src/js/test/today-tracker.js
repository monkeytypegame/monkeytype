import * as Misc from "../misc";
import * as DB from "../db";

let seconds = 0;
let addedAllToday = false;
let dayToday = null;

export function addSeconds(s) {
  if (addedAllToday) {
    let nowDate = new Date();
    nowDate = nowDate.getDate();
    if (nowDate > dayToday) {
      seconds = s;
      return;
    }
  }
  seconds += s;
}

export function getString() {
  let secString = Misc.secondsToString(Math.round(seconds), true, true);
  return secString + (addedAllToday === true ? " today" : " session");
}

export async function addAllFromToday() {
  let todayDate = new Date();
  todayDate.setSeconds(0);
  todayDate.setMinutes(0);
  todayDate.setHours(0);
  todayDate.setMilliseconds(0);
  dayToday = todayDate.getDate();
  todayDate = todayDate.getTime();

  seconds = 0;

  let results = await DB.getSnapshot().results;

  results.forEach((result) => {
    let resultDate = new Date(result.timestamp);
    resultDate.setSeconds(0);
    resultDate.setMinutes(0);
    resultDate.setHours(0);
    resultDate.setMilliseconds(0);
    resultDate = resultDate.getTime();

    if (resultDate >= todayDate) {
      seconds +=
        result.testDuration + result.incompleteTestSeconds - result.afkDuration;
    }
  });

  addedAllToday = true;
}
