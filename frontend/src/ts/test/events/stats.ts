import {
  getAllTestEvents,
  getInputEvents,
  getInputEventsPerWord,
  // simulateInput,
} from "./data";
import * as TestWords from "../../test/test-words";
import { CharCounts, countChars } from "../../utils/strings";
import * as CustomText from "../../test/custom-text";
import { getSimulatedInput } from "./helpers";
import { activeWordIndex } from "../test-state";
import { calculateWpm } from "../../utils/numbers";
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

  if (endMs !== undefined) {
    const last = boundaries[boundaries.length - 1];
    if (last !== undefined && endMs - last < 500) {
      // Merge: replace last step with end timestamp
      boundaries[boundaries.length - 1] = endMs;
    } else {
      boundaries.push(endMs);
    }
  }

  return boundaries;
}

function scaleLastInterval(values: number[], boundaries: number[]): void {
  if (boundaries.length < 2) return;
  const last = boundaries[boundaries.length - 1];
  const secondToLast = boundaries[boundaries.length - 2];
  if (last === undefined || secondToLast === undefined) return;
  const lastInterval = last - secondToLast;
  if (lastInterval < 1000 && lastInterval >= 500) {
    const timescale = 1000 / lastInterval;
    values[values.length - 1] = Math.round(
      (values[values.length - 1] as number) * timescale,
    );
  }
}

export function getStartToFirstKeypressMs(): number {
  const events = getAllTestEvents();

  let firstKeypress: number | undefined;
  let start: number | undefined;

  for (const event of events) {
    if (firstKeypress !== undefined && start !== undefined) {
      break;
    }

    if (firstKeypress === undefined && event.type === "input") {
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
    throw new Error("No keypresses or start event found");
  }

  const calc = firstKeypress - start;
  return calc < 0 ? 0 : calc;
}

export function getLastKeypressToEndMs(): number {
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

    if (lastKeypress === undefined && event.type === "input") {
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
    throw new Error("No keypresses or end event found");
  }

  const calc = end - lastKeypress;
  return calc < 0 ? 0 : calc;
}

export function getKeypressesPerSecond(): number[] {
  const events = getAllTestEvents();
  const timerBoundaries = getTimerBoundaries(events);

  const keypresses: number[] = [];
  let eventIndex = 0;

  for (const boundary of timerBoundaries) {
    let count = 0;
    while (eventIndex < events.length) {
      const event = events[eventIndex];
      if (event === undefined) break;
      if (event.testMs > boundary) break;

      if (event.type === "input" && event.data.inputType === "insertText") {
        count++;
      }
      eventIndex++;
    }
    keypresses.push(count);
  }

  scaleLastInterval(keypresses, timerBoundaries);

  return keypresses;
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
    throw new Error("No end event found");
  }

  return end;
}

export function getChars(final: boolean): CharCounts {
  const eventsPerWordIndex = getInputEventsPerWord();
  const isTimedTest =
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimit().mode === "time");
  const shouldCountPartialLastWord = !final || (final && isTimedTest);

  let allCorrect = 0;
  let correctWord = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  for (const [wordIndex, events] of eventsPerWordIndex.entries()) {
    const lastWord = wordIndex === activeWordIndex;

    let simulatedInput = getSimulatedInput(events);

    //todo decide if this should be done or not
    if (lastWord) {
      //remove trailing space for last word
      simulatedInput = simulatedInput.trimEnd();
    }

    const targetWord =
      TestWords.words.getText(wordIndex) + (lastWord ? "" : " ");

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
  return overlap;
}

export function getErrorCountHistory(): number[] {
  //gets a history of error counts per second, errors from previous seconds are not carried over
  const events = getAllTestEvents();
  const timerBoundaries = getTimerBoundaries(events);

  const errorCounts: number[] = [];
  let eventIndex = 0;

  for (const boundary of timerBoundaries) {
    let count = 0;
    while (eventIndex < events.length) {
      const event = events[eventIndex];
      if (event === undefined) break;
      if (event.testMs > boundary) break;

      if (
        event.type === "input" &&
        event.data.inputType === "insertText" &&
        !event.data.correct
      ) {
        count++;
      }
      eventIndex++;
    }
    errorCounts.push(count);
  }

  scaleLastInterval(errorCounts, timerBoundaries);

  return errorCounts;
}

export function getWpmHistory(): number[] {
  const events = getAllTestEvents();
  const timerBoundaries = getTimerBoundaries(events);
  const wpmHistory: number[] = [];

  // not calculating correctly if get partial credit but then submit incorrect word

  // Running state: simulated input per word, built up incrementally
  const simulatedInputs: Map<number, string> = new Map();
  // Track last event per word for space-submission detection
  const lastEventPerWord: Map<number, InputEvent> = new Map();
  let eventIndex = 0;

  for (const boundary of timerBoundaries) {
    // Process only new events up to this boundary
    while (eventIndex < events.length) {
      const event = events[eventIndex];
      if (event === undefined) break;
      if (event.testMs > boundary) break;

      if (event.type === "input") {
        let wordIndex = event.data.wordIndex;

        // Match getInputEventsPerWord behavior: deleteWordBackward on
        // charIndex 0 is attributed to the previous word
        if (
          (event.data.inputType === "deleteWordBackward" ||
            event.data.inputType === "deleteContentBackward") &&
          event.data.charIndex === 0 &&
          wordIndex > 0
        ) {
          wordIndex -= 1;
        }

        // Update simulated input for this word
        const current = simulatedInputs.get(wordIndex) ?? "";
        if (
          event.data.inputType === "insertText" ||
          event.data.inputType === "insertCompositionText"
        ) {
          simulatedInputs.set(wordIndex, current + event.data.data);
        } else if (event.data.inputType === "deleteContentBackward") {
          simulatedInputs.set(wordIndex, current.slice(0, -1));
        } else if (event.data.inputType === "deleteWordBackward") {
          simulatedInputs.set(wordIndex, "");
        }

        lastEventPerWord.set(wordIndex, event);
      }
      eventIndex++;
    }

    // Compute max word index
    let maxWordIndex = 0;
    for (const k of simulatedInputs.keys()) {
      if (k > maxWordIndex) maxWordIndex = k;
    }

    // Count correct chars across all words
    let totalCorrect = 0;
    for (const [wordIndex, input] of simulatedInputs) {
      // Check if this word's last event was a space submission
      let adjustedMax = maxWordIndex;
      const lastEvt = lastEventPerWord.get(wordIndex);
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
        TestWords.words.getText(wordIndex) + (lastWord ? "" : " ");
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
