import { createSignal } from "solid-js";

import type { EventLog, TestEventType } from "../test/events/types";

/**
 * State for the dev event log viewer, deliberately kept outside the component.
 * The modal gets edited constantly while working on it and vite hot reload
 * remounts the component on every save - holding the loaded log out here means
 * a save no longer throws away whatever was being inspected. This module is
 * only re-executed if this file itself changes.
 */

export const EVENT_TYPES: TestEventType[] = [
  "input",
  "keydown",
  "keyup",
  "timer",
  "composition",
];

export type Stage = "input" | "preview";
export type SyncKind = "start" | "end";
export type Mark = { id: string; videoMs: number; sync?: SyncKind };

export const [getStage, setStage] = createSignal<Stage>("input");
export const [getRaw, setRaw] = createSignal("");
export const [getEventLog, setEventLogSignal] = createSignal<EventLog | null>(
  null,
);
export const [getError, setError] = createSignal<string | null>(null);

export const [getCurrentMs, setCurrentMs] = createSignal(0);
export const [getVisibleTypes, setVisibleTypes] = createSignal<
  Set<TestEventType>
>(new Set(EVENT_TYPES));
export const [getTimelineZoom, setTimelineZoom] = createSignal(1);

export const [getMarks, setMarks] = createSignal<Mark[]>([]);
export const [getEventToMark, setEventToMark] = createSignal<
  Record<number, string>
>({});
export const [getSyncEnabled, setSyncEnabled] = createSignal(false);

export const [getVideoUrl, setVideoUrlSignal] = createSignal<string | null>(
  null,
);

export const [getDistributionOpen, setDistributionOpen] = createSignal(true);
export const [getScatterOpen, setScatterOpen] = createSignal(true);

let markSerial = 0;
export function nextMarkId(): string {
  return `mark-${++markSerial}`;
}

export function getEventLogMaxMs(log: EventLog): number {
  return Math.ceil(
    log.events.reduce(
      (max, event) => (event.testMs > max ? event.testMs : max),
      0,
    ),
  );
}

export function setEventLog(log: EventLog): void {
  setEventLogSignal(log);
  setCurrentMs(getEventLogMaxMs(log));
}

/**
 * Owns the object url rather than the component, so it survives a hot reload.
 * Only revoked when it is replaced or cleared.
 */
export function setVideoFile(file: File | null): void {
  const previous = getVideoUrl();
  if (previous !== null) URL.revokeObjectURL(previous);
  setVideoUrlSignal(file === null ? null : URL.createObjectURL(file));
}

export function resetEventLogViewer(): void {
  setStage("input");
  setRaw("");
  setEventLogSignal(null);
  setError(null);
  setCurrentMs(0);
  setVisibleTypes(new Set(EVENT_TYPES));
  setTimelineZoom(1);
  setMarks([]);
  setEventToMark({});
  setSyncEnabled(false);
  setVideoFile(null);
}
