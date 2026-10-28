import { LanguageSchema } from "@monkeytype/schemas/languages";
import { ModeSchema } from "@monkeytype/schemas/shared";
import { Accessor, Setter, createRoot } from "solid-js";
import { z } from "zod";
import { useLocalStorage } from "../hooks/useLocalStorage";

import { get as getServerConfiguration } from "../ape/server-configuration";
import { SearchFlagSchema } from "../router/search-params";
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

/**
 * The leaderboards url search params. Takes strings in (see the router's
 * search serializer); an invalid value is dropped, falling back to its default.
 */
export const LeaderboardSearchSchema = z.object({
  type: z.enum(["allTime", "daily", "weekly"]).optional().catch(undefined),
  mode: ModeSchema.optional().catch(undefined),
  mode2: z.string().optional().catch(undefined),
  language: LanguageSchema.optional().catch(undefined),
  yesterday: SearchFlagSchema,
  lastWeek: SearchFlagSchema,
  friendsOnly: SearchFlagSchema,
  /** 1-based */
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  /** jump to the page containing the user once their rank is known */
  goToUserPage: SearchFlagSchema,
});
export type LeaderboardSearch = z.infer<typeof LeaderboardSearchSchema>;

// the last shown selection, used when opening the leaderboards without one.
// the leaderboards page sets it (useLeaderboardSearch)
const [getLastSelection, setLastSelection] = createRoot(() => lsSelection());
export { setLastSelection };

/** The search params showing `selection` on the 0-based `page`. */
export function toLeaderboardSearch(
  selection: Selection,
  page = 0,
): LeaderboardSearch {
  const previous = selection.previous ? true : undefined;
  return {
    type: selection.type,
    mode: selection.mode,
    mode2: selection.mode2,
    language: selection.language,
    page: page + 1,
    lastWeek: selection.type === "weekly" ? previous : undefined,
    yesterday: selection.type === "daily" ? previous : undefined,
    friendsOnly: selection.friendsOnly ? true : undefined,
  };
}

/** Search params with the last shown selection, if `search` has no selection. */
export function getMissingLeaderboardSearch(
  search: LeaderboardSearch,
): LeaderboardSearch | undefined {
  if (search.type !== undefined) return undefined;
  return toLeaderboardSearch(getLastSelection());
}

/** The selection `search` shows (friends only needs a signed in user). */
export function toSelection(search: LeaderboardSearch): Selection {
  if (search.type === undefined) return getLastSelection();
  const friendsOnly =
    (search.friendsOnly ?? false) &&
    getSnapshot() !== undefined &&
    getServerConfiguration()?.connections.enabled !== false;

  if (search.type === "weekly") {
    return { type: "weekly", friendsOnly, previous: search.lastWeek ?? false };
  }
  return {
    type: search.type,
    friendsOnly,
    mode: search.mode ?? "time",
    mode2: search.mode2 ?? "15",
    language: search.language ?? "english",
    previous: search.type === "daily" && (search.yesterday ?? false),
  };
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
