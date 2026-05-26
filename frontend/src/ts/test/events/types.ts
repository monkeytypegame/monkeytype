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
  | "compositionStart"
  | "compositionUpdate"
  | "compositionEnd";

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
  | CompositionStartTestEvent
  | CompositionUpdateTestEvent
  | CompositionEndTestEvent;

export type TestEventData =
  | KeydownEventData
  | KeyupEventData
  | TimerEventData
  | InputEventData
  | CompositionUpdateTestEventData
  | CompositionEndTestEventData;

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
  repeat: boolean;
  estimated?: true; // true if this event never happend, but was estimated (force keyup on test end)
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
    }
  | {
      inputType: DeleteInputType;
    }
);

export type CompositionStartTestEvent = CommonProps<"compositionStart"> & {
  data?: undefined;
};

export type CompositionUpdateTestEvent = CommonProps<"compositionUpdate"> & {
  data: CompositionUpdateTestEventData;
};

export type CompositionUpdateTestEventData = {
  data: string;
};

export type CompositionEndTestEvent = CommonProps<"compositionEnd"> & {
  data: CompositionEndTestEventData;
};

export type CompositionEndTestEventData = {
  data: string;
};
