import { roundTo2, safeNumber } from "@monkeytype/util/numbers";
import * as TestStats from "./test-stats";

type KeydownEvent = {
  type: "keydown";
  ms: number;
  code: string;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
  repeat: boolean;
};

type KeyupEvent = {
  type: "keyup";
  ms: number;
  code: string;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
  estimated?: true;
};

export type TimerEvent = {
  type: "timer";
  mode: "start" | "step" | "end";
  ms: number;
  time?: number;
  nextDelay?: number;
  slowTimer?: boolean;
};

export type InputEvent =
  | {
      type: "input";
      mode: "insert";
      ms: number;
      char: string;
      correct: boolean;
      input: string;
      targetWord: string;
      wordIndex: number;
    }
  | {
      type: "input";
      mode: "remove";
      ms: number;
      input: string;
      targetWord: string;
      wordIndex: number;
    };

let keydownEvents: KeydownEvent[] = [];
let keyupEvents: KeyupEvent[] = [];
let timerEvents: TimerEvent[] = [];
let inputEvents: InputEvent[] = [];

type TimerStepEvents = {
  keydown: KeydownEvent[];
  keyup: KeyupEvent[];
  input: InputEvent[];
};

let eventsByTime: {
  [key: string]: TimerStepEvents;
} = {};

let noCodeId = 0;
let pressedKeys: Map<string, boolean> = new Map<string, boolean>();
let timerStepEvents: TimerStepEvents = {
  keydown: [],
  keyup: [],
  input: [],
};

export function log(
  event: KeydownEvent | KeyupEvent | TimerEvent | InputEvent
): void {
  const start = TestStats.start ?? 0;
  event.ms = event.ms - start;

  if (event.type === "keydown") {
    if (event.code === "NoCode") {
      noCodeId++;
      event.code = `NoCode${noCodeId}`;
    }
    pressedKeys.set(event.code, true);
    keydownEvents.push(event);
  } else if (event.type === "keyup") {
    delete event.estimated;
    if (event.code === "NoCode") {
      event.code = `NoCode${noCodeId}`;
      noCodeId--;
    }
    pressedKeys.delete(event.code);
    keyupEvents.push(event);
  } else if (event.type === "timer") {
    timerEvents.push(event);
  } else if (event.type === "input") {
    inputEvents.push(event);
  }

  if (event.type !== "timer") {
    if (event.type === "keydown") {
      timerStepEvents.keydown.push(event);
    } else if (event.type === "keyup") {
      timerStepEvents.keyup.push(event);
    } else if (event.type === "input") {
      timerStepEvents.input.push(event);
    }
  } else {
    if (event.mode === "step" || event.mode === "end") {
      // eventsByTime[event.time as number] = timerStepEvents.sort(
      //   (a, b) => a.ms - b.ms
      // );

      const alreadyExists = eventsByTime[event.time as number];
      if (alreadyExists) {
        eventsByTime[event.time as number]?.keydown.push(
          ...timerStepEvents.keydown
        );
        eventsByTime[event.time as number]?.keyup.push(
          ...timerStepEvents.keyup
        );
        eventsByTime[event.time as number]?.input.push(
          ...timerStepEvents.input
        );
      } else {
        eventsByTime[event.time as number] = timerStepEvents;
      }

      timerStepEvents = {
        keydown: [],
        keyup: [],
        input: [],
      };
    }
  }
}

export function forceKeyup(): void {
  //grab average keypress duration and also check which keys are still pressed
  let total = 0;
  let count = 0;
  const eventsWithoutKeyup: KeydownEvent[] = [];
  for (const event of keydownEvents) {
    const nextEvent = keyupEvents.find(
      (e) => e.code === event.code && e.ms > event.ms
    );

    if (nextEvent) {
      total += nextEvent.ms - event.ms;
      count++;
    } else {
      eventsWithoutKeyup.push(event);
    }
  }
  let avg = total / count;
  if (isNaN(avg)) {
    //sometimes (rarely, only in very short tests), its possible to finish a test with all keys held
    //in this case just revert to a magic number i pulled out of thin air
    avg = 80;
  }

  //log keyup events
  for (const event of eventsWithoutKeyup) {
    const keyup: KeyupEvent = {
      type: "keyup",
      ms: event.ms + avg,
      code: event.code,
      shift: event.shift,
      ctrl: event.ctrl,
      alt: event.alt,
      meta: event.meta,
      estimated: true,
    };
    keyupEvents.push(keyup);
  }
}

export function reset(): void {
  keydownEvents = [];
  keyupEvents = [];
  timerEvents = [];
  inputEvents = [];
  eventsByTime = {};
  timerStepEvents = {
    keydown: [],
    keyup: [],
    input: [],
  };
  noCodeId = 0;
  pressedKeys = new Map<string, boolean>();
}

export function getKeydownEvents(): KeydownEvent[] {
  return keydownEvents;
}

export function getKeyupEvents(): KeyupEvent[] {
  return keyupEvents;
}

export function getTimerEvents(): TimerEvent[] {
  return timerEvents;
}

function getInputEvents(): InputEvent[] {
  return inputEvents;
}

export function getAll(): (
  | KeydownEvent
  | KeyupEvent
  | TimerEvent
  | InputEvent
)[] {
  return [
    ...keydownEvents,
    ...keyupEvents,
    ...timerEvents,
    ...inputEvents,
  ].sort((a, b) => a.ms - b.ms);
}

export function calculateAccuracy(): {
  correct: number;
  incorrect: number;
  accuracy: number;
} {
  let correct = 0;
  let incorrect = 0;
  for (const event of inputEvents) {
    if (event.mode !== "insert") continue;
    if (event.correct) {
      correct++;
    } else {
      incorrect++;
    }
  }
  return {
    correct,
    incorrect,
    accuracy: roundTo2((correct / (correct + incorrect)) * 100),
  };
}

export function getEventsByTime(): {
  [key: string]: TimerStepEvents;
} {
  return eventsByTime;
}

export function groupInputEventsByTimer(): {
  [key: number]: InputEvent[];
} {
  const grouped: { [key: number]: InputEvent[] } = {};

  let current: InputEvent[] = [];
  let time = 0;

  for (const event of [...inputEvents, ...timerEvents].sort(
    (a, b) => a.ms - b.ms
  )) {
    if (event.type === "input") {
      current.push(event);
    } else if (event.type === "timer") {
      if (current.length > 0) {
        grouped[time] = [...current];
        time++;
        current = [];
      }
    }
  }

  return grouped;
}

//todo probably memorize this
export function calculateBurstHistory(): number[] {
  const burst: number[] = [];
  let start;
  let lastInsertEvent: InputEvent | undefined = undefined;
  for (const event of inputEvents) {
    if (event.mode !== "insert") continue;
    lastInsertEvent = event;
    if (event.input.length === 0) {
      start = event.ms;
    }
    if (event.char === " ") {
      if (start !== undefined) {
        const burstTimeMs = event.ms - start;
        const wpm = roundTo2(
          (event.input.length * (60 / (burstTimeMs / 1000))) / 5
        );
        if (burst[event.wordIndex] !== undefined) {
          burst[event.wordIndex] = wpm;
        } else {
          burst.push(wpm);
        }
        start = undefined;
      } else {
        throw new Error("Found space but no word start time");
      }
    }
  }
  if (start !== undefined && lastInsertEvent) {
    const burstTimeMs = lastInsertEvent.ms - start;
    console.log(burstTimeMs);
    const wpm = roundTo2(
      ((lastInsertEvent.input.length + lastInsertEvent.char.length) *
        (60 / (burstTimeMs / 1000))) /
        5
    );
    burst.push(wpm);
    start = undefined;
  }
  return burst;
}

export function calculateBurstForWord(wordIndex: number): number {
  let startMs;
  for (const event of inputEvents) {
    if (event.mode !== "insert") continue;
    if (event.wordIndex !== wordIndex) continue;
    if (event.input.length === 0) {
      startMs = event.ms;
    }
    if (event.char === " ") {
      if (startMs !== undefined) {
        const burstTimeMs = event.ms - startMs;
        const wpm = roundTo2(
          (event.input.length * (60 / (burstTimeMs / 1000))) / 5
        );
        return wpm;
      } else {
        throw new Error("Found space but no word start time");
      }
    }
  }
  return 0;
}

export function getWordIndexesForTime(time: number): number[] {
  return (
    Object.values(getEventsByTime())[time]?.input.map(
      (event) => event.wordIndex
    ) ?? []
  );
}

export function getMissedWords(): Record<string, number> {
  return getInputEvents().reduce<Record<string, number>>((acc, event) => {
    if (event.mode !== "insert") return acc;
    if (!event.correct) {
      const word = event.targetWord;
      acc[word] = (safeNumber(acc[word]) ?? 0) + 1;
    }
    return acc;
  }, {});
}

export function getRawHistory(): number[] {
  return Object.values(getEventsByTime()).map((events) =>
    Math.round((events.input.length / 5) * 60)
  );
}

export function getErrorHistory(): number[] {
  return Object.values(getEventsByTime()).map(
    (events) =>
      events.input.filter((e) => e.mode === "insert" && !e.correct).length
  );
}

export function isAfkInLast5Seconds(): boolean {
  return Object.values(getEventsByTime())
    .map((e) => e.input.length)
    .slice(-5)
    .every((n) => n === 0);
}

export function calculateAfkSeconds(): number {
  return Object.values(getEventsByTime()).filter((e) => e.input.length === 0)
    .length;
}

export function getUniqueMissedWords(): string[] {
  return Object.keys(getMissedWords());
}

export function getWpmHistory(): number[] {
  const history: number[] = [];
  for (let i = 0; i < Object.keys(eventsByTime).length; i++) {
    const wpm = getWpmForTimeIndex(i);
    history.push(wpm);
  }
  return history;
}

export function getWpmForTimeIndex(timeIndex: number): number {
  const events = Object.values(getEventsByTime())[timeIndex];
  if (!events) throw new Error("No events for this time index");
  let chars = 0;
  let currentWordIndex = 0;
  let lastEvent: InputEvent | undefined = undefined;
  for (const event of events.input) {
    if (event.mode === "insert") {
      if (event.wordIndex > currentWordIndex) {
        if (lastEvent && lastEvent.targetWord.startsWith(lastEvent.input)) {
          chars += lastEvent.input.length;
        }
        currentWordIndex = event.wordIndex;
      }

      lastEvent = event;
    }
  }

  if (lastEvent) {
    if (lastEvent.targetWord.startsWith(lastEvent.input)) {
      chars += lastEvent.input.length;
    }
    chars += lastEvent.char.length;
  }

  const time = Object.keys(getEventsByTime())[timeIndex];

  if (time === undefined) {
    throw new Error("No time for this time index");
  }

  const timeFloat = parseFloat(time);

  const wpm = Math.round((chars / 5) * (60 / timeFloat));
  return wpm;
}

// oxlint-disable-next-line ban-ts-comment
//@ts-ignore
window["testEvents"] = getAll;

// oxlint-disable-next-line ban-ts-comment
//@ts-ignore
window["groupInputEventsByTimer"] = groupInputEventsByTimer;

// oxlint-disable-next-line ban-ts-comment
//@ts-ignore
window["eventsByTime"] = getEventsByTime;

// oxlint-disable-next-line ban-ts-comment
//@ts-ignore
window["burst"] = calculateBurstHistory;

// oxlint-disable-next-line ban-ts-comment
//@ts-ignore
window["wpmHistory"] = getWpmHistory;

// oxlint-disable-next-line ban-ts-comment
//@ts-ignore
window["getWpmForTimeIndex"] = getWpmForTimeIndex;
