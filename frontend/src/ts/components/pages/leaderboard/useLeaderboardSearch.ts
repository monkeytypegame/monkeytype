import { createEffect, createMemo } from "solid-js";

import { useRouteSearch } from "../../../router/search-params";
import {
  Selection,
  setLastSelection,
  toLeaderboardSearch,
  toSelection,
} from "../../../states/leaderboard-selection";

/**
 * The leaderboards selection and page, kept in the url. Writes replace the
 * url (no history entry) and are ignored once the leaderboards route is left.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- inferred
export function useLeaderboardSearch() {
  const { search, replace: write } = useRouteSearch("/leaderboards");
  const selection = createMemo(() => toSelection(search()));

  // remember the selection for the next visit
  createEffect(() => setLastSelection(selection()));

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
