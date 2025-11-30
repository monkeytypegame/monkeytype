import {
  DeleteInputType,
  InsertInputType,
} from "../../input/helpers/input-type";

export type TestEventType = "keydown" | "keyup" | "input" | "timer";

type CommonProps<T extends TestEventType> = {
  type: T;
  ms: number;
  testMs: number;
};

export type TestEvent = KeydownEvent | KeyupEvent | TimerEvent | InputEvent;

export type KeydownEvent = CommonProps<"keydown"> & {
  data: KeydownEventData;
};

export type KeydownEventData = {
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  repeat: boolean;
};

export type KeyupEvent = CommonProps<"keyup"> & {
  data: KeyupEventData;
};

export type KeyupEventData = {
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  repeat: boolean;
  estimated?: true; // true if this event never happend, but was estimated (force keyup on test end)
};

export type TimerEvent = CommonProps<"timer"> & {
  data: TimerEventData;
};

export type TimerEventData = {
  event: "start" | "step" | "end";
  timer: number;
  delta: number;
  slowTimer?: true;
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
    }
  | {
      inputType: DeleteInputType;
    }
);
