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

export type TestEventNoMs =
  | Omit<KeydownEvent, "ms">
  | Omit<KeyupEvent, "ms">
  | Omit<TimerEvent, "ms">
  | InputEventNoMs
  | Omit<CompositionTestEvent, "ms">;

export type InputEventNoMs = Omit<InputEvent, "ms">;

export type TestEventData =
  | KeydownEventData
  | KeyupEventData
  | TimerEventData
  | InputEventData
  | CompositionTestEventData;

export type KeydownEvent = EventProps<"keydown", KeydownEventData>;

export type KeydownEventData = {
  code: Keycode | "NoCode" | `NoCode${number}`;
  ctrl?: true;
  shift?: true;
  alt?: true;
  meta?: true;
};

export type KeyupEvent = EventProps<"keyup", KeyupEventData>;

export type KeyupEventData = {
  code: Keycode | "NoCode" | `NoCode${number}`;
  ctrl?: true;
  shift?: true;
  alt?: true;
  meta?: true;
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

type BaseInputEventData = {
  charIndex: number;
  wordIndex: number;
  inputValue?: string;
};

export type InputEventData =
  | (BaseInputEventData & {
      inputType: InsertInputType;
      data: string;
      correct: boolean;
      isCompositionEnding?: true;
      inputStopped?: true;
      // true when this was a space that advanced to the next word (commit
      // attempt) rather than being inserted as a literal character
      commitsWord?: true;
    })
  | (BaseInputEventData & {
      inputType: DeleteInputType;
    });

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
