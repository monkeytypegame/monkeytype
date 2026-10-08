import { z } from "zod";
import {
  safeParse as parseUrlSearchParams,
  serialize as serializeUrlSearchParams,
} from "zod-urlsearchparams";

import { getRoutePage, PageName } from "../states/router";
import { replaceSearch } from "./navigate";

export type SearchParams<T extends z.ZodObject<z.ZodRawShape>> = {
  /** Route `beforeLoad` hook - passes the url params to `read` when entering the route. */
  readOnEnter: (ctx: {
    search: Record<string, unknown>;
    cause: string;
  }) => void;
  /** Reflects `data` in the url, without a history entry. Ignored unless `page` is the current route. */
  write: (data: z.infer<T>) => void;
};

/**
 * Two-way binding between a page's state and its url search params.
 * @param read called with the parsed params (`undefined` if invalid) when
 * entering the route - not on later url changes, which are the page's own writes
 */
export function createSearchParams<T extends z.ZodObject<z.ZodRawShape>>(
  page: PageName,
  schema: T,
  read: (params: z.infer<T> | undefined) => void,
): SearchParams<T> {
  return {
    readOnEnter: ({ search, cause }) => {
      if (cause !== "enter") return;
      const parsed = parseUrlSearchParams({
        schema,
        input: new URLSearchParams(search as Record<string, string>),
      });
      read(parsed.success ? parsed.data : undefined);
    },
    write: (data) => {
      if (getRoutePage() !== page) return;
      replaceSearch(serializeUrlSearchParams({ schema, data }));
    },
  };
}
