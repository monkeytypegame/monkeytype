import {
  RegisteredRouter,
  RouteById,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/solid-router";
import { Accessor, createMemo } from "solid-js";

/** Routes keeping page state (selections, tabs...) in their search params. */
export type SearchRoutePath =
  | "/leaderboards"
  | "/settings"
  | "/account-settings";

/** The validated search params of the route at `TPath`. */
export type RouteSearch<TPath extends SearchRoutePath> = RouteById<
  RegisteredRouter["routeTree"],
  `/app${TPath}`
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
  const schema = router.routesById[`/app${path}`].options.validateSearch as {
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
