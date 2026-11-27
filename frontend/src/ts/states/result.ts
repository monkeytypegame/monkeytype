import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { z } from "zod";

import type { Quote } from "../constants/quotes";
import { createLocalStorageSignal } from "../hooks/createLocalStorageSignal";
import { showSuccessNotification } from "./notifications";

/**
 * State of the result screen that can't be derived from getResultData().
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
  crown: {
    visible: false,
    type: "normal",
    text: "",
    wide: false,
  },
});

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

// smoothed burst (chart)

// not part of the config schema on purpose - this is a local only preference
export const [getSmoothedBurst, setSmoothedBurst, resetSmoothedBurst] =
  createLocalStorageSignal({
    key: "smoothedBurst",
    schema: z.boolean(),
    fallback: true,
  });

// dev helper, exposed on window
export function toggleSmoothedBurst(): void {
  setSmoothedBurst(!getSmoothedBurst());
  showSuccessNotification(getSmoothedBurst() ? "on" : "off");
}

// result chart hover: the words history highlights the words typed in the
// hovered second
export type HighlightedWordRange = { first: number; last: number };

export const [getHighlightedWordRange, setHighlightedWordRange] = createSignal<
  HighlightedWordRange | undefined
>(undefined, {
  equals: (a, b) => a?.first === b?.first && a?.last === b?.last,
});
