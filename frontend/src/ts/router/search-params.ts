import { untrack } from "solid-js";
import { z } from "zod";
import { safeParse, serialize } from "zod-urlsearchparams";

import { getRoutePage, PageName } from "../states/router";
import { replaceSearch } from "./navigate";

type Schema = z.ZodObject<z.ZodRawShape>;

export type SearchState<T extends Schema> = {
  /** Parses `search` and hands it to `onRead`. Invalid search params are ignored. */
  read: (search: Record<string, unknown>) => void;
  /** Reflects `data` in the url, without a history entry. Ignored unless the page is the current route. */
  write: (data: z.infer<T>) => void;
};

/**
 * Two-way binding between a page's state and its url search params.
 * Read with readSearchOnEnter in the page's route.
 */
export function createSearchState<T extends Schema>(
  page: PageName,
  schema: T,
  onRead: (data: z.infer<T>) => void,
): SearchState<T> {
  return {
    read: (search) => {
      const parsed = safeParse({
        schema,
        input: new URLSearchParams(search as Record<string, string>),
      });
      if (parsed.success) onRead(parsed.data);
    },
    write: (data) => {
      if (untrack(getRoutePage) !== page) return;
      replaceSearch(serialize({ schema, data }));
    },
  };
}

/**
 * Route `beforeLoad` that reads the search params when entering the route -
 * not when the page itself writes them (writes reload the route too).
 */
export function readSearchOnEnter(
  state: Pick<SearchState<Schema>, "read">,
): (ctx: { search: Record<string, unknown>; cause: string }) => void {
  return ({ search, cause }) => {
    if (cause === "enter") state.read(search);
  };
}
