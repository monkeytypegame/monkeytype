// Search params: the url format (plain strings, "t"/"f" booleans) and
// useRouteSearch, a route's search params as page state

import {
  RegisteredRouter,
  RouteById,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/solid-router";
import { Accessor, createMemo } from "solid-js";
import { z } from "zod";

// search params are plain strings (the default JSON parser would turn
// ?mode2=15 into a number) - route validateSearch schemas take strings in

/** The router's search parser: every param as a string. */
export function parseSearch(searchStr: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(searchStr));
}

/** The router's search serializer, see searchValueToString. */
export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    const str = searchValueToString(value);
    if (str !== undefined) params.set(key, str);
  }
  const str = params.toString();
  return str === "" ? "" : `?${str}`;
}

// booleans keep the "t"/"f" format of existing links, undefined is left out
function searchValueToString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value ? "t" : "f";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return JSON.stringify(value);
}

/** A boolean search param: written as "t", read as "t" or "true". */
export const SearchFlagSchema = z
  .union([z.boolean(), z.enum(["t", "true", "f", "false"])])
  .transform((value) => value === true || value === "t" || value === "true")
  .optional()
  .catch(undefined);

/** Routes keeping page state (selections, tabs...) in their search params. */
export type SearchRoutePath =
  | "/leaderboards"
  | "/settings"
  | "/account-settings";

/** The validated search params of the route at `TPath`. */
export type RouteSearch<TPath extends SearchRoutePath> = RouteById<
  RegisteredRouter["routeTree"],
  `/userData${TPath}`
>["types"]["fullSearchSchema"];

/**
 * The search params of the route at `path`, for its page: the url is the
 * source of truth. `search()` keeps the last one once the route is left (its
 * page stays on screen while it fades out). `replace` writes them without a
 * history entry or scrolling, and is ignored once the route is left.
 *
 * Read from the url as soon as a navigation starts, not from the route match
 * (`useSearch`): the router commits matches in a Solid transition, which holds
 * every change back until data read under it (eg. the entries of a new
 * selection) has loaded. The page shows a change at once, and its sections
 * their own loaders.
 */
export function useRouteSearch<TPath extends SearchRoutePath>(
  path: TPath,
): {
  search: Accessor<RouteSearch<TPath>>;
  replace: (next: (prev: RouteSearch<TPath>) => RouteSearch<TPath>) => void;
} {
  const navigate = useNavigate();
  const router = useRouter();
  // these routes validate their search with a zod schema
  const schema = router.routesById[`/userData${path}`].options
    .validateSearch as {
    parse: (search: unknown) => RouteSearch<TPath>;
  };
  // the raw search while the url is the route's
  const raw = useLocation({
    select: (location) =>
      location.pathname === path ? location.search : undefined,
  });
  const current = createMemo(() => {
    const value = raw();
    if (value === undefined) return undefined;
    return schema.parse(value);
  });
  // every search param of these routes is optional
  const empty = {} as RouteSearch<TPath>;
  const search = createMemo<RouteSearch<TPath>>(
    (prev) => current() ?? prev,
    current() ?? empty,
  );

  return {
    search,
    replace: (next) => {
      if (current() === undefined) return;
      void navigate({
        to: path,
        // the router can't check a search against a generic route: this
        // function's own signature does
        search: next as never,
        replace: true,
        resetScroll: false,
      });
    },
  };
}
