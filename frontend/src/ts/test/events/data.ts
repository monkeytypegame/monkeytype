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
import { mean } from "@monkeytype/util/numbers";
import testData300 from "./test-data-300";

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
  return testData300;
  return [...keydownEvents, ...keyupEvents, ...timerEvents, ...inputEvents]
    .sort((a, b) => a.ms - b.ms)
    .map((event) => {
      event.testMs = event.ms - TestStats.start;
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

export function simulateInput(testMsLimit?: number): Map<number, string> {
  const events = getAllTestEvents();
  let simulatedInputMap: Map<number, string> = new Map();
  let simulatedInput = "";
  let lastWordIndex;
  for (const event of events) {
    if (testMsLimit !== undefined && event.testMs > testMsLimit) {
      break;
    }

    if (event.type !== "input") {
      continue;
    }

    if (lastWordIndex === undefined) {
      lastWordIndex = event.data.wordIndex;
    }

    if (event.data.wordIndex > lastWordIndex) {
      //new word - reset simulated input
      simulatedInputMap.set(lastWordIndex, simulatedInput);
      simulatedInput = "";
      lastWordIndex = event.data.wordIndex;
    }

    if (event.data.wordIndex < lastWordIndex) {
      // went back to previous word - store current simulated input and reset
      simulatedInputMap.delete(lastWordIndex);
      simulatedInput = simulatedInputMap.get(event.data.wordIndex) ?? "";
      lastWordIndex = event.data.wordIndex;
    }

    if (event.data.inputType === "insertText") {
      simulatedInput += event.data.data;
    }
    if (event.data.inputType === "insertCompositionText") {
      simulatedInput += event.data.data;
    }
    if (event.data.inputType === "deleteContentBackward") {
      if (event.data.charIndex === 0) {
        //delete previous character
        simulatedInputMap.set(
          lastWordIndex - 1,
          simulatedInputMap.get(lastWordIndex - 1)?.slice(0, -1) ?? "",
        );
      } else {
        simulatedInput = simulatedInput.slice(0, -1);
      }
    }
    if (event.data.inputType === "deleteWordBackward") {
      if (event.data.charIndex === 0) {
        //delete previous word
        simulatedInputMap.delete(lastWordIndex - 1);
      }
      simulatedInput = "";
    }
  }

  if (simulatedInput !== "") {
    simulatedInputMap.set(lastWordIndex as number, simulatedInput);
  }

  return simulatedInputMap;
}
