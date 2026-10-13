import {
  RegisteredRouter,
  RouteById,
  useNavigate,
  useSearch,
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
 */
export function useRouteSearch<TPath extends SearchRoutePath>(
  path: TPath,
): {
  search: Accessor<RouteSearch<TPath>>;
  replace: (next: (prev: RouteSearch<TPath>) => RouteSearch<TPath>) => void;
} {
  const navigate = useNavigate();
  const current = useSearch({
    from: `/app${path}`,
    shouldThrow: false,
  }) as Accessor<RouteSearch<TPath> | undefined>;
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
