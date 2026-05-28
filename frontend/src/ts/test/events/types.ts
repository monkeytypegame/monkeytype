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

type CommonProps<T extends TestEventType> = {
  type: T;
  ms: number;
  testMs: number;
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

export type KeydownEvent = CommonProps<"keydown"> & {
  data: KeydownEventData;
};

export type KeydownEventData = {
  code: Keycode | "NoCode" | `NoCode${number}`;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
};

export type KeyupEvent = CommonProps<"keyup"> & {
  data: KeyupEventData;
};

export type KeyupEventData = {
  code: Keycode | "NoCode" | `NoCode${number}`;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  estimated?: true; // true if this event never happened, but was estimated (force keyup on test end)
};

export type TimerEvent = CommonProps<"timer"> & {
  data: TimerEventData;
};

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

export type InputEvent = CommonProps<"input"> & {
  data: InputEventData;
};

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

export type CompositionTestEvent = CommonProps<"composition"> & {
  data: CompositionTestEventData;
};

export type CompositionTestEventData =
  | {
      event: "start";
    }
  | {
      event: "update" | "end";
      data: string;
    };
