import { InputEventNoMs, TestEventNoMs } from "./types";

export function applyInputEvent(input: string, event: InputEventNoMs): string {
  if (event.data.inputType === "insertText") {
    if (event.data.inputStopped) return input;
    if (
      event.data.data === " " &&
      event.data.lastWord &&
      event.data.commitsWord &&
      !event.data.correct
    ) {
      // if this is an incorrect word commit on the last word, we dont want to count it at all
      return input;
    }
    return input + event.data.data;
  }
  if (event.data.inputType === "insertCompositionText") {
    if (event.data.inputStopped) return input;
    return input + event.data.data;
  }
  if (event.data.inputType === "deleteContentBackward") {
    return input.slice(0, -1);
  }
  if (event.data.inputType === "deleteWordBackward") {
    return input.replace(/(?:\S+\s*|\s+)$/, "");
  }
  return input;
}

export function getInputFromDom(events: TestEventNoMs[]): string {
  let lastInputEvent: InputEventNoMs | undefined;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e?.type === "input") {
      lastInputEvent = e;
      break;
    }
  }

  if (lastInputEvent === undefined) return "";

  const { data } = lastInputEvent;
  const inputValue = data.inputValue;

  if (
    data.inputType === "insertText" &&
    data.data === " " &&
    data.lastWord &&
    data.commitsWord &&
    !data.correct
  ) {
    // if this is an incorrect word commit on the last word, we dont want to count it at all
    return inputValue.trimEnd();
  }

  return inputValue;
}

export type InputValueMismatch = {
  index: number;
  derived: string;
  recorded: string;
};

/**
 * Compares event-derived input against the recorded DOM snapshot at each
 * event. Returns the indices where event-derivation disagreed with what the
 * DOM captured. Useful for catching op-logic bugs or capture-timing bugs.
 */
export function findInputValueMismatches(
  events: InputEventNoMs[],
): InputValueMismatch[] {
  const mismatches: InputValueMismatch[] = [];
  let derived = "";

  for (let i = 0; i < events.length; i++) {
    const event = events[i] as InputEventNoMs;
    derived = applyInputEvent(derived, event);

    if (
      event.data.inputValue !== undefined &&
      event.data.inputValue !== derived
    ) {
      mismatches.push({
        index: i,
        derived,
        recorded: event.data.inputValue,
      });
    }
  }

  return mismatches;
}

export function getEventsPerWord(
  events: TestEventNoMs[],
  testMsLimit?: number,
): Map<number, TestEventNoMs[]> {
  let eventsPerWordIndex: Map<number, TestEventNoMs[]> = new Map();
  for (const event of events) {
    if (!("wordIndex" in event.data)) {
      continue;
    }

    if (testMsLimit !== undefined && event.testMs > testMsLimit) {
      break;
    }

    const wordIndex = event.data.wordIndex;

    const existing = eventsPerWordIndex.get(wordIndex) ?? [];
    existing.push(event);
    eventsPerWordIndex.set(wordIndex, existing);
  }
  return eventsPerWordIndex;
}

export function getEventsForWord(
  events: TestEventNoMs[],
  wordIndex: number,
): TestEventNoMs[] {
  const result: TestEventNoMs[] = [];
  for (const event of events) {
    if (!("wordIndex" in event.data)) continue;
    if (event.data.wordIndex === wordIndex) {
      result.push(event);
    }
  }
  return result;
}
