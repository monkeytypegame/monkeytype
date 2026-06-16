import * as TestWords from "../../test/test-words";
import { CharCounts, countChars } from "../../utils/strings";
import { getEventsForWord, getEventsPerWord, getInputFromDom } from "./helpers";
import { calculateWpm } from "../../utils/numbers";
import { roundTo2 } from "@monkeytype/util/numbers";
import { EventLog, TestEventNoMs } from "./types";
import Hangul from "hangul-js";

function getTimerBoundaries(eventLog: EventLog): number[] {
  const { events } = eventLog;
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
  if (
    endMs !== undefined &&
    (eventLog.context.mode === "zen" || eventLog.context.bailedOut)
  ) {
    const lkte = getRawLastKeypressToEndMs(eventLog);
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

    const { context } = eventLog;
    const isTimedTest =
      context.mode === "time" ||
      (context.mode === "words" && context.mode2 === "0") ||
      (context.mode === "custom" && context.customTextLimitMode === "time") ||
      (context.mode === "custom" && context.customTextLimitValue === 0);

    const testSeconds = roundTo2(endMs / 1000);
    if (!isTimedTest && Math.round(testSeconds % 1) >= 0.5) {
      boundaries.push(endMs);
    }
  }

  return boundaries;
}

export function getStartToFirstKeypressMs(eventLog: EventLog): number {
  if (eventLog.context.mode === "zen") return 0;

  const { events } = eventLog;

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
function getRawLastKeypressToEndMs(eventLog: EventLog): number {
  const { events } = eventLog;

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

export function getLastKeypressToEndMs(eventLog: EventLog): number {
  if (eventLog.context.mode === "zen") return 0;
  return getRawLastKeypressToEndMs(eventLog);
}

function countPerInterval(
  eventLog: EventLog,
  predicate: (event: TestEventNoMs) => boolean,
): {
  counts: number[];
  boundaries: number[];
} {
  const { events } = eventLog;
  const boundaries = getTimerBoundaries(eventLog);

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

export function getKeypressesPerSecond(eventLog: EventLog): number[] {
  const { counts } = countPerInterval(
    eventLog,
    (e) => e.type === "input" && e.data.inputType === "insertText",
  );

  return counts;
}

export function getBurstHistory(eventLog: EventLog): number[] {
  const { counts, boundaries } = countPerInterval(
    eventLog,
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

export function getTestDurationMs(eventLog: EventLog): number {
  const { events } = eventLog;

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

  if (eventLog.context.mode === "zen" || eventLog.context.bailedOut) {
    const lkte = getRawLastKeypressToEndMs(eventLog);
    if (lkte < 7000) {
      end -= lkte;
    }
  }

  if (eventLog.context.mode !== "custom") {
    end = roundTo2(end / 1000) * 1000;
  }

  return end;
}

export function getDateBasedTestDurationMs(eventLog: EventLog): number {
  let start: number | undefined;
  let end: number | undefined;

  for (const event of eventLog.events) {
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
  eventLog: EventLog,
  wordIndex: number,
  simulatedInput: string,
  lastWord: boolean,
): string {
  if (eventLog.context.mode === "zen") {
    return simulatedInput;
  } else {
    const word = eventLog.context.targetWords[wordIndex];

    if (word === undefined) {
      return "";
    }

    if (word.endsWith("\n")) {
      // for multiline, dont add space
      return word;
    }

    let wordEnd = "";

    if (!lastWord) {
      wordEnd = " ";
    }

    if (eventLog.context.isFunboxWithNospacePropertyActive) {
      wordEnd = "";
    }

    return word + wordEnd;
  }
}

function computeBurst(events: TestEventNoMs[], now?: number): number {
  const inputEvents = events.filter((e) => e.type === "input");
  const input = getInputFromDom(inputEvents);

  let inputLength = input.length;
  if (!input.endsWith(" ") && !input.endsWith("\n")) {
    inputLength += 1; // account for trigger char (space/newline) on word submit
  }

  let firstKeypressTime: number | undefined;
  let lastKeypressTime: number | undefined;

  for (const event of events) {
    if (
      event.type === "composition" &&
      event.data.event === "start" &&
      firstKeypressTime === undefined
    ) {
      firstKeypressTime = event.testMs;
    }

    if (event.type === "input" && event.data.inputType === "insertText") {
      if (event.data.charIndex === 0 && firstKeypressTime === undefined) {
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

export function getWordBurst(
  eventLog: EventLog,
  wordIndex: number,
  now?: number,
): number {
  const events = getEventsForWord(eventLog.events, wordIndex);
  return computeBurst(events, now);
}

export function getWordBurstHistory(eventLog: EventLog): number[] {
  const eventsPerWord = getEventsPerWord(eventLog.events);
  const burstHistory: number[] = [];
  for (let i = 0; i < TestWords.words.length; i++) {
    burstHistory.push(computeBurst(eventsPerWord.get(i) ?? []));
  }
  return burstHistory;
}

function countCharsForWordIndex(
  eventLog: EventLog,
  wordIndex: number,
  wordEvents: TestEventNoMs[],
  lastWord: boolean,
  countPartial: boolean,
): CharCounts {
  let simulatedInput = getInputFromDom(wordEvents);
  if (eventLog.context.koreanStatus) {
    simulatedInput = Hangul.disassemble(simulatedInput).join("");
  }

  let targetWord = getTargetWord(eventLog, wordIndex, simulatedInput, lastWord);
  if (eventLog.context.koreanStatus) {
    targetWord = Hangul.disassemble(targetWord).join("");
  }

  return countChars(simulatedInput, targetWord, lastWord && countPartial);
}

function inferActiveWordIndex(
  eventsPerWord: Map<number, TestEventNoMs[]>,
): number {
  let maxWordIndex = -1;
  let lastWordEvents: TestEventNoMs[] | undefined;
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
    "inputType" in lastEvt.data &&
    lastEvt.data.inputType === "insertText" &&
    lastEvt.data.data === " "
  ) {
    return maxWordIndex + 1;
  }
  return maxWordIndex;
}

export function getChars(
  eventLog: EventLog,
  countPartialLastWord = false,
): CharCounts {
  const { events, context } = eventLog;
  const { bailedOut } = context;

  const isTimedTest =
    context.mode === "time" ||
    (context.mode === "words" && context.mode2 === "0") ||
    (context.mode === "custom" && context.customTextLimitMode === "time") ||
    (context.mode === "custom" && context.customTextLimitValue === 0);

  const eventsPerWord = getEventsPerWord(events);
  const lastWordIndex = inferActiveWordIndex(eventsPerWord);

  const countPartial = isTimedTest || bailedOut || countPartialLastWord;

  const acc: CharCounts = {
    allCorrect: 0,
    correctWord: 0,
    incorrect: 0,
    extra: 0,
    missed: 0,
  };

  for (const [wordIndex, wordEvents] of eventsPerWord) {
    const lastWord = wordIndex === lastWordIndex;
    const c = countCharsForWordIndex(
      eventLog,
      wordIndex,
      wordEvents,
      lastWord,
      countPartial,
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

export function getInputHistory(eventLog: EventLog): string[] {
  const eventsPerWordIndex = getEventsPerWord(eventLog.events);
  const history: string[] = [];

  for (const [wordIndex, events] of eventsPerWordIndex) {
    const lastEvent = events[events.length - 1];
    if (lastEvent === undefined) {
      history.push("");
      continue;
    }

    // THANKS FIREFOX FOR THIS MESS
    // A word is abandoned if the regression destination event — which
    // lives in the previous word's bucket — carries clearedNextWord.
    // Happens when Ctrl+Backspace eats the sentinel + non-word residue as
    // one run; the residue stays as this word's last inputValue but its
    // real final state is "".
    const previousWord = eventsPerWordIndex.get(wordIndex - 1) ?? [];
    const abandoned = previousWord.some(
      (e) =>
        e.testMs > lastEvent.testMs &&
        "clearedNextWord" in e.data &&
        e.data.clearedNextWord === true,
    );

    history.push(abandoned ? "" : getInputFromDom(events));
  }

  return history;
}

export function getAccuracy(eventLog: EventLog): {
  correct: number;
  incorrect: number;
  percentage: number;
} {
  const { events } = eventLog;

  let correct = 0;
  let incorrect = 0;

  for (const event of events) {
    if (event.type !== "input") continue;

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

export function getKeypressSpacing(eventLog: EventLog): number[] {
  const { events } = eventLog;

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

export function getKeypressOverlap(eventLog: EventLog): number {
  const { events } = eventLog;

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

export function getWordIndexesForSecond(
  eventLog: EventLog,
  second: number,
): number[] {
  const { events } = eventLog;
  const boundaries = getTimerBoundaries(eventLog);

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

export function getErrorCountHistory(eventLog: EventLog): number[] {
  const { counts } = countPerInterval(
    eventLog,
    (e) =>
      e.type === "input" &&
      e.data.inputType === "insertText" &&
      !e.data.correct,
  );
  return counts;
}

export function getWpmHistory(eventLog: EventLog): number[] {
  const { events } = eventLog;
  const boundaries = getTimerBoundaries(eventLog);
  if (boundaries.length === 0) return [];

  const eventsPerWord = new Map<number, TestEventNoMs[]>();
  const cachedIfLast = new Map<number, number>();
  const cachedIfNotLast = new Map<number, number>();
  const dirty = new Set<number>();
  const wpmHistory: number[] = [];

  let eventIdx = 0;

  for (const boundary of boundaries) {
    // incrementally extend eventsPerWord with events up to this boundary
    while (eventIdx < events.length) {
      const event = events[eventIdx];
      if (event === undefined || event.testMs > boundary) break;

      if ("wordIndex" in event.data) {
        const wordIndex = event.data.wordIndex;
        let list = eventsPerWord.get(wordIndex);
        if (list === undefined) {
          list = [];
          eventsPerWord.set(wordIndex, list);
        }
        list.push(event);
        dirty.add(wordIndex);
      }
      eventIdx++;
    }

    // recompute correctWord (for both last/not-last roles) only for words
    // whose event lists changed since the previous boundary
    for (const wordIndex of dirty) {
      const wordEvents = eventsPerWord.get(wordIndex);
      if (wordEvents === undefined) continue;
      cachedIfNotLast.set(
        wordIndex,
        countCharsForWordIndex(eventLog, wordIndex, wordEvents, false, true)
          .correctWord,
      );
      cachedIfLast.set(
        wordIndex,
        countCharsForWordIndex(eventLog, wordIndex, wordEvents, true, true)
          .correctWord,
      );
    }
    dirty.clear();

    const lastWordIndex = inferActiveWordIndex(eventsPerWord);

    let correctWord = 0;
    for (const wordIndex of eventsPerWord.keys()) {
      if (wordIndex === lastWordIndex) {
        correctWord += cachedIfLast.get(wordIndex) ?? 0;
        break;
      }
      correctWord += cachedIfNotLast.get(wordIndex) ?? 0;
    }

    wpmHistory.push(Math.round(calculateWpm(correctWord, boundary / 1000)));
  }

  return wpmHistory;
}

export function getRawHistory(eventLog: EventLog): number[] {
  const { events } = eventLog;
  const boundaries = getTimerBoundaries(eventLog);
  if (boundaries.length === 0) return [];

  const eventsPerWord = new Map<number, TestEventNoMs[]>();
  const cachedIfLast = new Map<number, number>();
  const cachedIfNotLast = new Map<number, number>();
  const dirty = new Set<number>();
  const rawHistory: number[] = [];

  let eventIdx = 0;

  for (const boundary of boundaries) {
    // incrementally extend eventsPerWord with events up to this boundary
    while (eventIdx < events.length) {
      const event = events[eventIdx];
      if (event === undefined || event.testMs > boundary) break;

      if ("wordIndex" in event.data) {
        const wordIndex = event.data.wordIndex;
        let list = eventsPerWord.get(wordIndex);
        if (list === undefined) {
          list = [];
          eventsPerWord.set(wordIndex, list);
        }
        list.push(event);
        dirty.add(wordIndex);
      }
      eventIdx++;
    }

    // recompute correctWord (for both last/not-last roles) only for words
    // whose event lists changed since the previous boundary
    for (const wordIndex of dirty) {
      const wordEvents = eventsPerWord.get(wordIndex);
      if (wordEvents === undefined) continue;

      const notLastCount = countCharsForWordIndex(
        eventLog,
        wordIndex,
        wordEvents,
        false,
        true,
      );
      const lastCount = countCharsForWordIndex(
        eventLog,
        wordIndex,
        wordEvents,
        true,
        true,
      );

      cachedIfNotLast.set(
        wordIndex,
        notLastCount.allCorrect + notLastCount.extra + notLastCount.incorrect,
      );
      cachedIfLast.set(
        wordIndex,
        lastCount.allCorrect + lastCount.extra + lastCount.incorrect,
      );
    }
    dirty.clear();

    const lastWordIndex = inferActiveWordIndex(eventsPerWord);

    let chars = 0;
    for (const wordIndex of eventsPerWord.keys()) {
      if (wordIndex === lastWordIndex) {
        chars += cachedIfLast.get(wordIndex) ?? 0;
        break;
      }
      chars += cachedIfNotLast.get(wordIndex) ?? 0;
    }

    rawHistory.push(Math.round(calculateWpm(chars, boundary / 1000)));
  }

  return rawHistory;
}

export function getAfkDuration(eventLog: EventLog): number {
  const { counts } = countPerInterval(
    eventLog,
    (e) => e.type === "keydown" || e.type === "input",
  );
  return counts.reduce((total, c) => total + (c === 0 ? 1 : 0), 0);
}

export function getKeypressDurations(eventLog: EventLog): number[] {
  const { events } = eventLog;

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

export function getMissedWords(eventLog: EventLog): Record<string, number> {
  const missedWords: Record<string, number> = Object.create(null) as Record<
    string,
    number
  >;

  for (const event of eventLog.events) {
    if (
      event.type === "input" &&
      event.data.inputType === "insertText" &&
      !event.data.correct
    ) {
      const word = TestWords.words.list[event.data.wordIndex];
      if (word === undefined) continue;
      missedWords[word] = (missedWords[word] ?? 0) + 1;
    }
  }

  return missedWords;
}

export function getCorrectedWordsHistory(eventLog: EventLog): string[] {
  const ev = getEventsPerWord(eventLog.events);
  const correctedWords: string[] = [];

  for (const [, events] of ev.entries()) {
    const correctedChars: string[] = [];
    const currentChars: string[] = [];
    let cursorPos = 0;

    for (const event of events) {
      if (event.type !== "input") continue;
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
  inferActiveWordIndex,
};
