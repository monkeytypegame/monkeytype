import { LanguageSchema } from "@monkeytype/schemas/languages";
import { ModeSchema } from "@monkeytype/schemas/shared";
import { useNavigate, useSearch } from "@tanstack/solid-router";
import { Accessor, createEffect, createMemo, Setter } from "solid-js";
import { z } from "zod";
import { useLocalStorage } from "../hooks/useLocalStorage";

import { get as getServerConfiguration } from "../ape/server-configuration";
import { keepLastSearch } from "../router/search-params";
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

/** A boolean search param: written as "t", read as "t" or "true". */
const SearchFlagSchema = z
  .union([z.boolean(), z.enum(["t", "true", "f", "false"])])
  .transform((value) => value === true || value === "t" || value === "true")
  .optional()
  .catch(undefined);

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

// the last shown selection, used when opening the leaderboards without one
const [getLastSelection, setLastSelection] = lsSelection();

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

function toSelection(search: LeaderboardSearch): Selection {
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

/**
 * The leaderboards selection and page, kept in the url. Writes replace the
 * url (no history entry) and are ignored once the leaderboards route is left.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- inferred
export function useLeaderboardSearch() {
  const navigate = useNavigate();
  const current = useSearch({
    from: "/app/leaderboards",
    shouldThrow: false,
  });
  const search = keepLastSearch<LeaderboardSearch>(current, {});
  const selection = createMemo(() => toSelection(search()));

  // remember the selection for the next visit
  createEffect(() => setLastSelection(selection()));

  const write = (
    next: (prev: LeaderboardSearch) => LeaderboardSearch,
  ): void => {
    if (current() === undefined) return;
    void navigate({
      to: "/leaderboards",
      search: next,
      replace: true,
      resetScroll: false,
    });
  };

  return {
    selection,
    /** 0-based */
    page: (): number => (search().page ?? 1) - 1,
    goToUserPage: (): boolean => search().goToUserPage ?? false,
    /** Shows `selection` from its first page. */
    setSelection: (selection: Selection): void =>
      write(() => toLeaderboardSearch(selection)),
    /** Shows the 0-based `page`. */
    setPage: (page: number): void =>
      write((prev) => ({ ...prev, page: page + 1, goToUserPage: undefined })),
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
