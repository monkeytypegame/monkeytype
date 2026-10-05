import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { z } from "zod";

import type { Quote } from "../controllers/quotes-controller";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { showSuccessNotification } from "./notifications";

/**
 * State of the result screen that can't be derived from getLastResult() / getLastEventLog().
 * The test engine (test/test-logic) is still vanilla and writes here.
 */

export type CrownType =
  | "normal"
  | "ineligible"
  | "pending"
  | "error"
  | "warning";

export type ResultTag = {
  id: string;
  isPb: boolean;
  balloon?: string;
  // tag pb (wpm) to draw on the chart
  chartPb?: number;
};

// facts about the finished test that are not part of the result object
export type ResultDetails = {
  difficultyFailed: boolean;
  failReason: string;
  afkDetected: boolean;
  isRepeated: boolean;
  tooShort: boolean;
  invalid: boolean;
  stopOnError: string;
  deleteOnError: string;
  quote: Quote | null;
};

type ResultState = {
  details: ResultDetails | null;
  tags: ResultTag[];
  // id of the saved result, empty until the server accepts it
  resultId: string;
  dailyLeaderboardRank?: number;
  canRetrySaving: boolean;
  timeToday: string;
  crown: {
    visible: boolean;
    type: CrownType;
    text: string;
    wide: boolean;
  };
};

export const [resultState, setResultState] = createStore<ResultState>({
  details: null,
  tags: [],
  resultId: "",
  canRetrySaving: false,
  timeToday: "",
  crown: {
    visible: false,
    type: "normal",
    text: "",
    wide: false,
  },
});

// visibility of the #result element. Fade in/out is still animated imperatively.
export const [getShowResult, setShowResult] = createSignal(false);

export function showCrown(type: CrownType, text = "", wide = false): void {
  setResultState("crown", { visible: true, type, text, wide });
}

// keeps the current balloon text
export function setCrownType(type: CrownType): void {
  setResultState("crown", { visible: true, type });
}

export function hideCrown(): void {
  setResultState("crown", { visible: false, text: "", wide: false });
}

export function setResultTagsAfterEdit(
  tagIds: string[],
  tagPbIds: string[],
): void {
  setResultState("tags", (current) =>
    tagIds.map(
      (id) =>
        current.find((t) => t.id === id) ?? {
          id,
          isPb: tagPbIds.includes(id),
        },
    ),
  );
}

// words history

export const [isResultWordsJoiningScript, setResultWordsJoiningScript] =
  createSignal(false);

// smoothed burst (chart)

// not part of the config schema on purpose - this is a local only preference
const smoothedBurstLS = new LocalStorageWithSchema({
  key: "smoothedBurst",
  schema: z.boolean(),
  fallback: true,
});

const [smoothedBurst, setSignal] = createSignal(smoothedBurstLS.get());

export function getSmoothedBurst(): boolean {
  return smoothedBurst();
}

export function setSmoothedBurst(value: boolean): void {
  if (smoothedBurstLS.set(value)) {
    setSignal(value);
  }
}

export function resetSmoothedBurst(): void {
  smoothedBurstLS.remove();
  setSignal(smoothedBurstLS.get());
}

// dev helper, exposed on window
export function toggleSmoothedBurst(): void {
  setSmoothedBurst(!getSmoothedBurst());
  showSuccessNotification(getSmoothedBurst() ? "on" : "off");
}
