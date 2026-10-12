import { untrack } from "solid-js";
import { z } from "zod";
import { safeParse, serialize } from "zod-urlsearchparams";

import { getRoutePage, PageName } from "../states/router";
import { replaceSearch } from "./navigate";

type Schema = z.ZodObject<z.ZodRawShape>;

/** Parses a route's search params, `undefined` if invalid. */
export function parseSearch<T extends Schema>(
  schema: T,
  search: Record<string, unknown>,
): z.infer<T> | undefined {
  const parsed = safeParse({
    schema,
    input: new URLSearchParams(search as Record<string, string>),
  });
  return parsed.success ? parsed.data : undefined;
}

/** Reflects `data` in the url, without a history entry. Ignored unless `page` is the current route. */
export function writeSearch<T extends Schema>(
  page: PageName,
  schema: T,
  data: z.infer<T>,
): void {
  if (untrack(getRoutePage) !== page) return;
  replaceSearch(serialize({ schema, data }));
}
