import {
  CompositionTestEvent,
  CompositionTestEventData,
  InputEvent,
  InputEventData,
  KeydownEvent,
  KeydownEventData,
  KeyupEvent,
  KeyupEventData,
  InputEventNoMs,
  TestEventData,
  TestEventNoMs,
  TestEventType,
  TimerEvent,
  TimerEventData,
} from "./types";
import { keysToTrack } from "./helpers";
import { Keycode } from "../../constants/keys";
import { roundTo2 } from "@monkeytype/util/numbers";
import { resultCalculating } from "../test-state";

let keydownEvents: KeydownEvent[] = [];
let keyupEvents: KeyupEvent[] = [];
let timerEvents: TimerEvent[] = [];
let inputEvents: InputEvent[] = [];
let compositionEvents: CompositionTestEvent[] = [];

let cachedAllEvents: TestEventNoMs[] | undefined;

const sortTieRank = (type: TestEventType): number =>
  type === "keyup" ? 0 : type === "keydown" ? 1 : type === "timer" ? 3 : 2;

let noCodeIndex = 0;
let pressedKeys: Map<
  Keycode | "NoCode" | `NoCode${number}`,
  {
    timestamp: number;
  }
> = new Map();

export function logTestEvent(
  type: TestEventType,
  now: number,
  eventData: TestEventData,
): void {
  invalidateCache();

  now = roundTo2(now);

  if (type === "keydown") {
    const data = eventData as KeydownEventData;
    const code = data.code as Keycode | "NoCode";

    if (!keysToTrack.has(code)) {
      return;
    }

    if (pressedKeys.has(code)) {
      pressedKeys.delete(code);
      keyupEvents.push({
        type: "keyup",
        ms: now,
        testMs: 0,
        data: { ...data, code },
      });
    }

    if (resultCalculating) {
      return;
    }

    let key: Keycode | "NoCode" | `NoCode${number}` = code;
    if (key === "NoCode") {
      key = `NoCode${noCodeIndex}`;
      noCodeIndex++;
    }

    pressedKeys.set(key, {
      timestamp: now,
    });

    keydownEvents.push({
      type,
      ms: now,
      testMs: 0,
      data: { ...data, code: key },
    });
  } else if (type === "keyup") {
    const data = eventData as KeyupEventData;
    const code = data.code;

    let key: Keycode | "NoCode" | `NoCode${number}` = code;

    if (/^NoCode\d+$/.test(code)) {
      // already indexed (e.g. from forceReleaseAllKeys)
    } else {
      if (!keysToTrack.has(code as Keycode | "NoCode")) {
        return;
      }

      if (code === "NoCode") {
        key = `NoCode${noCodeIndex - 1}`;
        if (!pressedKeys.has(key)) {
          return;
        }
        noCodeIndex--;
      }
    }

    if (!pressedKeys.has(key)) {
      //not pressed - ignore
      return;
    }

    pressedKeys.delete(key);

    keyupEvents.push({
      type,
      ms: now,
      testMs: 0,
      data: { ...data, code: key },
    });
  } else if (type === "timer") {
    timerEvents.push({
      type,
      ms: now,
      testMs: 0,
      data: eventData as TimerEventData,
    });
  } else if (type === "input") {
    inputEvents.push({
      type,
      ms: now,
      testMs: 0,
      data: eventData as InputEventData,
    });
  } else if (type === "composition") {
    compositionEvents.push({
      type,
      ms: now,
      testMs: 0,
      data: eventData as CompositionTestEventData,
    });
  } else {
    throw new Error(`Unsupported event type: ${type}`);
  }
  console.debug(`Test events - logTestEvent - ${now}ms - ${type}`, eventData);
}

function invalidateCache(): void {
  cachedAllEvents = undefined;
}

export function cleanupData(): void {
  invalidateCache();
  getAllTestEvents();

  if (cachedAllEvents === undefined) {
    throw new Error(
      "cachedAllEvents should not be undefined after getAllTestEvents",
    );
  }

  //remove all pre-start keydown/keyup events except the last keydown
  const timerStartIndex = cachedAllEvents.findIndex(
    (e) => e.type === "timer" && e.data.event === "start",
  );
  if (timerStartIndex !== -1) {
    // find the last keydown before timer start
    let lastPreStartKeydownIndex = -1;
    for (let i = timerStartIndex - 1; i >= 0; i--) {
      if (cachedAllEvents[i]?.type === "keydown") {
        lastPreStartKeydownIndex = i;
        break;
      }
    }
    cachedAllEvents = cachedAllEvents.filter((e, index) => {
      if (index >= timerStartIndex) return true;
      if (e.type === "keydown") return index === lastPreStartKeydownIndex;
      if (e.type === "keyup") return false;
      return true;
    });
  }

  //remove all input events after timer end
  const timerEndIndex = cachedAllEvents.findIndex(
    (e) => e.type === "timer" && e.data.event === "end",
  );
  if (timerEndIndex !== -1) {
    cachedAllEvents = cachedAllEvents.filter(
      (e, index) => !(e.type === "input" && index > timerEndIndex),
    );
  }

  //remove keydowns after timer end, and their associated keyups
  if (timerEndIndex !== -1) {
    const keydownsAfterTimerEnd = new Set(
      cachedAllEvents
        .filter((e, index) => e.type === "keydown" && index > timerEndIndex)
        .map((e) => (e.data as KeydownEventData).code),
    );
    cachedAllEvents = cachedAllEvents.filter((e, index) => {
      if (index <= timerEndIndex) return true;
      if (e.type === "keydown") return false;
      if (e.type === "keyup") {
        return !keydownsAfterTimerEnd.has(e.data.code);
      }
      return true;
    });
  }

  // sync source arrays back from cleaned cache
  keydownEvents = cachedAllEvents.filter(
    (e): e is KeydownEvent => e.type === "keydown",
  );
  keyupEvents = cachedAllEvents.filter(
    (e): e is KeyupEvent => e.type === "keyup",
  );
  timerEvents = cachedAllEvents.filter(
    (e): e is TimerEvent => e.type === "timer",
  );
  inputEvents = cachedAllEvents.filter(
    (e): e is InputEvent => e.type === "input",
  );
  compositionEvents = cachedAllEvents.filter(
    (e): e is CompositionTestEvent => e.type === "composition",
  );
}

export function getAllTestEvents(): TestEventNoMs[] {
  if (cachedAllEvents !== undefined) return cachedAllEvents;

  const firstEventMs = Math.min(
    ...[
      keydownEvents[0]?.ms,
      keyupEvents[0]?.ms,
      timerEvents[0]?.ms,
      inputEvents[0]?.ms,
      compositionEvents[0]?.ms,
    ].filter((ms): ms is number => ms !== undefined),
  );

  const startEventMs =
    timerEvents.find((e) => e.data.event === "start")?.ms ?? firstEventMs ?? 0;

  // cachedAllEvents = testData300;
  // return cachedAllEvents;
  cachedAllEvents = [
    ...keydownEvents,
    ...keyupEvents,
    ...timerEvents,
    ...inputEvents,
    ...compositionEvents,
  ]
    .sort((a, b) => a.ms - b.ms || sortTieRank(a.type) - sortTieRank(b.type))
    .map(({ ms, ...rest }) => ({
      ...rest,
      testMs: roundTo2(ms - startEventMs),
    }));

  return cachedAllEvents;
}

export function logEventsDataToTheConsole(): void {
  console.debug(
    getAllTestEvents().map((event) => {
      const d = event.data;
      let e = {
        ...event,
        ...event.data,
      };
      //@ts-expect-error just for logging
      delete e.data;
      //@ts-expect-error just for logging
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
      //@ts-expect-error just for logging
      delete e.data;
      //@ts-expect-error just for logging
      e = {
        ...e,
        ...d,
      };
      return e;
    }),
  );
}

export function resetTestEvents(): void {
  keydownEvents = [];
  keyupEvents = [];
  timerEvents = [];
  inputEvents = [];
  compositionEvents = [];
  invalidateCache();
  pressedKeys = new Map();
  noCodeIndex = 0;
}

export function getInputEvents(): InputEventNoMs[] {
  return getAllTestEvents().filter(
    (event): event is InputEventNoMs => event.type === "input",
  );
}

export function getPressedKeys(): Map<
  Keycode | "NoCode" | `NoCode${number}`,
  { timestamp: number }
> {
  return pressedKeys;
}

export function getInputEventsForWord(wordIndex: number): InputEventNoMs[] {
  const events = getAllTestEvents();
  const result: InputEventNoMs[] = [];
  for (const event of events) {
    if (event.type !== "input") continue;
    if (event.data.wordIndex === wordIndex) {
      result.push(event);
    }
  }
  return result;
}

export function getInputEventsPerWord(
  startMs?: number,
  testMsLimit?: number,
): Map<number, InputEventNoMs[]> {
  let eventsPerWordIndex: Map<number, InputEventNoMs[]> = new Map();
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

    const wordIndex = event.data.wordIndex;

    const existing = eventsPerWordIndex.get(wordIndex) ?? [];
    existing.push(event);
    eventsPerWordIndex.set(wordIndex, existing);
  }
  return eventsPerWordIndex;
}

export const __testing = {
  resetPressedKeys(): void {
    pressedKeys = new Map();
    noCodeIndex = 0;
  },
};
