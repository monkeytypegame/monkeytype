// Daily quote: the same english quote for everyone each utc day, with a
// shareable score that counts the day's attempts. Attempts are only tracked in
// localStorage.

import { CompletedEvent } from "@monkeytype/schemas/results";
import {
  getCurrentDayTimestamp,
  MILLISECONDS_IN_DAY,
} from "@monkeytype/util/date-and-time";
import { createSignal } from "solid-js";
import { z } from "zod";

import { setConfig } from "../config/setters";
import { Config } from "../config/store";
import QuotesController from "../controllers/quotes-controller";
import { configEvent } from "../events/config";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import { setSelectedQuoteId } from "../states/test";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const LANGUAGE = "english";
// 101-300 characters
const QUOTE_GROUP = 1;
// daily #1
const FIRST_DAY = Date.UTC(2026, 9, 29);

const DailyResultSchema = z.object({
  wpm: z.number(),
  acc: z.number(),
  // errors per chunk of the test, see getErrorChunks
  errors: z.array(z.number()),
  /** which of the day's attempts it was, from 1 */
  attempt: z.number().int(),
});
type DailyResult = z.infer<typeof DailyResultSchema>;

/** The day's best result, and how many attempts were made. */
export type DailyScore = { best: DailyResult; attempts: number };

const attemptsLS = new LocalStorageWithSchema({
  key: "dailyQuoteAttempts",
  schema: z
    .object({
      day: z.number(),
      count: z.number().int(),
      best: DailyResultSchema.optional(),
    })
    .nullable(),
  fallback: null,
});

type Before = Pick<typeof Config, "mode" | "language" | "quoteLength">;

/** The settings to restore once the daily quote is exited. */
let before: Before | null = null;
let configuring = false;

const [isDailyActive, setDailyActive] = createSignal(false);
/** The daily score shown on the result screen. */
const [getDailyScore, setDailyScore] = createSignal<DailyScore | null>(null);
export { isDailyActive, getDailyScore };

export function getDailyNumber(): number {
  return (
    Math.round((getCurrentDayTimestamp() - FIRST_DAY) / MILLISECONDS_IN_DAY) + 1
  );
}

function getToday(): { count: number; best?: DailyResult } {
  const today = attemptsLS.get();
  return today?.day === getCurrentDayTimestamp() ? today : { count: 0 };
}

/** Started tests of today's daily quote, finished or not. */
export function getTodaysAttempts(): number {
  return getToday().count;
}

/** Deterministic, so every client picks the same quote for the day. */
async function getDailyQuoteId(): Promise<number> {
  const collection = await QuotesController.getQuotes(LANGUAGE);
  const ids = (collection.groups[QUOTE_GROUP] ?? collection.quotes)
    .map((quote) => quote.id)
    .sort((a, b) => a - b);
  if (ids.length === 0) throw new Error("No quotes found");
  return ids[hashDay(getDailyNumber()) % ids.length] as number;
}

// mulberry32: consecutive days land far apart
function hashDay(day: number): number {
  let t = (day + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

/**
 * Sets up today's daily quote. Returns false if it can't be played, the
 * caller then shouldn't restart the test.
 */
export async function setupDailyQuote(): Promise<boolean> {
  if (Config.funbox.length > 0) {
    showErrorNotification("Disable all funboxes to play the daily quote");
    return false;
  }

  const quoteId = await getDailyQuoteId();

  before ??= {
    mode: Config.mode,
    language: Config.language,
    quoteLength: [...Config.quoteLength],
  };

  // first: changing these settings restarts the test, which would otherwise
  // restore the settings from before
  setDailyActive(true);
  configuring = true;
  setSelectedQuoteId(quoteId);
  setConfig("quoteLength", [-2], { nosave: true });
  setConfig("mode", "quote", { nosave: true });
  // last: changing the language restarts the test
  setConfig("language", LANGUAGE, { nosave: true });
  configuring = false;

  const attempts = getTodaysAttempts();
  const soFar = attempts > 0 ? ` (${attempts} attempts so far)` : "";
  showSuccessNotification(`Daily quote #${getDailyNumber()} loaded${soFar}`, {
    important: true,
  });
  return true;
}

/**
 * Goes back to the settings from before the daily quote on the next
 * restart.
 */
export function exitDailyQuote(): void {
  setDailyActive(false);
}

/** Every started test counts as an attempt. */
export function onTestStart(): void {
  if (!isDailyActive()) return;
  const today = getToday();
  attemptsLS.set({
    ...today,
    day: getCurrentDayTimestamp(),
    count: today.count + 1,
  });
}

/** Invalid results count as attempts, but can't be the best. */
export function onTestFinish(result: CompletedEvent, invalid: boolean): void {
  if (!isDailyActive()) return;
  const today = getToday();
  let best = today.best;

  if (!invalid && !result.bailedOut) {
    const current: DailyResult = {
      wpm: Math.round(result.wpm),
      acc: Math.floor(result.acc),
      errors:
        result.chartData === "toolong"
          ? []
          : getErrorChunks(result.chartData.err),
      attempt: today.count,
    };
    if (best === undefined || isBetter(current, best)) {
      best = current;
      attemptsLS.set({ ...today, day: getCurrentDayTimestamp(), best });
    }
  }

  setDailyScore(best === undefined ? null : { best, attempts: today.count });
}

function isBetter(a: DailyResult, b: DailyResult): boolean {
  return a.wpm !== b.wpm ? a.wpm > b.wpm : a.acc > b.acc;
}

/**
 * "3rd attempt" when the best came from the latest attempt, else "best out
 * of 5 attempts".
 */
export function getAttemptLabel({ best, attempts }: DailyScore): string {
  if (best.attempt === attempts) return `${ordinal(attempts)} attempt`;
  return `best out of ${attempts} attempts`;
}

function ordinal(n: number): string {
  const t = n % 10;
  const h = n % 100;
  if (t === 1 && h !== 11) return `${n}st`;
  if (t === 2 && h !== 12) return `${n}nd`;
  if (t === 3 && h !== 13) return `${n}rd`;
  return `${n}th`;
}

/** Call while restarting, before the new words are generated. */
export function onRestart(): void {
  setDailyScore(null);
  if (!isDailyActive()) restoreSettings();
}

function restoreSettings(): void {
  if (before === null) return;
  const { mode, language, quoteLength } = before;
  before = null;
  configuring = true;
  setConfig("quoteLength", quoteLength, { nosave: true });
  setConfig("mode", mode, { nosave: true });
  setConfig("language", language, { nosave: true });
  configuring = false;
}

const CHUNKS = 10;

/** The test's per second errors, summed into up to CHUNKS chunks. */
function getErrorChunks(errPerSecond: number[]): number[] {
  const size = Math.max(1, Math.ceil(errPerSecond.length / CHUNKS));
  const chunks: number[] = [];
  for (let i = 0; i < errPerSecond.length; i += size) {
    chunks.push(errPerSecond.slice(i, i + size).reduce((a, b) => a + b, 0));
  }
  return chunks;
}

export function getShareText(score: DailyScore): string {
  const { best } = score;
  const grid = best.errors
    .map((errors) => (errors === 0 ? "🟩" : errors === 1 ? "🟨" : "🟥"))
    .join("");
  return [
    `Monkeytype daily quote #${getDailyNumber()} (${getAttemptLabel(score)})`,
    `⌨️ ${best.wpm} wpm · 🎯 ${best.acc}% acc`,
    grid,
    `${location.origin}/?daily`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function copyShareText(): Promise<void> {
  const score = getDailyScore();
  if (score === null) return;
  try {
    await navigator.clipboard.writeText(getShareText(score));
    showSuccessNotification("Copied to clipboard");
  } catch (e) {
    showErrorNotification("Failed to copy to clipboard");
  }
}

// changing the daily settings exits the daily quote, keeping the new settings
configEvent.subscribe(({ key }) => {
  if (configuring || !isDailyActive()) return;
  if (
    key === "mode" ||
    key === "language" ||
    key === "quoteLength" ||
    key === "funbox"
  ) {
    setDailyActive(false);
    before = null;
  }
});
