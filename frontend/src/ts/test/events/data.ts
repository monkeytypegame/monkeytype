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
import { keysToTrack } from "./helpers";
import { getKeypressDurations } from "./stats";
import { mean, roundTo2 } from "@monkeytype/util/numbers";

let keydownEvents: KeydownEvent[] = [];
let keyupEvents: KeyupEvent[] = [];
let timerEvents: TimerEvent[] = [];
let inputEvents: InputEvent[] = [];

let noCodeIndex = 0;
let pressedKeys: Map<
  string,
  {
    timestamp: number;
  }
> = new Map();

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
    const code = (event as KeydownEvent).data.code;

    if (!keysToTrack.has(code)) {
      return;
    }

    if (pressedKeys.has(code)) {
      //already pressed - ignore
      return;
    }

    //todo: move this to input code i think
    let key = code;
    if (key === "NoCode") {
      key = "NoCode" + noCodeIndex;
      noCodeIndex++;
    }

    pressedKeys.set(key, {
      timestamp: now,
    });

    keydownEvents.push(event as KeydownEvent);
  } else if (type === "keyup") {
    const code = (event as KeyupEvent).data.code;

    if (!keysToTrack.has(code)) {
      return;
    }

    if (!pressedKeys.has(code)) {
      //not pressed - ignore
      return;
    }

    let key = code;
    if (key === "NoCode") {
      noCodeIndex--;
      key = "NoCode" + noCodeIndex;
    }

    pressedKeys.delete(key);

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

export function logEventsDataToTheConsole(): void {
  console.table(
    getAllTestEvents().map((event) => {
      const e = {
        ...event,
        ...event.data,
      };
      // @ts-expect-error just for logging to the console
      delete e.data;
      return e;
    }),
  );
}

//@ts-expect-error testing
window["testevents"] = {
  getAllTestEvents,
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

export function getInputEvents(): InputEvent[] {
  return getAllTestEvents().filter(
    (event): event is InputEvent => event.type === "input",
  );
}

export function getPressedKeys(): Map<string, { timestamp: number }> {
  return pressedKeys;
}

export function forceReleaseAllKeys(): void {
  const durations = getKeypressDurations();
  const avg = roundTo2(mean(durations));

  for (const [key, { timestamp }] of pressedKeys.entries()) {
    logTestEvent("keyup", timestamp + avg, {
      code: key,
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      repeat: false,
    });
  }
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
