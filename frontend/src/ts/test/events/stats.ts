import {
  getAllTestEvents,
  getInputEvents,
  getInputEventsPerWord,
} from "./data";
import * as TestWords from "../../test/test-words";
import Config from "../../config";
import { CharCounts, countChars } from "../../utils/strings";
import * as CustomText from "../../test/custom-text";
import { getSimulatedInput } from "./helpers";
import { activeWordIndex } from "../test-state";
import { calculateWpm } from "../../utils/numbers";
import { InputEvent } from "./types";

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
  const testDuration = getTestDurationMs();
  const expectedLength = Math.floor(testDuration / 1000);

  const keypresses: number[] = [];
  for (const event of events) {
    if (event.type !== "input") {
      continue;
    }

    const time = Math.floor(event.testMs / 1000);
    const existing = keypresses[time] ?? 0;
    keypresses[time] = existing + 1;
  }

  // Fill in empty values with 0
  for (let i = 0; i < expectedLength; i++) {
    if (keypresses[i] === undefined) {
      keypresses[i] = 0;
    }
  }

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

    const targetWord = TestWords.words.get(wordIndex) + (lastWord ? "" : " ");

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
  //gets a history of error counts per second, errors from prevoius seconds are carried not over
  const events = getAllTestEvents();
  const testDuration = getTestDurationMs();
  const expectedLength = Math.floor(testDuration / 1000);
  const errorCounts: number[] = [];

  for (const event of events) {
    if (
      event.type === "input" &&
      event.data.inputType === "insertText" &&
      !event.data.correct
    ) {
      const eventSecond = Math.floor(event.testMs / 1000);
      if (errorCounts[eventSecond] === undefined) {
        errorCounts[eventSecond] = 0;
      }
      errorCounts[eventSecond]++;
    }
  }

  //fill in empty values with 0
  const maxTime = errorCounts.length;
  for (let i = 0; i < maxTime; i++) {
    if (errorCounts[i] === undefined) {
      errorCounts[i] = 0;
    }
  }

  while (errorCounts.length < expectedLength) {
    errorCounts.push(0);
  }

  return errorCounts;
}

export function getWpmHistory(): number[] {
  const testDuration = getTestDurationMs();
  const expectedLength = Math.floor(testDuration / 1000);

  // not calculating correctly if get partial crecdit but then submit incorrect word

  const wpmHistory: number[] = [];

  for (let second = 0; second < expectedLength; second++) {
    const eventsPerWordIndex = getInputEventsPerWord((second + 1) * 1000);

    let correctWordChars = 0;
    for (const [wordIndex, events] of eventsPerWordIndex.entries()) {
      let maxWordIndex = Math.max(...eventsPerWordIndex.keys());
      const lastEventOfWord = events[events.length - 1] as InputEvent;
      if (
        lastEventOfWord.data.inputType === "insertText" &&
        lastEventOfWord.data.data === " "
      ) {
        maxWordIndex++;
      }
      const lastWord = wordIndex === maxWordIndex;

      let simulatedInput = getSimulatedInput(events);

      //todo decide if this should be done or not
      if (lastWord) {
        //remove trailing space for last word
        simulatedInput = simulatedInput.trimEnd();
      }

      const targetWord = TestWords.words.get(wordIndex) + (lastWord ? "" : " ");

      const charCounts = countChars(simulatedInput, targetWord, lastWord, true);

      correctWordChars += charCounts.correctWord;
    }

    wpmHistory.push(calculateWpm(correctWordChars, second + 1));
  }

  return wpmHistory;
}
