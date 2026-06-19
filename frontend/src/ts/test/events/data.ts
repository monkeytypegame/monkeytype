import {
  CompositionTestEvent,
  CompositionTestEventData,
  EVENT_LOG_VERSION,
  EventLog,
  InputEvent,
  InputEventData,
  KeydownEvent,
  KeydownEventData,
  KeyupEvent,
  KeyupEventData,
  TestEvent,
  TestEventData,
  TestEventNoMs,
  TestEventType,
  TimerEvent,
  TimerEventData,
} from "./types";
import { getEventsForWord, getInputFromDom, keysToTrack } from "./helpers";
import { Keycode } from "../../constants/keys";
import { isSafeNumber, mean, roundTo2 } from "@monkeytype/util/numbers";
import {
  bailedOut,
  koreanStatus,
  activeWordIndex,
  resultCalculating,
} from "../test-state";
import * as TestWords from "../test-words";
import { Config } from "../../config/store";
import * as CustomText from "../../test/custom-text";
import { getMode2 } from "../../utils/misc";
import { getCurrentQuote } from "../../states/test";
import { isFunboxActiveWithProperty } from "../funbox/active";

export function buildEventLog(): EventLog {
  const context = {
    targetWords: [...TestWords.words.list],
    mode: Config.mode,
    mode2: getMode2(Config, getCurrentQuote()),
    koreanStatus: koreanStatus,
    bailedOut: bailedOut,
    ...(Config.mode === "custom" && {
      customTextLimitMode: CustomText.getLimit().mode,
      customTextLimitValue: CustomText.getLimit().value,
    }),
    ...(Config.funbox.length !== 0 && {
      isFunboxWithNospacePropertyActive: isFunboxActiveWithProperty("nospace"),
    }),
  };

  return {
    version: EVENT_LOG_VERSION,
    events: getAllTestEvents(),
    context,
  };
}

let keydownEvents: KeydownEvent[] = [];
let keyupEvents: KeyupEvent[] = [];
let timerEvents: TimerEvent[] = [];
let inputEvents: InputEvent[] = [];
let compositionEvents: CompositionTestEvent[] = [];

let cachedAllEvents: TestEventNoMs[] | undefined;

const liveCache = {
  correctInputs: 0,
  totalInputs: 0,
  timerStartMs: null as number | null,
};

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

  if (!isSafeNumber(now)) {
    throw new Error(`Invalid timestamp: ${now}`);
  }

  //strip undefined values from eventData
  eventData = Object.fromEntries(
    Object.entries(eventData).filter(([_, v]) => v !== undefined),
  ) as TestEventData;

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

    if ((eventData as TimerEventData).event === "start") {
      liveCache.timerStartMs = now;
    }
  } else if (type === "input") {
    const data = eventData as InputEventData;
    inputEvents.push({
      type,
      ms: now,
      testMs: 0,
      data,
    });
    if ("correct" in data) {
      liveCache.totalInputs++;
      if (data.correct) liveCache.correctInputs++;
    }
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

export function getCurrentInput(): string {
  const last = inputEvents[inputEvents.length - 1];

  if (last !== undefined) {
    const lastWordIndex = last.data.wordIndex;
    //just advanced to a new word - no input event for it yet
    if (lastWordIndex + 1 === activeWordIndex) return "";
    //last event is for the active word - return its snapshot
    if (
      lastWordIndex === activeWordIndex &&
      last.data.inputValue !== undefined
    ) {
      return last.data.inputValue;
    }
  }

  return getInputFromDom(getEventsForWord(getAllTestEvents(), activeWordIndex));
}

export function getInputForWord(wordIndex: number): string {
  return getInputFromDom(
    getEventsForWord(getAllTestEvents(), wordIndex),
  ).trimEnd();
}

export function cleanupData(): void {
  const timerStart = timerEvents.find((e) => e.data.event === "start");
  const timerEnd = timerEvents.find((e) => e.data.event === "end");

  if (timerStart !== undefined) {
    // keep only the last pre-start keydown; drop all pre-start keyups
    let lastPreStartKeydown: KeydownEvent | undefined;
    for (const e of keydownEvents) {
      if (e.ms < timerStart.ms) lastPreStartKeydown = e;
      else break;
    }
    keydownEvents = keydownEvents.filter(
      (e) => e.ms >= timerStart.ms || e === lastPreStartKeydown,
    );
    keyupEvents = keyupEvents.filter((e) => e.ms >= timerStart.ms);
  }

  if (timerEnd !== undefined) {
    inputEvents = inputEvents.filter((e) => e.ms <= timerEnd.ms);
    const postEndKeydownCodes = new Set(
      keydownEvents.filter((e) => e.ms > timerEnd.ms).map((e) => e.data.code),
    );
    keydownEvents = keydownEvents.filter((e) => e.ms <= timerEnd.ms);
    keyupEvents = keyupEvents.filter(
      (e) => e.ms <= timerEnd.ms || !postEndKeydownCodes.has(e.data.code),
    );
    recomputeLiveCache();
  }

  invalidateCache();
}

function recomputeLiveCache(): void {
  liveCache.correctInputs = 0;
  liveCache.totalInputs = 0;
  liveCache.timerStartMs = null;
  for (const e of inputEvents) {
    if ("correct" in e.data) {
      liveCache.totalInputs++;
      if (e.data.correct) liveCache.correctInputs++;
    }
  }
  for (const e of timerEvents) {
    if (e.data.event === "start") {
      liveCache.timerStartMs = e.ms;
      break;
    }
  }
}

export function getLiveCache(): Readonly<typeof liveCache> {
  return { ...liveCache };
}

export function getAllTestEvents(): TestEventNoMs[] {
  if (cachedAllEvents !== undefined) return cachedAllEvents;

  const total =
    keydownEvents.length +
    keyupEvents.length +
    timerEvents.length +
    inputEvents.length +
    compositionEvents.length;

  if (total === 0) {
    cachedAllEvents = [];
    return cachedAllEvents;
  }

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
    timerEvents.find((e) => e.data.event === "start")?.ms ?? firstEventMs;

  if (!isSafeNumber(startEventMs)) {
    throw new Error(`Invalid startEventMs: ${startEventMs}`);
  }

  const merged = new Array<TestEvent>(total);
  let p = 0;
  for (const e of keydownEvents) merged[p++] = e;
  for (const e of keyupEvents) merged[p++] = e;
  for (const e of timerEvents) merged[p++] = e;
  for (const e of inputEvents) merged[p++] = e;
  for (const e of compositionEvents) merged[p++] = e;

  cachedAllEvents = merged
    .sort((a, b) => a.ms - b.ms || sortTieRank(a.type) - sortTieRank(b.type))
    .map(
      (event) =>
        ({
          type: event.type,
          testMs: roundTo2(event.ms - startEventMs),
          data: event.data,
        }) as TestEventNoMs,
    );

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
  liveCache.correctInputs = 0;
  liveCache.totalInputs = 0;
  liveCache.timerStartMs = null;
}

export function getPressedKeys(): Map<
  Keycode | "NoCode" | `NoCode${number}`,
  { timestamp: number }
> {
  return pressedKeys;
}

export function forceReleaseAllKeys(): void {
  const keydownMsByCode = new Map<string, number>();
  for (const e of keydownEvents) keydownMsByCode.set(e.data.code, e.ms);

  const durations: number[] = [];
  for (const e of keyupEvents) {
    const downMs = keydownMsByCode.get(e.data.code);
    if (downMs === undefined) continue;
    const d = e.ms - downMs;
    if (d > 0) durations.push(d);
    keydownMsByCode.delete(e.data.code);
  }

  // empty → test ended with all keys still held; will be "too short" anyway, magic number is fine
  const avg = durations.length === 0 ? 80 : roundTo2(mean(durations));

  for (const [key, { timestamp }] of pressedKeys.entries()) {
    logTestEvent("keyup", timestamp + avg, {
      code: key, //entries is not picking up the type
      estimated: true,
    });
  }
}

export function getLastKeypressSpacing(): number | undefined {
  const events = getAllTestEvents();
  let last: number | undefined;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]?.type !== "keydown") continue;
    const ms = (events[i] as TestEventNoMs).testMs;
    if (last === undefined) last = ms;
    else return Math.max(0, roundTo2(last - ms));
  }
  return undefined;
}

export const __testing = {
  resetPressedKeys(): void {
    pressedKeys = new Map();
    noCodeIndex = 0;
  },
};
