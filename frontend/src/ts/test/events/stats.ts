import {
  getAllTestEvents,
  getInputEvents,
  getInputEventsForWord,
  getInputEventsPerWord,
  getPressedKeys,
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

export function getChars(): CharCounts {
  const isTimedTest =
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimit().mode === "time");
  return countCharsForWords(
    getInputEventsPerWord(),
    isTimedTest ? activeWordIndex : TestWords.words.list.length - 1,
    isTimedTest,
  );
}

export function getInputForWord(wordIndex: number): string {
  const events = getInputEventsForWord(wordIndex);
  return getInputFromDom(events).trimEnd();
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

export function getKeypressSpacing(): number[] {
  const events = getAllTestEvents();

  const spacings: number[] = [];
  let lastKeydownTime: number | undefined;
  for (const event of events) {
    if (event.type === "keydown") {
      if (lastKeydownTime !== undefined) {
        const spacing = event.testMs - lastKeydownTime;
        spacings.push(spacing);
      }
      // clamp to 0 so a pre-start keydown matches getStartToFirstKeypressMs,
      // keeping startToFirstKey + sum(keySpacing) + lastKeyToEnd ≈ testDuration
      lastKeydownTime = Math.max(0, event.testMs);
    }
  }

  return spacings;
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

export const __testing = {
  getTimerBoundaries,
  getTargetWord,
};
