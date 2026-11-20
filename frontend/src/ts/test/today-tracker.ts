import { createSignal } from "solid-js";

import { getSecondsTypedSinceOnce } from "../collections/results";
import * as DateTime from "../utils/date-and-time";

const [seconds, setSeconds] = createSignal(0);
// whether seconds started from today's saved results, not this session
const [addedAllToday, setAddedAllToday] = createSignal(false);
// local midnight of the day being counted
let todayStart: number;

function startOfDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** A finished test's seconds (afk excluded). */
export function addSeconds(s: number): void {
  if (addedAllToday()) {
    const nowStart = startOfDay(Date.now());
    // a new day (or month, or year): count from this test
    if (nowStart > todayStart) {
      todayStart = nowStart;
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
  todayStart = startOfDay(Date.now());
  setSeconds(await getSecondsTypedSinceOnce(todayStart));
  setAddedAllToday(true);
}
