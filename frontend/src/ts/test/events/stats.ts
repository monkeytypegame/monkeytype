import {
  getAllTestEvents,
  getInputEvents,
  getInputEventsPerWord,
  getPressedKeys,
  logTestEvent,
} from "./data";
import * as TestWords from "../../test/test-words";
import { CharCounts, countChars, getLastChar } from "../../utils/strings";
import * as CustomText from "../../test/custom-text";
import { getSimulatedInput } from "./helpers";
import { activeWordIndex, bailedOut } from "../test-state";
import { calculateWpm } from "../../utils/numbers";
import { mean, roundTo2 } from "@monkeytype/util/numbers";
import { InputEvent, TestEvent } from "./types";
import { Config } from "../../config/store";

function getTimerBoundaries(events: TestEvent[]): number[] {
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
    const last = boundaries[boundaries.length - 1];
    if (endMs - (last ?? 0) >= 500) {
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

function countPerInterval(predicate: (event: TestEvent) => boolean): {
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

    return word + (lastWord ? "" : " ");
  }
}

export function getChars(): CharCounts {
  const eventsPerWordIndex = getInputEventsPerWord();
  const isTimedTest =
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimit().mode === "time");
  const shouldCountPartialLastWord = isTimedTest;

  let allCorrect = 0;
  let correctWord = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  for (const [wordIndex, events] of eventsPerWordIndex.entries()) {
    const lastWord = wordIndex === activeWordIndex;

    let simulatedInput = getSimulatedInput(events);

    if (lastWord) {
      //remove trailing space for last word
      simulatedInput = simulatedInput.trimEnd();
    }

    const targetWord = getTargetWord(wordIndex, simulatedInput, lastWord);

    const charCounts = countChars(
      simulatedInput,
      targetWord,
      lastWord,
      shouldCountPartialLastWord,
    );

    allCorrect += charCounts.allCorrect;
    correctWord += charCounts.correctWord;
    incorrect += charCounts.incorrect;
    extra += charCounts.extra;
    missed += charCounts.missed;

    if (lastWord) {
      break;
    }
  }

  return {
    allCorrect: allCorrect,
    correctWord: correctWord,
    incorrect: incorrect,
    extra: extra,
    missed: missed,
  };
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
        const spacing = event.ms - lastKeydownTime;
        spacings.push(spacing);
      }
      lastKeydownTime = event.ms;
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
        timestamp: event.ms,
      });
      if (lastStartTime === undefined && keydownTimes.size > 1) {
        lastStartTime = event.ms;
      }
    } else if (event.type === "keyup") {
      keydownTimes.delete(event.data.code);
      if (lastStartTime !== undefined && keydownTimes.size === 1) {
        const endTime = event.ms;
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
  const timerBoundaries = getTimerBoundaries(events);
  const wpmHistory: number[] = [];

  for (const boundary of timerBoundaries) {
    const eventsPerWord = getInputEventsPerWord(undefined, boundary);

    // Compute simulated inputs first so we can determine the effective last word
    const wordInputs = new Map<
      number,
      { input: string; events: InputEvent[] }
    >();
    let maxWordIndex = 0;
    for (const [k, wordEvents] of eventsPerWord) {
      const input = getSimulatedInput(wordEvents);
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
      totalCorrect += countChars(
        trimmed,
        targetWord,
        lastWord,
        true,
      ).correctWord;
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
        timestamp: event.ms,
        index: durations.length,
      });
      durations.push(0); // placeholder
    } else if (event.type === "keyup") {
      const keydownTime = keydownTimes.get(event.data.code);
      if (keydownTime !== undefined) {
        const duration = event.ms - keydownTime.timestamp;
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
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      estimated: true,
    });
  }
}

export const __testing = {
  getTimerBoundaries,
};
