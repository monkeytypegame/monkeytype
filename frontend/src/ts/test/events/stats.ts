import {
  getAllTestEvents,
  getInputEvents,
  getInputEventsForWord,
  getInputEventsPerWord,
  getPressedKeys,
  getTimerStartEventMs,
  logTestEvent,
} from "./data";
import * as TestWords from "../../test/test-words";
import { CharCounts, countChars, getLastChar } from "../../utils/strings";
import * as CustomText from "../../test/custom-text";
import { getInputFromDom } from "./helpers";
import { activeWordIndex, bailedOut, koreanStatus } from "../test-state";
import { calculateWpm } from "../../utils/numbers";
import { mean, roundTo2 } from "@monkeytype/util/numbers";
import { InputEventNoMs, TestEventNoMs } from "./types";
import { Config } from "../../config/store";
import { isFunboxActiveWithProperty } from "../funbox/list";
import Hangul from "hangul-js";

function getTimerBoundaries(events: TestEventNoMs[]): number[] {
  const boundaries: number[] = [];
  let endMs: number | undefined;

  for (const event of events) {
    if (event.type !== "timer") continue;
    if (event.data.event === "step") {
      boundaries.push(event.testMs);
    } else if (event.data.event === "end") {
      endMs = event.testMs;
    }
  }

  // in zen/bailout, cap to adjusted end to remove trailing afk seconds
  if (endMs !== undefined && (Config.mode === "zen" || bailedOut)) {
    const lkte = getRawLastKeypressToEndMs();
    if (lkte < 7000) {
      endMs -= lkte;
      // remove step boundaries past the adjusted end
      while (
        boundaries.length > 0 &&
        (boundaries[boundaries.length - 1] as number) > endMs
      ) {
        boundaries.pop();
      }
    }
  }

  if (endMs !== undefined) {
    // Timed tests never push an extra bucket (legacy skips setLastSecondNotRound
    // for time mode). For other modes, mirror the legacy condition exactly:
    // Math.round(roundTo2(testSeconds) % 1) >= 0.5. The rounding must happen at
    // the SECONDS level — taking the fractional ms first and rounding can give
    // a different answer when the rounded seconds carry into the next integer
    // (e.g. endMs=19997: roundTo2(19.997)=20.00 → no bucket, but 997ms/1000
    // rounds to 0.5 → wrongly adds a bucket).
    const isTimedTest =
      Config.mode === "time" ||
      (Config.mode === "custom" && CustomText.getLimit().mode === "time");
    const testSeconds = roundTo2(endMs / 1000);
    if (!isTimedTest && Math.round(testSeconds % 1) >= 0.5) {
      boundaries.push(endMs);
    }
  }

  return boundaries;
}

export function getStartToFirstKeypressMs(): number {
  if (Config.mode === "zen") return 0;

  const events = getAllTestEvents();

  let firstKeypress: number | undefined;
  let start: number | undefined;

  for (const event of events) {
    if (firstKeypress !== undefined && start !== undefined) {
      break;
    }

    if (firstKeypress === undefined && event.type === "keydown") {
      firstKeypress = event.testMs;
    }

    if (
      start === undefined &&
      event.type === "timer" &&
      event.data.event === "start"
    ) {
      start = event.testMs;
    }
  }

  if (firstKeypress === undefined || start === undefined) {
    return 0;
  }

  const calc = firstKeypress - start;
  return calc < 0 ? 0 : roundTo2(calc);
}

// raw version is needed internally by getTestDurationMs to adjust
// duration in zen/bailout — the public version returns 0 for zen
function getRawLastKeypressToEndMs(): number {
  const events = getAllTestEvents();

  let lastKeypress: number | undefined;
  let end: number | undefined;

  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];

    if (event === undefined) {
      // this is not possible, but typescript shouts at me
      break;
    }

    if (lastKeypress !== undefined && end !== undefined) {
      break;
    }

    if (lastKeypress === undefined && event.type === "keydown") {
      lastKeypress = event.testMs;
    }

    if (
      end === undefined &&
      event.type === "timer" &&
      event.data.event === "end"
    ) {
      end = event.testMs;
    }
  }

  if (lastKeypress === undefined || end === undefined) {
    return 0;
  }

  const calc = end - lastKeypress;
  return calc < 0 ? 0 : roundTo2(calc);
}

export function getLastKeypressToEndMs(): number {
  if (Config.mode === "zen") return 0;
  return getRawLastKeypressToEndMs();
}

function countPerInterval(predicate: (event: TestEventNoMs) => boolean): {
  counts: number[];
  boundaries: number[];
} {
  const events = getAllTestEvents();
  const boundaries = getTimerBoundaries(events);

  const counts: number[] = [];
  let eventIndex = 0;

  for (const boundary of boundaries) {
    let count = 0;
    while (eventIndex < events.length) {
      const event = events[eventIndex];
      if (event === undefined) break;
      if (event.testMs > boundary) break;

      if (predicate(event)) {
        count++;
      }
      eventIndex++;
    }
    counts.push(count);
  }

  return { counts, boundaries };
}

export function getKeypressesPerSecond(): number[] {
  const { counts } = countPerInterval(
    (e) => e.type === "input" && e.data.inputType === "insertText",
  );

  return counts;
}

export function getRawPerSecond(): number[] {
  const { counts, boundaries } = countPerInterval(
    (e) => e.type === "input" && e.data.inputType === "insertText",
  );

  let prevBoundary = 0;
  return counts.map((kps, i) => {
    const boundary = boundaries[i] as number;
    const intervalSeconds = (boundary - prevBoundary) / 1000;
    prevBoundary = boundary;
    return Math.round(calculateWpm(kps, intervalSeconds));
  });
}

export function getCurrentTestDurationMs(now: number): number {
  const start = getTimerStartEventMs();

  if (start === undefined) {
    return 0;
  }

  return now - start;
}

export function getTestDurationMs(): number {
  const events = getAllTestEvents();

  let end: number | undefined;

  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];

    if (event === undefined) {
      // this is not possible, but typescript shouts at me
      break;
    }

    if (
      end === undefined &&
      event.type === "timer" &&
      event.data.event === "end"
    ) {
      end = event.testMs;
      break;
    }
  }

  if (end === undefined) {
    return 0;
  }

  if (Config.mode === "zen" || bailedOut) {
    const lkte = getRawLastKeypressToEndMs();
    if (lkte < 7000) {
      end -= lkte;
    }
  }

  if (Config.mode !== "custom") {
    end = roundTo2(end / 1000) * 1000;
  }

  return end;
}

export function getDateBasedTestDurationMs(): number {
  const events = getAllTestEvents();

  let start: number | undefined;
  let end: number | undefined;

  for (const event of events) {
    if (
      start === undefined &&
      event.type === "timer" &&
      event.data.event === "start"
    ) {
      start = event.data.date;
    }
    if (
      end === undefined &&
      event.type === "timer" &&
      event.data.event === "end"
    ) {
      end = event.data.date;
    }
  }

  if (start === undefined || end === undefined) {
    return 0;
  }

  return end - start;
}

function getTargetWord(
  wordIndex: number,
  simulatedInput: string,
  lastWord: boolean,
): string {
  if (Config.mode === "zen") {
    return simulatedInput;
  } else {
    const word = TestWords.words.getText(wordIndex);

    if (getLastChar(word) === "\n") {
      // for multiline, dont add space
      return word;
    }

    let wordEnd = "";

    if (!lastWord) {
      wordEnd = " ";
    }

    if (isFunboxActiveWithProperty("nospace")) {
      wordEnd = "";
    }

    return word + wordEnd;
  }
}

export function getCurrentWpmAndRaw(now?: number): {
  wpm: number;
  raw: number;
} {
  const chars = getChars(true);
  const currentTestDurationMs = getCurrentTestDurationMs(
    now ?? performance.now(),
  );
  const wpm = Math.round(
    calculateWpm(chars.correctWord, currentTestDurationMs / 1000),
  );
  const raw = Math.round(
    calculateWpm(
      chars.allCorrect + chars.extra + chars.incorrect,
      currentTestDurationMs / 1000,
    ),
  );
  return { wpm, raw };
}

export function getCurrentAccuracy(): number {
  const events = getAllTestEvents();

  let correct = 0;
  let total = 0;

  for (const event of events) {
    if (event.type === "input" && "correct" in event.data) {
      total++;
      if (event.data.correct) {
        correct++;
      }
    }
  }

  return total === 0 ? 100 : (correct / total) * 100;
}

//todo: composition start must be the start time for burst calculation
function computeBurst(events: InputEventNoMs[], now?: number): number {
  const input = getInputFromDom(events);

  let inputLength = input.length;
  if (!input.endsWith(" ") && !input.endsWith("\n")) {
    inputLength += 1; // account for trigger char (space/newline) on word submit
  }

  let firstKeypressTime: number | undefined;
  let lastKeypressTime: number | undefined;

  for (const event of events) {
    if (event.type === "input" && event.data.inputType === "insertText") {
      if (event.data.charIndex === 0) {
        firstKeypressTime = event.testMs;
      }
      if (firstKeypressTime !== undefined) {
        lastKeypressTime = event.testMs;
      }
    }
  }

  if (firstKeypressTime === undefined || input.length === 0) {
    return 0;
  }

  if (lastKeypressTime !== undefined && lastKeypressTime < firstKeypressTime) {
    lastKeypressTime = undefined;
  }

  const endTime = lastKeypressTime ?? now ?? performance.now();

  const durationSeconds = (endTime - firstKeypressTime) / 1000;
  if (durationSeconds <= 0) return Infinity;

  return Math.round(calculateWpm(inputLength, durationSeconds));
}

export function getWordBurst(wordIndex: number, now?: number): number {
  const events = getInputEventsForWord(wordIndex);
  return computeBurst(events, now);
}

export function getBurstHistory(): number[] {
  const eventsPerWord = getInputEventsPerWord();
  const burstHistory: number[] = [];
  for (let i = 0; i < TestWords.words.length; i++) {
    burstHistory.push(computeBurst(eventsPerWord.get(i) ?? []));
  }
  return burstHistory;
}

function countCharsForWords(
  eventsPerWord: Map<number, InputEventNoMs[]>,
  lastWordIndex: number,
  shouldCountPartialLastWord: boolean,
): CharCounts {
  const acc: CharCounts = {
    allCorrect: 0,
    correctWord: 0,
    incorrect: 0,
    extra: 0,
    missed: 0,
  };

  for (const [wordIndex, events] of eventsPerWord) {
    const lastWord = wordIndex === lastWordIndex;

    let simulatedInput = getInputFromDom(events);
    if (koreanStatus) {
      simulatedInput = Hangul.disassemble(simulatedInput).join("");
    }

    let targetWord = getTargetWord(wordIndex, simulatedInput, lastWord);
    if (koreanStatus) {
      targetWord = Hangul.disassemble(targetWord).join("");
    }

    const lastEvent = events[events.length - 1];
    const endsWithCommitSpace =
      lastEvent !== undefined &&
      lastEvent.data.inputType === "insertText" &&
      lastEvent.data.commitsWord === true;

    const c = countChars(
      simulatedInput,
      targetWord,
      lastWord && shouldCountPartialLastWord,
      endsWithCommitSpace,
    );
    acc.allCorrect += c.allCorrect;
    acc.correctWord += c.correctWord;
    acc.incorrect += c.incorrect;
    acc.extra += c.extra;
    acc.missed += c.missed;

    if (lastWord) break;
  }

  return acc;
}

function inferActiveWordIndex(
  eventsPerWord: Map<number, InputEventNoMs[]>,
): number {
  let maxWordIndex = -1;
  let lastWordEvents: InputEventNoMs[] | undefined;
  for (const [k, wordEvents] of eventsPerWord) {
    if (getInputFromDom(wordEvents).length > 0 && k > maxWordIndex) {
      maxWordIndex = k;
      lastWordEvents = wordEvents;
    }
  }
  if (lastWordEvents === undefined) return 0;
  const lastEvt = lastWordEvents[lastWordEvents.length - 1];
  // committed trailing space → cursor advanced to the next word
  if (
    lastEvt !== undefined &&
    lastEvt.data.inputType === "insertText" &&
    lastEvt.data.data === " "
  ) {
    return maxWordIndex + 1;
  }
  return maxWordIndex;
}

export function getChars(countPartialLastWord = false): CharCounts {
  const isTimedTest =
    Config.mode === "time" ||
    (Config.mode === "words" && Config.words === 0) ||
    (Config.mode === "custom" && CustomText.getLimit().mode === "time");
  return countCharsForWords(
    getInputEventsPerWord(),
    isTimedTest ? activeWordIndex : TestWords.words.list.length - 1,
    isTimedTest || countPartialLastWord,
  );
}

export function getInputHistory(): string[] {
  const eventsPerWordIndex = getInputEventsPerWord();
  const history: string[] = [];

  for (const events of eventsPerWordIndex.values()) {
    const simulatedInput = getInputFromDom(events);
    history.push(simulatedInput);
  }

  return history;
}

export function getAccuracy(): {
  correct: number;
  incorrect: number;
  percentage: number;
} {
  const events = getInputEvents();

  let correct = 0;
  let incorrect = 0;

  for (const event of events) {
    if (!("correct" in event.data)) {
      continue;
    }
    if (event.data.correct) {
      correct++;
    } else {
      incorrect++;
    }
  }
  const total = correct + incorrect;
  const percentage = total === 0 ? 0 : (correct / total) * 100;

  return {
    correct: correct,
    incorrect: incorrect,
    percentage: percentage,
  };
}

export function getKeypressOverlap(): number {
  const events = getAllTestEvents();

  const keydownTimes: Map<
    string,
    {
      timestamp: number;
    }
  > = new Map();
  let overlap = 0;
  let lastStartTime: number | undefined;

  for (const event of events) {
    if (event.type === "keydown") {
      keydownTimes.set(event.data.code, {
        timestamp: event.testMs,
      });
      if (lastStartTime === undefined && keydownTimes.size > 1) {
        lastStartTime = event.testMs;
      }
    } else if (event.type === "keyup") {
      keydownTimes.delete(event.data.code);
      if (lastStartTime !== undefined && keydownTimes.size === 1) {
        const endTime = event.testMs;
        overlap += endTime - lastStartTime;
        lastStartTime = undefined;
      }
    }
  }
  return roundTo2(overlap);
}

export function getWordIndexesForSecond(second: number): number[] {
  const events = getAllTestEvents();
  const boundaries = getTimerBoundaries(events);

  const boundary = boundaries[second];
  if (boundary === undefined) return [];

  const prevBoundary = second > 0 ? boundaries[second - 1] : undefined;
  const wordIndexes = new Set<number>();

  for (const event of events) {
    if (prevBoundary !== undefined && event.testMs <= prevBoundary) continue;
    if (event.testMs > boundary) break;

    if (event.type === "input" && event.data.inputType === "insertText") {
      wordIndexes.add(event.data.wordIndex);
    }
  }

  return [...wordIndexes];
}

export function getErrorCountHistory(): number[] {
  const { counts } = countPerInterval(
    (e) =>
      e.type === "input" &&
      e.data.inputType === "insertText" &&
      !e.data.correct,
  );
  return counts;
}

export function getWpmHistory(): number[] {
  const events = getAllTestEvents();
  const wpmHistory: number[] = [];

  for (const boundary of getTimerBoundaries(events)) {
    const eventsPerWord = getInputEventsPerWord(undefined, boundary);
    const lastWordIndex = inferActiveWordIndex(eventsPerWord);
    const { correctWord } = countCharsForWords(
      eventsPerWord,
      lastWordIndex,
      true,
    );
    wpmHistory.push(Math.round(calculateWpm(correctWord, boundary / 1000)));
  }

  return wpmHistory;
}

export function getRawHistory(): number[] {
  const events = getAllTestEvents();
  const timerBoundaries = getTimerBoundaries(events);
  const wpmHistory: number[] = [];

  for (const boundary of timerBoundaries) {
    const eventsPerWord = getInputEventsPerWord(undefined, boundary);

    // Compute simulated inputs first so we can determine the effective last word
    const wordInputs = new Map<
      number,
      { input: string; events: InputEventNoMs[] }
    >();
    let maxWordIndex = 0;
    for (const [k, wordEvents] of eventsPerWord) {
      const input = getInputFromDom(wordEvents);
      wordInputs.set(k, { input, events: wordEvents });
      // Only count words with non-empty input for maxWordIndex,
      // so that fully-deleted words don't prevent earlier words
      // from being treated as the last word
      if (input.length > 0 && k > maxWordIndex) maxWordIndex = k;
    }

    let totalCorrect = 0;
    for (const [wordIndex, { input, events: wordEvents }] of wordInputs) {
      if (input.length === 0) continue;

      const lastEvt = wordEvents[wordEvents.length - 1];
      let adjustedMax = maxWordIndex;
      if (
        lastEvt !== undefined &&
        lastEvt.data.inputType === "insertText" &&
        lastEvt.data.data === " "
      ) {
        adjustedMax = maxWordIndex + 1;
      }
      const lastWord = wordIndex === adjustedMax;

      const trimmed = lastWord ? input.trimEnd() : input;
      const targetWord =
        Config.mode === "zen"
          ? trimmed
          : TestWords.words.getText(wordIndex) + (lastWord ? "" : " ");

      const count = countChars(trimmed, targetWord, lastWord, true);

      totalCorrect += count.allCorrect + count.extra + count.incorrect;
    }

    const durationSeconds = boundary / 1000;
    wpmHistory.push(Math.round(calculateWpm(totalCorrect, durationSeconds)));
  }

  return wpmHistory;
}

export function getAfkDuration(): number {
  const { counts } = countPerInterval(
    (e) => e.type === "keydown" || e.type === "input",
  );
  return counts.reduce((total, c) => total + (c === 0 ? 1 : 0), 0);
}

export function getKeypressDurations(): number[] {
  const events = getAllTestEvents();

  const keydownTimes: Map<
    string,
    {
      timestamp: number;
      index: number;
    }
  > = new Map();
  const durations: number[] = [];

  for (const event of events) {
    if (event.type === "keydown") {
      keydownTimes.set(event.data.code, {
        timestamp: event.testMs,
        index: durations.length,
      });
      durations.push(0); // placeholder
    } else if (event.type === "keyup") {
      const keydownTime = keydownTimes.get(event.data.code);
      if (keydownTime !== undefined) {
        const duration = event.testMs - keydownTime.timestamp;
        durations[keydownTime.index] = duration;
        keydownTimes.delete(event.data.code);
      }
    }
  }

  return durations;
}

export function forceReleaseAllKeys(): void {
  const filteredDurations = getKeypressDurations().filter((d) => d > 0);

  let avg: number;
  if (filteredDurations.length === 0) {
    // this means the test ended while all keys were still held - probably safe to ignore
    // since this will result in a "too short" test anyway, but ill just set it to a magic number
    avg = 80;
  } else {
    avg = roundTo2(mean(filteredDurations));
  }

  for (const [key, { timestamp }] of getPressedKeys().entries()) {
    logTestEvent("keyup", timestamp + avg, {
      code: key, //entries is not picking up the type
      estimated: true,
    });
  }
}

export function getMissedWords(): Record<string, number> {
  const events = getAllTestEvents();

  const missedWords: Record<string, number> = Object.create(null) as Record<
    string,
    number
  >;

  for (const event of events) {
    if (
      event.type === "input" &&
      event.data.inputType === "insertText" &&
      !event.data.correct
    ) {
      const word = TestWords.words.getText(event.data.wordIndex);
      if (missedWords[word] === undefined) {
        missedWords[word] = 1;
      } else {
        missedWords[word]++;
      }
    }
  }

  return missedWords;
}

export function getCorrectedWords(): string[] {
  const ev = getInputEventsPerWord();
  const correctedWords: string[] = [];

  for (const [, events] of ev.entries()) {
    const correctedChars: string[] = [];
    const currentChars: string[] = [];
    let cursorPos = 0;

    for (const event of events) {
      if (
        event.data.inputType === "insertText" ||
        event.data.inputType === "insertCompositionText"
      ) {
        if (event.data.inputStopped || event.data.data === " ") continue;
        currentChars[cursorPos] = event.data.data;
        cursorPos++;
      } else if (event.data.inputType === "deleteContentBackward") {
        if (cursorPos > 0) {
          cursorPos--;
          correctedChars[cursorPos] = currentChars[cursorPos] ?? "";
        }
      } else if (event.data.inputType === "deleteWordBackward") {
        while (cursorPos > 0) {
          cursorPos--;
          correctedChars[cursorPos] = currentChars[cursorPos] ?? "";
        }
      }
    }

    const result: string[] = [];
    for (let i = 0; i < currentChars.length; i++) {
      result.push(correctedChars[i] ?? currentChars[i] ?? "");
    }
    correctedWords.push(result.join(""));
  }

  return correctedWords;
}

export const __testing = {
  getTimerBoundaries,
  getTargetWord,
};
