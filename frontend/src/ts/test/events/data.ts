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
import { mean } from "@monkeytype/util/numbers";
import { start } from "../test-stats";

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

  console.debug("logging test event", event);

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
      key = `NoCode${noCodeIndex}`;
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
      key = `NoCode${noCodeIndex}`;
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
  // return testData300;
  return [...keydownEvents, ...keyupEvents, ...timerEvents, ...inputEvents]
    .sort((a, b) => a.ms - b.ms)
    .map((event) => {
      event.testMs = event.ms - start;
      return event;
    });
}

export function logEventsDataToTheConsole(): void {
  console.debug(
    getAllTestEvents().map((event) => {
      const d = event.data;
      let e = {
        ...event,
        ...event.data,
      };
      // @ts-expect-error just for logging to the console
      delete e.data;
      // @ts-expect-error just for logging to the console
      e = {
        ...e,
        ...d,
      };
      return e;
    }),
  );
}

export function logEventsDataToTheConsoleTable(): void {
  console.table(
    getAllTestEvents().map((event) => {
      const d = event.data;
      let e = {
        ...event,
        ...event.data,
      };
      // @ts-expect-error just for logging to the console
      delete e.data;
      // @ts-expect-error just for logging to the console
      e = {
        ...e,
        ...d,
      };
      return e;
    }),
  );
}

//@ts-expect-error testing
window["testevents"] = {
  getAllTestEvents,
  getInputEvents,
  logEventsDataToTheConsole,
  logEventsDataToTheConsoleTable,
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
    avg = mean(filteredDurations);
  }

  for (const [key, { timestamp }] of pressedKeys.entries()) {
    logTestEvent("keyup", timestamp + avg, {
      code: key,
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    });
  }
}

export function getInputEventsPerWord(
  startMs?: number,
  testMsLimit?: number,
): Map<number, InputEvent[]> {
  let eventsPerWordIndex: Map<number, InputEvent[]> = new Map();
  const events = getAllTestEvents();
  for (const event of events) {
    if (event.type !== "input") {
      continue;
    }

    if (startMs !== undefined && event.testMs < startMs) {
      continue;
    }

    if (testMsLimit !== undefined && event.testMs > testMsLimit) {
      break;
    }

    let wordIndex = event.data.wordIndex;

    //special case for delete events on the 0th index
    // because they affect the previous word - so we need to attribute them to the previous word
    if (
      (event.data.inputType === "deleteWordBackward" ||
        event.data.inputType === "deleteContentBackward") &&
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
