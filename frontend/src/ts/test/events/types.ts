import { Keycode } from "../../constants/keys";
import {
  DeleteInputType,
  InsertInputType,
} from "../../input/helpers/input-type";

export type TestEventType =
  | "keydown"
  | "keyup"
  | "input"
  | "timer"
  | "composition";

type EventProps<T extends TestEventType, TData> = {
  type: T;
  ms: number;
  testMs: number;
  data: TData;
};

export type TestEvent =
  | KeydownEvent
  | KeyupEvent
  | TimerEvent
  | InputEvent
  | CompositionTestEvent;

export type TestEventData =
  | KeydownEventData
  | KeyupEventData
  | TimerEventData
  | InputEventData
  | CompositionTestEventData;

export type KeydownEvent = EventProps<"keydown", KeydownEventData>;

export type KeydownEventData = {
  code: Keycode | "NoCode" | `NoCode${number}`;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
};

export type KeyupEvent = EventProps<"keyup", KeyupEventData>;

export type KeyupEventData = {
  code: Keycode | "NoCode" | `NoCode${number}`;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  estimated?: true; // true if this event never happened, but was estimated (force keyup on test end)
};

export type TimerEvent = EventProps<"timer", TimerEventData>;

export type TimerEventData =
  | {
      event: "step";
      timer: number;
      drift: number;
      slowTimer?: true;
    }
  | {
      event: "start" | "end";
      timer: number;
    };

export type InputEvent = EventProps<"input", InputEventData>;

export type InputEventData = {
  charIndex: number;
  wordIndex: number;
} & (
  | {
      inputType: InsertInputType;
      data: string;
      correct: boolean;
      isCompositionEnding: boolean;
      inputStopped: boolean;
    }
  | {
      inputType: DeleteInputType;
    }
);

export type CompositionTestEvent = EventProps<
  "composition",
  CompositionTestEventData
>;

export type CompositionTestEventData =
  | {
      event: "start";
    }
  | {
      event: "update" | "end";
      data: string;
    };
