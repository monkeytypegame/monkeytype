import { UTCDateMini } from "@date-fns/utc/date/mini";
import {
  addDays,
  Day,
  differenceInDays,
  differenceInWeeks,
  eachMonthOfInterval,
  endOfMonth,
  endOfYear,
  format,
  isBefore,
  isSameDay,
  nextDay,
  previousDay,
  startOfDay,
  startOfMonth,
  startOfYear,
  subWeeks,
} from "date-fns";
import { TestActivity } from "@monkeytype/schemas/users";
import { createMemo, createRoot, createSignal } from "solid-js";

import Ape from "../ape";
import { createEffectOn } from "../hooks/effects";
import { getUserData } from "../queries/user";
import { hideLoaderBar, showLoaderBar } from "./loader-bar";
import { DeepReadonly } from "../utils/types";
import { showErrorNotification } from "./notifications";

/** Tests on one UTC day; `date` is the start of that day in UTC. */
export type TestActivityDay = {
  date: Date;
  tests: number;
};

/** The days shown by one calendar, from `start` to `end` (UTC days). */
export type TestActivityCalendar = {
  start: Date;
  end: Date;
  firstDayOfWeek: Day;
  /** One entry per day from `start` to `end`. */
  days: TestActivityDay[];
};

export type TestActivityLevel = "filler" | "0" | "1" | "2" | "3" | "4";

export type TestActivityCell = {
  level: TestActivityLevel;
  label?: string;
};

export type TestActivityMonth = {
  text: string;
  weeks: number;
};

// --- State ---

/**
 * The signed-in user's activity: sorted by date, one entry per day the server
 * has data for. Seeded from the user query, past years merged in on demand.
 */
export const [getTestActivity, setTestActivity] = createSignal<
  TestActivityDay[] | undefined
>(undefined);

// past years are downloaded once per seed
let allYearsLoaded = false;

/** Replaces the activity with the user's. */
export function initTestActivity(activity: DeepReadonly<TestActivity>): void {
  allYearsLoaded = false;
  setTestActivity(toTestActivityDays(activity));
}

export function clearTestActivity(): void {
  allYearsLoaded = false;
  setTestActivity(undefined);
}

/** Counts a test finished at `timestamp`; no-op without activity. */
export function incrementTestActivity(timestamp: number | Date): void {
  const days = getTestActivity();
  if (days === undefined) return;

  const date = startOfDay(new UTCDateMini(timestamp));
  const last = days[days.length - 1];

  if (last !== undefined && isSameDay(date, last.date)) {
    setTestActivity([
      ...days.slice(0, -1),
      { date: last.date, tests: last.tests + 1 },
    ]);
    return;
  }
  if (last !== undefined && isBefore(date, last.date)) {
    throw new Error("cannot alter data in the past.");
  }

  const added: TestActivityDay[] = [];
  if (last !== undefined) {
    const missedDays = differenceInDays(date, last.date) - 1;
    for (let i = 1; i <= missedDays; i++) {
      added.push({ date: addDays(last.date, i), tests: 0 });
    }
  }
  added.push({ date, tests: 1 });
  setTestActivity([...days, ...added]);
}

/**
 * Downloads the past years (premium) once and merges them into the activity.
 * The current year comes from the user. Returns false if the download failed.
 */
export async function loadAllYearsTestActivity(): Promise<boolean> {
  if (allYearsLoaded) return true;
  if (getTestActivity() === undefined) return false;

  showLoaderBar();
  const response = await Ape.users.getTestActivity();
  hideLoaderBar();
  if (response.status !== 200) {
    showErrorNotification("Error getting test activities", { response });
    return false;
  }

  // the user may have signed out meanwhile
  const days = getTestActivity();
  if (days === undefined) return false;

  const currentYear = getCurrentYear();
  const byDay = new Map<number, TestActivityDay>();
  for (const year in response.body.data) {
    if (parseInt(year) === currentYear) continue;
    const testsByDays = response.body.data[year] ?? [];
    const start = new UTCDateMini(Date.UTC(parseInt(year), 0, 1));
    testsByDays.forEach((tests, i) => {
      const date = addDays(start, i);
      byDay.set(date.valueOf(), { date, tests: tests ?? 0 });
    });
  }
  // the user's days have this session's tests
  for (const day of days) byDay.set(day.date.valueOf(), day);

  allYearsLoaded = true;
  setTestActivity([...byDay.values()].sort((a, b) => +a.date - +b.date));
  return true;
}

// Seeds the activity from the user query: on load, on sign out. The state
// keeps its own copy as this session's tests and the past years are added
// here only; the user query keeps the activity as downloaded. Reseeds (and
// drops this session's tests) whenever the query's `testActivity` changes, so
// writes to the user query must leave it untouched.
createRoot(() => {
  const userActivity = createMemo(() => getUserData()?.testActivity);
  createEffectOn(userActivity, (activity) => {
    if (activity === undefined) {
      clearTestActivity();
    } else {
      initTestActivity(activity);
    }
  });
});

// --- Calendars ---

/** The current year in UTC, the timezone of the activity days. */
export function getCurrentYear(): number {
  return new UTCDateMini().getFullYear();
}

/** Days of `testsByDays`, the last one on the UTC day of `lastDay`. */
export function toTestActivityDays({
  testsByDays,
  lastDay,
}: DeepReadonly<TestActivity>): TestActivityDay[] {
  const end = startOfDay(new UTCDateMini(lastDay));
  return testsByDays.map((tests, i) => ({
    date: addDays(end, i - testsByDays.length + 1),
    tests: tests ?? 0,
  }));
}

/** The last 52 weeks up to today (UTC), starting on `firstDayOfWeek`. */
export function getLast12MonthsCalendar(
  days: readonly TestActivityDay[],
  firstDayOfWeek: Day,
): TestActivityCalendar {
  const end = startOfDay(new UTCDateMini());
  //show the last 52 weeks. Not using one year to avoid the graph to show 54 weeks
  let start = addDays(subWeeks(end, 52), 1);
  if (start.getDay() !== firstDayOfWeek) {
    start = previousDay(start, firstDayOfWeek);
  }
  return buildCalendar(days, start, end, firstDayOfWeek);
}

/**
 * The full UTC `year`. Undefined for past years without data; the current year
 * has a calendar before its first test.
 */
export function getYearCalendar(
  days: readonly TestActivityDay[],
  year: number,
  firstDayOfWeek: Day,
): TestActivityCalendar | undefined {
  const start = startOfYear(new UTCDateMini(Date.UTC(year, 0, 1)));
  const end = startOfDay(endOfYear(start));
  const isCurrentYear = year === getCurrentYear();
  if (!isCurrentYear && !days.some((it) => it.date.getFullYear() === year)) {
    return undefined;
  }
  return buildCalendar(days, start, end, firstDayOfWeek);
}

function buildCalendar(
  days: readonly TestActivityDay[],
  start: Date,
  end: Date,
  firstDayOfWeek: Day,
): TestActivityCalendar {
  const tests = new Map(days.map((it) => [it.date.valueOf(), it.tests]));
  const result: TestActivityDay[] = [];
  for (let date = start; !isBefore(end, date); date = addDays(date, 1)) {
    result.push({ date, tests: tests.get(date.valueOf()) ?? 0 });
  }
  return { start, end, firstDayOfWeek, days: result };
}

export function getMonths(calendar: TestActivityCalendar): TestActivityMonth[] {
  const { firstDayOfWeek } = calendar;
  const lastDayOfWeek = ((firstDayOfWeek + 6) % 7) as Day;
  const months = eachMonthOfInterval({
    start: calendar.start,
    end: calendar.end,
  });
  const results: TestActivityMonth[] = [];

  for (let i = 0; i < months.length; i++) {
    const month = months[i] as Date;
    let start = i === 0 ? calendar.start : startOfMonth(month);
    let end = i === months.length - 1 ? calendar.end : endOfMonth(start);

    if (start.getDay() !== firstDayOfWeek) {
      start =
        i === 0
          ? previousDay(start, firstDayOfWeek)
          : nextDay(start, firstDayOfWeek);
    }
    if (end.getDay() !== lastDayOfWeek) {
      end = nextDay(end, lastDayOfWeek);
    }

    const weeks = differenceInWeeks(end, start, { roundingMethod: "ceil" });
    if (weeks > 2) {
      results.push({
        text: format(month, "MMM").toLowerCase(),
        weeks: weeks,
      });
    } else if (i === 0) {
      results.push({ text: "", weeks: weeks });
    }
  }
  return results;
}

/** The calendar's cells, with fillers to complete the first and last week. */
export function getCells(calendar: TestActivityCalendar): TestActivityCell[] {
  const { start, end, firstDayOfWeek } = calendar;
  const result: TestActivityCell[] = [];
  const buckets = getBuckets(calendar);
  const levels = ["1", "2", "3", "4"] as const;
  const getLevel = (tests: number): TestActivityLevel => {
    if (tests === 0) return "0";
    for (let b = 0; b < 4; b++) {
      if (tests <= (buckets[b] ?? 0)) return levels[b] ?? "4";
    }
    return "4";
  };

  //skip weekdays in the previous month
  for (let i = 0; i < start.getDay() - firstDayOfWeek; i++) {
    result.push({ level: "filler" });
  }

  for (const { date, tests } of calendar.days) {
    const day = format(date, "EEEE dd MMM yyyy");
    result.push({
      level: getLevel(tests),
      label:
        tests > 0
          ? `${tests} ${tests === 1 ? "test" : "tests"} on ${day}`
          : `no activity on ${day}`,
    });
  }

  //add weekdays missing
  for (let i = end.getDay() - firstDayOfWeek; i < 6; i++) {
    result.push({ level: "filler" });
  }

  return result;
}

export function getTotalTests(calendar: TestActivityCalendar): number {
  return calendar.days.reduce((sum, it) => sum + it.tests, 0);
}

function getBuckets(calendar: TestActivityCalendar): number[] {
  const sorted = calendar.days
    .map((it) => it.tests)
    .filter((it) => it > 0)
    .sort((a, b) => a - b);

  const trimmed = sorted.slice(
    Math.round(sorted.length * 0.1),
    sorted.length - Math.round(sorted.length * 0.1),
  );
  const sum = trimmed.reduce((a, c) => a + c, 0);
  const mid = sum / trimmed.length;
  return [Math.floor(mid / 2), Math.round(mid), Math.round(mid * 1.5)];
}
