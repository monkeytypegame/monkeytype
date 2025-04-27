import { roundTo2 } from "@monkeytype/util/numbers";
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

type TimerEvent = {
  type: "timer";
  mode: "start" | "step" | "end";
  ms: number;
  time?: number;
  nextDelay?: number;
  slowTimer?: boolean;
};

type InputEvent = {
  type: "input";
  ms: number;
  char: string;
  correct: boolean;
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
  event.ms = event.ms - TestStats.start;

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

export function getInputEvents(): InputEvent[] {
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

export function calculateAccuracy(): number {
  let correct = 0;
  let incorrect = 0;
  for (const event of inputEvents) {
    if (event.correct) {
      correct++;
    } else {
      incorrect++;
    }
  }
  return (correct / (correct + incorrect)) * 100;
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
  for (const event of inputEvents) {
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
  if (start !== undefined) {
    const lastInputEvent = inputEvents.slice(-1)[0];
    if (lastInputEvent === undefined) {
      throw new Error("No last input event found");
    }
    const burstTimeMs = lastInputEvent.ms - start;
    console.log(burstTimeMs);
    const wpm = roundTo2(
      ((lastInputEvent.input.length + lastInputEvent.char.length) *
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
