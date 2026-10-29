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

export type DailyResult = {
  wpm: number;
  acc: number;
  // errors per chunk of the test, see getErrorChunks
  errors: number[];
  /** which of the day's attempts it was, from 1 */
  attempt: number;
};

const attemptsLS = new LocalStorageWithSchema({
  key: "dailyQuoteAttempts",
  schema: z.object({ day: z.number(), count: z.number().int() }).nullable(),
  fallback: null,
});

type Before = Pick<typeof Config, "mode" | "language" | "quoteLength">;

/** The settings to restore once the daily quote is exited. */
let before: Before | null = null;
let configuring = false;

const [isDailyActive, setDailyActive] = createSignal(false);
/** The daily result shown on the result screen. */
const [getDailyResult, setDailyResult] = createSignal<DailyResult | null>(null);
export { isDailyActive, getDailyResult };

export function getDailyNumber(): number {
  return (
    Math.round((getCurrentDayTimestamp() - FIRST_DAY) / MILLISECONDS_IN_DAY) + 1
  );
}

/** Started tests of today's daily quote, finished or not. */
export function getTodaysAttempts(): number {
  const attempts = attemptsLS.get();
  return attempts?.day === getCurrentDayTimestamp() ? attempts.count : 0;
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
  attemptsLS.set({
    day: getCurrentDayTimestamp(),
    count: getTodaysAttempts() + 1,
  });
}

export function onTestFinish(result: CompletedEvent): void {
  if (!isDailyActive()) return;
  setDailyResult({
    wpm: Math.round(result.wpm),
    acc: Math.floor(result.acc),
    errors:
      result.chartData === "toolong"
        ? []
        : getErrorChunks(result.chartData.err),
    attempt: getTodaysAttempts(),
  });
}

/** Call while restarting, before the new words are generated. */
export function onRestart(): void {
  setDailyResult(null);
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

export function getShareText(result: DailyResult): string {
  const grid = result.errors
    .map((errors) => (errors === 0 ? "🟩" : errors === 1 ? "🟨" : "🟥"))
    .join("");
  const attempts =
    result.attempt === 1 ? "1 attempt" : `${result.attempt} attempts`;
  return [
    `Monkeytype daily quote #${getDailyNumber()} (${attempts})`,
    `⌨️ ${result.wpm} wpm · 🎯 ${result.acc}% acc`,
    grid,
    `${location.origin}/?daily`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function copyShareText(): Promise<void> {
  const result = getDailyResult();
  if (result === null) return;
  try {
    await navigator.clipboard.writeText(getShareText(result));
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
