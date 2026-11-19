import { createSignal } from "solid-js";

import { getSecondsTypedSinceOnce } from "../collections/results";
import * as DateTime from "../utils/date-and-time";

const [seconds, setSeconds] = createSignal(0);
// whether seconds started from today's saved results, not this session
const [addedAllToday, setAddedAllToday] = createSignal(false);
let dayToday: number;

/** A finished test's seconds (afk excluded). */
export function addSeconds(s: number): void {
  if (addedAllToday()) {
    const nowDate = new Date().getDate();
    if (nowDate > dayToday) {
      setSeconds(s);
      return;
    }
  }
  setSeconds((current) => current + s);
}

/** Time typed today (or this session, signed out), eg. "05:12 today". Reactive. */
export function getTimeTodayString(): string {
  const secString = DateTime.secondsToString(Math.round(seconds()), true, true);
  return secString + (addedAllToday() ? " today" : " session");
}

/** Starts the count from today's saved results (the results are loaded). */
export async function addAllFromToday(): Promise<void> {
  const todayDate = new Date();
  todayDate.setSeconds(0);
  todayDate.setMinutes(0);
  todayDate.setHours(0);
  todayDate.setMilliseconds(0);
  dayToday = todayDate.getDate();

  setSeconds(await getSecondsTypedSinceOnce(todayDate.getTime()));
  setAddedAllToday(true);
}
