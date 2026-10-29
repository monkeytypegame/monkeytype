// Daily quote: the same english quote for everyone each utc day, one attempt
// per day, with a shareable score. Attempts are only tracked in localStorage.

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
  showNoticeNotification,
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
});
type DailyResult = z.infer<typeof DailyResultSchema>;

const attemptLS = new LocalStorageWithSchema({
  key: "dailyQuoteAttempt",
  schema: z
    .object({
      day: z.number(),
      // undefined: started but not finished
      result: DailyResultSchema.optional(),
    })
    .nullable(),
  fallback: null,
});

type Before = Pick<typeof Config, "mode" | "language" | "quoteLength">;

/** The settings to restore once the daily test is over. */
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

function getTodaysAttempt(): { result?: DailyResult } | null {
  const attempt = attemptLS.get();
  return attempt?.day === getCurrentDayTimestamp() ? attempt : null;
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
 * Sets up today's daily quote. Returns false if it was already attempted
 * today or can't be played, the caller then shouldn't restart the test.
 */
export async function setupDailyQuote(): Promise<boolean> {
  const attempt = getTodaysAttempt();
  if (attempt !== null) {
    const message =
      attempt.result === undefined
        ? "You already attempted today's daily quote."
        : `You already played today's daily quote: ${attempt.result.wpm} wpm, ${attempt.result.acc}% acc.`;
    showNoticeNotification(`${message} Come back tomorrow!`, {
      important: true,
    });
    return false;
  }

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

  showSuccessNotification(
    `Daily quote #${getDailyNumber()} loaded. You only get one attempt, good luck!`,
    { important: true },
  );
  return true;
}

/** Starting the test uses up today's attempt. */
export function onTestStart(): void {
  if (!isDailyActive()) return;
  attemptLS.set({ day: getCurrentDayTimestamp() });
}

export function onTestFinish(result: CompletedEvent): void {
  if (!isDailyActive()) return;
  setDailyActive(false);

  const dailyResult: DailyResult = {
    wpm: Math.round(result.wpm),
    acc: Math.floor(result.acc),
    errors:
      result.chartData === "toolong"
        ? []
        : getErrorChunks(result.chartData.err),
  };
  attemptLS.set({ day: getCurrentDayTimestamp(), result: dailyResult });
  setDailyResult(dailyResult);
}

/** Call while restarting, before the new words are generated. */
export function onRestart(): void {
  setDailyResult(null);
  if (isDailyActive()) {
    // just set up, about to be played
    if (getTodaysAttempt() === null) return;
    showNoticeNotification("Daily quote abandoned. Come back tomorrow!", {
      important: true,
    });
    setDailyActive(false);
  }
  restoreSettings();
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
  return [
    `Monkeytype daily quote #${getDailyNumber()}`,
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

// changing the daily settings before starting gives up on the daily quote,
// but keeps the attempt
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
