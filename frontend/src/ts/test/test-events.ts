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
  estimated: boolean;
};

let keydownEvents: KeydownEvent[] = [];

let keyupEvents: KeyupEvent[] = [];

type TimerEvent = {
  type: "timer";
  ms: number;
  time: number;
  nextDelay: number;
  slowTimer: boolean;
};

let timerEvents: TimerEvent[] = [];

type InputEvent = {
  type: "input";
  ms: number;
  char: string;
  correct: boolean;
  input: string;
  targetWord: string;
};

let inputEvents: InputEvent[] = [];

let noCodeId = 0;
let pressedKeys: Map<string, boolean> = new Map<string, boolean>();

export function log(
  event: KeydownEvent | Omit<KeyupEvent, "estimated"> | TimerEvent | InputEvent
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
    (event as KeyupEvent).estimated = false;
    if (event.code === "NoCode") {
      event.code = `NoCode${noCodeId}`;
      noCodeId--;
    }
    pressedKeys.delete(event.code);
    keyupEvents.push(event as KeyupEvent);
  } else if (event.type === "timer") {
    timerEvents.push(event);
  } else if (event.type === "input") {
    inputEvents.push(event);
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
      console.log(nextEvent.ms - event.ms);
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

//@ts-ignore
window["testEvents"] = getAll;
