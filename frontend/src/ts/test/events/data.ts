import * as TestStats from "../../test/test-stats";
import {
  InputEvent,
  InputEventData,
  KeydownEvent,
  KeydownEventData,
  KeyupEvent,
  KeyupEventData,
  TestEvent,
  TestEventType,
  TimerEvent,
  TimerEventData,
} from "./types";

let keydownEvents: KeydownEvent[] = [];
let keyupEvents: KeyupEvent[] = [];
let timerEvents: TimerEvent[] = [];
let inputEvents: InputEvent[] = [];

export function logTestEvent(
  type: TestEventType,
  now: number,
  eventData:
    | KeydownEventData
    | KeyupEventData
    | TimerEventData
    | InputEventData,
): void {
  let event: Omit<TestEvent, "testMs"> = {
    type,
    ms: now,
    data: eventData,
  };

  console.log("logging test event", event);

  if (type === "keydown") {
    keydownEvents.push(event as KeydownEvent);
  } else if (type === "keyup") {
    keyupEvents.push(event as KeyupEvent);
  } else if (type === "timer") {
    timerEvents.push(event as TimerEvent);
  } else if (type === "input") {
    inputEvents.push(event as InputEvent);
  }
}

export function getAllTestEvents(): TestEvent[] {
  return [...keydownEvents, ...keyupEvents, ...timerEvents, ...inputEvents]
    .sort((a, b) => a.ms - b.ms)
    .map((event) => {
      event.testMs = event.ms - TestStats.start;
      return event;
    });
}

window["testevents"] = {
  getAllTestEvents,
  _calculateRawWpmForTime,
  getInputEvents,
};

export function resetTestEvents(): void {
  keydownEvents = [];
  keyupEvents = [];
  timerEvents = [];
  inputEvents = [];
}

export function testing(): void {
  // getAllTestEvents().
}

function _calculateRawWpmForTime(
  startSecondInclusive: number,
  endSecondExclusive = startSecondInclusive + 1,
): number {
  const keypresses = getAllTestEvents().filter((event) => {
    if (
      event.testMs < startSecondInclusive * 1000 ||
      event.testMs >= endSecondExclusive * 1000
    ) {
      return false;
    }
    if (event.type !== "input") {
      return false;
    }

    if (event.data.inputType !== "insertText") {
      return false;
    }

    return true;
  });

  return keypresses.length;
}

export function getInputEvents(): InputEvent[] {
  return getAllTestEvents().filter(
    (event): event is InputEvent => event.type === "input",
  );
}

export function getInputEventsPerWord(): Map<number, InputEvent[]> {
  let eventsPerWordIndex: Map<number, InputEvent[]> = new Map();
  const events = getInputEvents();
  for (const event of events) {
    if (event.type !== "input") {
      continue;
    }

    let wordIndex = event.data.wordIndex;

    //special case for deleteWordBackward on the 0th index
    // because it clears the previous word - so we need to attribute it to the previous word
    if (
      event.data.inputType === "deleteWordBackward" &&
      event.data.charIndex === 0 &&
      wordIndex > 0
    ) {
      wordIndex -= 1;
    }

    const existing = eventsPerWordIndex.get(wordIndex) ?? [];
    existing.push(event);
    eventsPerWordIndex.set(wordIndex, existing);
  }
  return eventsPerWordIndex;
}

export function getSimulatedInput(events: InputEvent[]): string {
  let simulatedInput = "";

  for (const event of events) {
    if (event.data.inputType === "insertText") {
      simulatedInput += event.data.data;
    }
    if (event.data.inputType === "insertCompositionText") {
      simulatedInput += event.data.data;
    }
    if (event.data.inputType === "deleteContentBackward") {
      simulatedInput = simulatedInput.slice(0, -1);
    }
    if (event.data.inputType === "deleteWordBackward") {
      simulatedInput = "";
    }
  }

  return simulatedInput;
}
