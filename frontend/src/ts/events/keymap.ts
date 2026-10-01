import { createEvent } from "../hooks/createEvent";

export type KeymapEventData = {
  mode: "highlight" | "flash";
  key: string;
  correct?: boolean;
};

export const keymapEvent = createEvent<KeymapEventData>();

export function flash(key: string, correct?: boolean): void {
  keymapEvent.dispatch({ mode: "flash", key, correct });
}

export function highlight(key: string): void {
  keymapEvent.dispatch({ mode: "highlight", key });
}
