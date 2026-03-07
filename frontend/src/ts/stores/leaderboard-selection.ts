import { LanguageSchema } from "@monkeytype/schemas/languages";
import { ModeSchema } from "@monkeytype/schemas/shared";
import { Accessor, createEffect, createSignal, Setter } from "solid-js";
import { z } from "zod";
import { serialize as serializeUrlSearchParams } from "zod-urlsearchparams";
import { useLocalStorage } from "../hooks/useLocalStorage";

import { get as getServerConfiguration } from "../ape/server-configuration";
import { getSnapshot } from "./snapshot";

export const pageSize = 50;

export type LeaderboardType = Selection["type"];
const XpSelection = z.object({
  type: z.literal("weekly"),
  friendsOnly: z.boolean(),
  previous: z.boolean(),
  language: z.never().optional(),
  mode: z.never().optional(),
  mode2: z.never().optional(),
});
const SpeedSelection = z.object({
  type: z.enum(["daily", "allTime"]),
  friendsOnly: z.boolean(),
  previous: z.boolean(),
  mode: ModeSchema,
  mode2: z.string(),
  language: LanguageSchema,
});

export const SelectionSchema = SpeedSelection.or(XpSelection);
export type Selection = z.infer<typeof SelectionSchema>;

export const LeaderboardUrlParamsSchema = z
  .object({
    type: z.enum(["allTime", "daily", "weekly"]),
    mode: ModeSchema.optional(),
    mode2: z.string().optional(),
    language: LanguageSchema.optional(),
    yesterday: z.boolean().optional(),
    lastWeek: z.boolean().optional(),
    friendsOnly: z.boolean().optional(),
    page: z.number().optional(),
    goToUserPage: z.boolean().optional(),
  })
  .partial();
export type LeaderboardUrlParams = z.infer<typeof LeaderboardUrlParamsSchema>;

const [getSelectionLs, setSelection] = lsSelection();
export const [getPage, setPage] = createSignal(0);
export const [getGoToUserPage, setGoToUserPage] = createSignal(false);

// Reset friendsOnly when connections are disabled
createEffect(() => {
  if (
    getSelectionLs().friendsOnly &&
    (getSnapshot() === undefined ||
      getServerConfiguration()?.connections.enabled === false)
  ) {
    setSelection((old) => ({ ...old, friendsOnly: false }));
  }
});

export const getSelection = (): Selection => {
  return getSelectionLs();
};

export { setSelection };

export function readGetParameters(
  params: LeaderboardUrlParams | undefined,
): void {
  if (params === undefined || params.type === undefined) return;

  let newSelection: Partial<Selection> = {
    type: params.type,
    friendsOnly: params.friendsOnly ?? false,
  };

  if (params.type === "weekly") {
    newSelection.previous = params.lastWeek ?? false;
  } else {
    newSelection.mode = params.mode ?? "time";
    newSelection.mode2 = params.mode2 ?? "15";
    newSelection.language = params.language ?? "english";
    newSelection.previous =
      params.type === "daily" && (params.yesterday ?? false);
  }

  setSelection({ ...getSelection(), ...newSelection } as Selection);

  if (params.goToUserPage === true) {
    setGoToUserPage(true);
  } else if (params.page !== undefined) {
    setPage(Math.max(0, params.page - 1));
  }
}

export function updateGetParameters(
  selection: Selection,
  pageNumber: number,
): void {
  const params: LeaderboardUrlParams = {
    type: selection.type,
    mode: selection.mode,
    mode2: selection.mode2,
    language: selection.language,
    page: pageNumber + 1,
  };

  if (selection.type === "weekly" && selection.previous) {
    params.lastWeek = true;
  }
  if (selection.type === "daily" && selection.previous) {
    params.yesterday = true;
  }
  if (selection.friendsOnly) {
    params.friendsOnly = true;
  }

  const urlParams = serializeUrlSearchParams({
    schema: LeaderboardUrlParamsSchema,
    data: params,
  });
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

function lsSelection(): [Accessor<Selection>, Setter<Selection>] {
  return useLocalStorage<Selection>({
    key: "leaderboardSelector",
    schema: SelectionSchema,
    fallback: {
      type: "allTime",
      mode: "time",
      mode2: "15",
      language: "english",
      friendsOnly: false,
      previous: false,
    },
    migrate: (value) => {
      if (value === null || typeof value !== "object") {
        return {} as Selection;
      }
      const result = value as Selection;
      if ("lastWeek" in result) {
        delete result["lastWeek"];
        result.previous = true;
      } else if ("yesterday" in result) {
        delete result["yesterday"];
        result.previous = true;
      }

      if (result.type === "weekly") {
        delete result.mode;
        delete result.mode2;
        delete result.language;
      }
      return result;
    },
  });
}
