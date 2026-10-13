# TanStack Solid Router — intended usage (research)

Versions: `@tanstack/solid-router@1.170.38`, `@tanstack/router-core@1.171.34`, `@tanstack/history@1.162.4`, `solid-js@1.9.13`, `@tanstack/solid-query@5.101.0`, `zod@3.23.8`. Researched 2026-10-13.

## Source keys

- **SR** = `frontend/node_modules/@tanstack/solid-router/src/` (installed, 1.170.38)
- **RC** = `node_modules/.pnpm/@tanstack+router-core@1.171.34/node_modules/@tanstack/router-core/src/`
- **SK** = agent skills shipped inside the packages: `…/router-core/skills/router-core/**/SKILL.md` (labeled v1.171.15) and `…/solid-router/skills/solid-router/SKILL.md` (labeled v1.166.2). Maintainer-written and shipped in the npm tarball, so treated as primary.
- **docs@tag** = `github.com/TanStack/router/blob/@tanstack/solid-router@1.170.38/docs/router/…` (docs as of the installed release tag)
- **docs@main** = same path on `main` (commit `4ff63eb8a`)
- **ex@tag** = `github.com/TanStack/router/tree/@tanstack/solid-router@1.170.38/examples/solid/…`

Most guides are React-first, with `# Solid` tabs in some places. Where they differ from installed source, the installed source wins and the difference is flagged.

---

## TL;DR

1. **Route tree.** TanStack recommends file-based routing. Code-based is "not recommended for most applications" (docs@tag `routing/code-based-routing.md`). Monkeytype has about 12 flat routes with no per-route components, so code-based routing is a reasonable choice. If you want codegen without moving files, use virtual file routes (`routing/virtual-file-routes.md`: "You have an existing route organization that you want to keep").
2. **Reactivity.** In Solid, `router.state` is already reactive: it is a `createMemo` held in its own `createRoot` (SR `routerStores.ts`). Hooks return `Accessor<T>`, except `useRouter`, `useNavigate` and `useLinkProps` (SK solid-router). Inside components, use `useMatch({from, shouldThrow:false})`, `useRouterState({select})` or `useLocation({select})`. Outside the tree, read `router.state` inside your own tracked scope. Module-level `createMemo` with no owner triggers Solid's dev warning.
3. **Data loading with Query.** Intended pattern: put `queryClient` in router context via `createRootRouteWithContext<{queryClient}>()`, have loaders call `queryClient.ensureQueryData(opts)`, have components read with `useQuery(() => opts)`, and set `defaultPreloadStaleTime: 0` (ex@tag `basic-solid-query/src/main.tsx`; docs@tag `guide/external-data-loading.md`, `guide/preloading.md`). docs@main has switched to `queryClient.query({...staleTime:'static'})`, which does not exist in installed query-core 5.101.0. Keep using `ensureQueryData`.
4. **Preloading.** Use `defaultPreload: 'intent'` and let loaders do the prefetching. This replaces the manual `onMouseEnter` prefetches in `Nav.tsx` (SK navigation; ex@tag).
5. **Search params.** The idiom is `validateSearch` (zod v3 needs `@tanstack/zod-adapter` with `zodValidator` and `fallback()`), reading with `useSearch({from})()`, and writing with `navigate({ search: prev => ({...prev, x}), replace: true })`. Use `loaderDeps` so search writes don't reload unrelated data. Mirroring search params into separate signals is not idiomatic. Monkeytype's `URLSearchParams` parse/stringify override is justified, because the default parser JSON-parses `?mode2=15` to the number `15` (RC `searchParams.ts`).
6. **Navigation.** Prefer `<Link>` for anything clickable. Use `router.navigate({ to, params, search })` (typed) from vanilla code. Never interpolate params into `to` (SK navigation calls this "CRITICAL"). The current `navigate(url: string)` wrapper uses `href:` strings, which throws away type safety.
7. **Pending UI.** The idiom is root `pendingComponent`/`defaultPendingComponent` plus `pendingMs` (default 1000) and `pendingMinMs` (default 500) (RC `router.ts` L1221), or a global indicator from `useRouterState({select: s => s.isLoading})`. A labelled progress bar with keyframes has no built-in equivalent, so Monkeytype's `withLoading` is a justified custom layer.
8. **Errors.** Use `errorComponent`/`defaultErrorComponent`, and retry with `router.invalidate()`, not `reset()` (SK not-found-and-errors). For 404s, use root `notFoundComponent`/`defaultNotFoundComponent` rather than a `$` catch-all route. Both work; the catch-all is fine for Monkeytype because it needs `staticData.page`.
9. **Auth.** The idiom is to put auth in router context, guard with `throw redirect()` in `beforeLoad` on a pathless layout (`_auth`), and call `router.invalidate()` when auth changes (ex@tag `authenticated-routes-firebase`). Monkeytype already does invalidate-on-auth and pathless layout guards, but reads module globals instead of context. That is acceptable, but context makes the dependencies explicit and testable.
10. **Keep-alive.** The router has no keep-alive, offscreen or Activity primitive (searched SR/RC: none). Matches unmount on leave. Keeping a page mounted outside `<Outlet>` (the current `<Pages>`) is a deliberate departure, and the only way to get keep-alive. If routes ever render pages, note that every Solid match is wrapped in `<Suspense>` unconditionally (open issue #7829), so a solid-query `.data` read inside a route component will suspend into the `pendingComponent`.
11. **Blocking.** `router.history.block({ blockerFn })` is the primitive that `useBlocker` wraps (SR `useBlocker.tsx` L259). A global, non-component guard is a legitimate use. `blockerFn` returning `true` means **block** (history `src/index.ts` L176–181). docs@tag prose says the opposite, so trust the source.

---

## 1. Route tree: file-based vs code-based, type registration

- **Recommendation:**
  - "file-based routing is the preferred and recommended way" (docs@main `routing/file-based-routing.md` L5).
  - "Code-based routing is not recommended for most applications" (docs@tag `routing/code-based-routing.md` L6).
- **Reasons** (docs@tag `decisions-on-dx.md` "Why is file-based routing the preferred way"): code-based routing means `getParentRoute` boilerplate, manual tree stitching (`addChildren`), and manual code-splitting (`lazyRouteComponent`). The plugin generates all three.
- **Solid support:**
  - Plugin config is `tanstackRouter({ target: 'solid', autoCodeSplitting: true })`, placed before `solidPlugin()` (SK solid-router §2; docs@tag `installation/with-vite.md` L52).
  - Doc inconsistency: `routing/file-based-routing.md` L112 says "you'll need to be using React", while the Vite install doc and the Solid examples (`basic-file-based`, `kitchen-sink-file-based`) show Solid support. The docs line is stale.
- **Middle ground:** virtual file routes (`routing/virtual-file-routes.md` L10) are for when "You have an existing route organization that you want to keep".
- **Code-based routing is still first-class.**
  - The Solid examples `basic`, `basic-solid-query`, `kitchen-sink-solid-query` and `navigation-blocking` are code-based (ex@tag).
  - Code-based routing preserves full inference as long as `getParentRoute` is correct (docs@tag `decisions-on-dx.md`).
  - For TS performance, the SK type-safety skill mentions object-syntax `addChildren` (UNVERIFIED for perf impact on 12 routes).
- **Register:** this is the one required annotation (SK type-safety):
  ```ts
  declare module '@tanstack/solid-router' {
    interface Register { router: typeof router }
  }
  ```
  - It types the top-level `Link`, `useNavigate`, `useSearch` and so on.
  - SK type-safety: "NEVER use `as Type`, explicit generic params … on inferred values".
  - `StaticDataRouteOption` augmentation is the documented way to type `staticData` (docs@tag `guide/static-route-data.md`).

## 2. Data loading: loader/beforeLoad/context vs Solid resources and Query

- **Lifecycle** (SK data-loading, from docs@tag `guide/data-loading.md`):
  1. `params.parse` and `validateSearch`, top-down.
  2. `beforeLoad`, serial, parent before child. Throwing here stops the children.
  3. `loader`, in parallel.
- `beforeLoad` can return an object that is merged into context (docs@tag `guide/router-context.md` ~L435).
- **Loader args:** `params`, `deps`, `context`, `abortController`, `cause: 'enter'|'stay'|'preload'`, `preload`, `location` (SK data-loading). There is no `search`; use `loaderDeps` instead.
- **Built-in SWR cache:** `staleTime` 0, `preloadStaleTime` 30s, `gcTime` 30min (SK data-loading). Default `defaultPreloadGcTime` is 5min (RC `router.ts` doc comment).
- **Query integration.** Router is a "coordinator" for Query (docs@tag `guide/external-data-loading.md`). Solid version, from ex@tag `basic-solid-query/src/main.tsx`:
  ```tsx
  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({ … })
  const postRoute = createRoute({
    getParentRoute: () => postsLayoutRoute, path: '$postId',
    loader: ({ context: { queryClient }, params: { postId } }) =>
      queryClient.ensureQueryData(postQueryOptions(postId)),
    component: () => {
      const params = postRoute.useParams()            // Accessor
      const q = useQuery(() => postQueryOptions(params().postId))
      …
    },
  })
  const router = createRouter({ routeTree, defaultPreload: 'intent',
    defaultPreloadStaleTime: 0, scrollRestoration: true, context: { queryClient } })
  ```
  - `defaultPreloadStaleTime: 0` lets Query own freshness (docs@tag `guide/preloading.md` "Preloading with External Libraries").
  - Doc drift: docs@main `external-data-loading.md` uses `queryClient.query({...opts, staleTime:'static'})` and `useSuspenseQuery`. Neither exists in solid-query or query-core 5.101.0 (query-core `queryClient.ts` has `ensureQueryData` at L138 and no `query()`). Follow docs@tag and the examples.
  - Solid divergence: React docs use `useSuspenseQuery`. The Solid example uses `useQuery(() => opts)`, with an options accessor.
- **When to use `createResource` vs a loader:** the docs never prescribe `createResource` (UNVERIFIED that any official guidance exists). The examples always use loader + Query. Route `Match` wraps children in `Solid.Suspense` (SR `Match.tsx` ~L95), and navigations run inside `Solid.startTransition` (SR `Transitioner.tsx`). So resources read inside route components do integrate with route pending UI.
- **Invalidation:**
  - `router.invalidate()` re-runs active loaders and marks the cache stale.
  - `{ sync: true }` waits for the reload (SK data-loading; docs@tag `guide/data-loading.md` L175).

## 3. Search params

- **Philosophy:** "JSON-first" search params, structurally shared, treated as app state (docs@tag `guide/search-params.md` "Why not just use URLSearchParams?").
- **Validation:**
  - `validateSearch: schema` takes the Standard Schema directly.
  - For **zod v3** (which the project uses), use `zodValidator(schema)` from `@tanstack/zod-adapter` with `fallback(z.x(), default)`. Zod's `.catch()` makes the type `unknown` (SK search-params CRITICAL; docs@tag `guide/search-params.md` "Adapters").
  - For zod v4, pass the schema directly and use `.catch()`.
  - `@tanstack/zod-adapter` is not installed.
- **Read:**
  - `Route.useSearch()` or `useSearch({ from: '/leaderboards' })`. In Solid these return an `Accessor`: `search().page` (SK solid-router "useSearch"; SR `useSearch.tsx` returns `useMatch(...)` → `Accessor`).
  - Don't destructure: `const { page } = useSearch(...)()` loses reactivity (SK solid-router "Common Mistakes #2").
  - Use `select` for fine-grained reads.
  - Divergence: the docs' `structuralSharing` / `defaultStructuralSharing` opt-in (docs@tag `guide/render-optimizations.md`) does not exist in the Solid adapter. SR `useMatch.tsx`, `useRouterState.tsx` and `useLocation.tsx` *always* `replaceEqualDeep` the `select` result, and grep finds no `structuralSharing` in SR.
- **Write:**
  - `navigate({ search: (prev) => ({ ...prev, page: 2 }) })`. The object form replaces *all* params (SK navigation, "HIGH").
  - Add `replace: true` and `resetScroll: false` for in-page filter state (docs@tag `guide/scroll-restoration.md` "Preventing Scroll Restoration").
- **Middlewares** (route `search.middlewares`):
  - `retainSearchParams(['k'])` carries params across navigations.
  - `stripSearchParams(defaults)` keeps defaults out of the URL.
  - (SK search-params; RC `searchMiddleware.ts` L25, L101.)
- **Avoid reload churn:** `loaderDeps: ({search}) => ({ page: search.page })`. Never return the whole `search` (SK data-loading, "HIGH").
- **Custom serialization:**
  - `parseSearch`/`stringifySearch` are supported, as are the `parseSearchWith`/`stringifySearchWith` helpers (docs@tag `guide/custom-search-param-serialization.md`).
  - Default behaviour: `defaultParseSearch = parseSearchWith(JSON.parse)`. Values starting with a digit, `"`, `[`, `{`, `-`, `tr`, `fa` or `nu` are JSON-parsed. `stringifySearchWith(JSON.stringify, JSON.parse)` re-quotes string values that look like JSON (RC `searchParams.ts` L1–60). So `?mode2=15` round-trips to number `15`, and a string `"15"` serializes as `%2215%22`.
- **Signals vs URL:** the docs model the URL as *the* state store ("the 'OG' state manager"). A parallel signal synced from `beforeLoad` duplicates state and needs the guard logic that `replaceSearch` currently has.

## 4. Pending, error and not-found handling; global loading screen

- **Per-route options:** `pendingComponent`, `pendingMs` (router default 1000), `pendingMinMs` (default 500). RC `router.ts` L1221–1222; docs@tag `guide/data-loading.md` L525–548.
- **Root-level pending fallback.** `Matches` wraps everything in `Solid.Suspense` with fallback set to the root `pendingComponent` or `defaultPendingComponent` (SR `Matches.tsx` L37–63).
  - `InnerWrap` sits *outside* that Suspense, so components placed there never suspend into the router fallback.
- **Global indicator:**
  - The idiom is `useRouterState({ select: s => s.isLoading })` (SK solid-router).
  - `RouterState` is `{ status: 'pending'|'idle', isLoading, matches, location, resolvedLocation }` (RC `router.ts` L576–583). `isLoading` is `status === 'pending'` (RC `stores.ts`).
  - There is no `pendingMatches` in state at this version. `matches` are the *presented* (committed) matches, which is why they "only change once a route has loaded".
- **Errors:**
  - `errorComponent` or `defaultErrorComponent` gets `{ error, info, reset }`. Retry with `router.invalidate()`: `reset()` does not re-run loaders (SK not-found-and-errors §5; docs@tag `guide/data-loading.md` L626).
  - `onError` and `onCatch` are available for side effects.
  - Without any errorComponent, the global `CatchBoundary` warns in dev (SR `Matches.tsx` L88–100).
- **Not found:**
  - Root `notFoundComponent` or `defaultNotFoundComponent`, with `notFoundMode: 'fuzzy'|'root'`.
  - `throw notFound()` in a loader or `beforeLoad` covers missing resources.
  - Only routes with children catch path-based not-founds.
  - `NotFoundRoute` is deprecated.
  - (SK not-found-and-errors.)
- **Solid divergence:** the `wrapInSuspense` route option typechecks but is ignored by solid-router. Every match is always wrapped (open issue #7829, filed against 1.170.17).

## 5. Navigation

- **`<Link>` for anything clickable.** `useNavigate`/`router.navigate` are for side-effect navigation; a button with `navigate` loses `href`, cmd+click, preloading and a11y (SK navigation, "Using useNavigate for clickable elements").
- **Params:**
  - `to="/profile/$uidOrName" params={{ uidOrName }}` is correct.
  - `` to={`/profile/${x}`} `` is the "CRITICAL" mistake (SK navigation). It applies equally to `navigate`, `Navigate` and `router.navigate`.
- **Outside components:** "`router.navigate` is available anywhere you have the router instance" (SK navigation). It is fully typed after `Register`.
- **`useNavigate` in Solid** returns a plain function, not an Accessor (SR `useNavigate.tsx`).
- **Reusable options:** `linkOptions({...})` and `linkOptions([...])` give eager type-checking and work with `Link`, `navigate` and `redirect` (SK navigation).
- **Custom link components:** `createLink(Comp)` keeps `to`/`params`/`search` typing (SK solid-router "createLink"). A hand-rolled `to: RoutePaths<…>` prop loses typing for `params` and `search`.
- **Active state:**
  - `activeProps`/`inactiveProps`/`activeOptions` (`exact`, `includeSearch` default `true`).
  - `data-status="active"` on the `<a>`.
  - Children-as-function `{(s) => s.isActive}`.
  - (SK navigation; ex@tag `authenticated-routes-firebase/src/routes/_auth.tsx` uses `data-[status='active']`.)
- **Preload:**
  - `defaultPreload: false | 'intent' | 'viewport' | 'render'`, default `false`. `defaultPreloadDelay` is 50ms (RC `router.ts` L225–240).
  - Manual: `router.preloadRoute({ to, params })`.

## 6. Reading router state reactively

- **How it works in Solid:**
  - Mutable stores are `createSignal`.
  - Derived stores are `createRoot(() => createMemo(read))` (SR `routerStores.ts`).
  - `router.state` is the getter `stores.__store.get()` (RC `router.ts` L1379), a memo over status, matches, location and resolvedLocation. Reading it in any tracking scope subscribes.
  - SK solid-router: `useRouterState` "Exposes the entire state and thus incurs a performance cost. For matches or location favor `useMatches` and `useLocation`."
- **Components:**

  | Need | API | Returns |
  |---|---|---|
  | Is route X active? Its match | `useMatch({ from: '/', shouldThrow: false })` | `Accessor<match \| undefined>`. Reads per-route store `getMatchStore(id)`, so it only updates when that route changes (SR `useMatch.tsx`) |
  | Would `to` match (incl. pending) | `useMatchRoute()(opts)` | function → `Accessor<false \| params>` (SR `Matches.tsx`) |
  | Location | `useLocation({ select })` | `Accessor`, reads `stores.location` only |
  | Arbitrary | `useRouterState({ select })` | memo with `replaceEqualDeep` |
  | All matches / staticData | `useMatches()` | `Accessor<Match[]>` (docs@tag `guide/static-route-data.md`) |

- **Gotcha:** route-scoped accessors (`Route.useParams()` and similar) can throw "Could not find an active match" if read asynchronously after navigating away. Open issue #7331 (Solid 2.0 context, but the `useMatch` code path is the same in 1.170.38: `createEffect` invariant, SR `useMatch.tsx`). Use `shouldThrow: false` for long-lived readers.
- **Outside the tree** (vanilla code):
  - Use `router.subscribe(event, fn)`. It is "best for imperative integrations … If you need reactive UI updates, prefer framework hooks" (docs@tag `guide/router-events.md`).
  - Events fire in this order: `onBeforeNavigate` → `onBeforeLoad` → `onLoad` → `onBeforeRouteMount` → `onResolved` → `onRendered`.
  - Use `onResolved` for analytics and cleanup, and `onRendered` for DOM-dependent work.
  - Payloads carry `pathChanged`, `hrefChanged` and `hashChanged`.
- **Reading `router.state` from vanilla Solid-reactive code:**
  - This is valid, because it is a memo.
  - Wrapping it in your own module-level `createMemo` without an owner makes Solid warn "computations created outside a `createRoot` or `render` will never be disposed" (solid-js 1.9.13 `dist/dev.js` L792).
  - Use `createRoot(() => createMemo(...))` as the router does, or read `router.state` directly.
  - `router.stores.*` is what the adapter hooks use, but it is not in the docs (UNVERIFIED as public API, so avoid it).
- **Route lifecycle hooks:**
  - Route options `onEnter`, `onStay` and `onLeave(match)` fire after commit (RC `router.ts` L988–1025, `runRouteLifecycle`; route.ts L1310–1342).
  - They are a route-local alternative to global `onResolved` diffing, and to `beforeLoad` `cause` checks for side effects.

## 7. Route context and DI; `router.invalidate`

- **Factory:** `createRootRouteWithContext<Ctx>()({...})` has a double call. Supply context with `createRouter({ context })` or `<RouterProvider context={…}>` (SK data-loading).
- **Reading context:** read it in `beforeLoad` and `loader` (`({ context })`), not with hooks. Children get parent and `beforeLoad` context merged.
- **Order matters for inference:** `validateSearch` → `loaderDeps` → `beforeLoad` → `loader` (SK data-loading, "Property order").
- **Solid auth example** (ex@tag `authenticated-routes-firebase`):
  - `main.tsx` waits for initial auth before rendering `RouterProvider`, then passes `context={{ auth }}`.
  - `_auth.tsx` does `throw redirect({ to: '/login', search: { redirect: location.href } })`.
  - Logout calls `router.invalidate()` and then navigates.
- **`invalidate()` recomputes context and re-runs loaders** (docs@tag `guide/router-context.md` L128).
  - Doc bug: the Solid tab's `useAuth` uses `createEffect(fn, [])` and returns the unsubscribe function. In Solid the second argument is an *initial value* and the return value is passed to the next run, not used as cleanup (docs.solidjs.com/reference/basic-reactivity/create-effect). Use `onCleanup`.
- **`RouterContextProvider`** (used for extra Solid roots) calls `router.update({...router.options, ...rest})` on every mount (SR `RouterProvider.tsx` L19–27). This is harmless when no props are passed, but each root re-runs it.

## 8. Layout, pathless routes, `<Outlet>`, keeping a page mounted

- **Pathless layout:** `createRoute({ id: '_x', getParentRoute, component, beforeLoad })`. Children render via `<Outlet/>`.
- **`component` default:** if `component` is undefined the route renders `<Outlet/>` (docs@tag `guide/outlets.md`; SR `Match.tsx` `out()`). A root with `component: () => null` renders no child routes at all.
- **Remounting:**
  - The route component is keyed by `routeId`, so it stays mounted across param or search changes on the same route.
  - With `remountDeps`/`defaultRemountDeps` it is keyed by your deps (SR `Match.tsx` L205–234).
  - The component unmounts when the route leaves the match list. There is no keep-alive API (grep `keepalive|offscreen|Activity` in SR and RC returns nothing).
- **Implication:** a page that must stay alive, or that is driven by imperative vanilla DOM code, has to live outside `<Outlet>`, for example in `InnerWrap` or a sibling root. The routes then provide only matching, guards and loaders. This is a supported shape (`InnerWrap` "useful for providing a context to the inner contents of the router where you also need access to the router context and hooks", SR `router.ts` L57–64), but it gives up `pendingComponent`, `errorComponent` and `notFoundComponent` rendering.

## 9. Scroll restoration, view transitions, masking, blocking

- **Scroll:**
  - Scroll-to-top of `window` and hash scrolling are on by default.
  - `scrollRestoration: true` enables restore.
  - `scrollToTopSelectors` handles nested scrollers.
  - `resetScroll: false` per navigation.
  - The `<ScrollRestoration/>` component is deprecated.
  - (docs@tag `guide/scroll-restoration.md`; SK solid-router.)
- **View transitions:** `defaultViewTransition: boolean | ViewTransitionOptions` wraps navigation in `document.startViewTransition`, and is ignored when unsupported (RC `router.ts` L301–309, L2436). There is a Solid example: ex@tag `view-transitions`.
- **Masking:**
  - `mask` on Link or navigate, or `createRouteMask` with `routeMasks`.
  - The mask lives in `location.state`, so it is lost when the URL is shared (SK not-found-and-errors "Route Masking").
- **Blocking:**
  - `useBlocker({ shouldBlockFn, withResolver, enableBeforeUnload, disabled })` and `<Block>` both wrap `router.history.block(...)` and dispose `onCleanup` (SR `useBlocker.tsx` L257–264).
  - `blockerFn` returning `true` blocks (history `src/index.ts` L176–181). This contradicts the docs@tag `guide/navigation-blocking.md` L18 prose ("returns `true`, the navigation will be allowed"), so trust the source.
  - Redirects bypass blockers (`ignoreBlocker: true` in RC `load-client.ts` `followRedirect` L1700–1732).

## 10. Solid-adapter gotchas and open issues

- **Accessors everywhere.** Call `x()`, don't destructure. `useRouter`, `useNavigate` and `useLinkProps` are not accessors (SK solid-router "Common Mistakes").
- **#7829 (open):** `wrapInSuspense` is ignored. Every match is wrapped in `Solid.Suspense` (SR `Match.tsx`), so solid-query `useQuery` reads (`createResource`-based, solid-query `useBaseQuery.ts` L239) inside route components can suspend to the `pendingComponent`.
- **#7331 (open):** route-scoped accessors can throw after navigating away when read asynchronously.
- **#6845 / #6331 / #8241 / #8096 (open):** SSR, Start and `shellComponent` hydration issues. Not relevant to a client-only SPA.
- **2.0 track:** `solid-router 2.0.0-rc.0` issues (#8096, #8106, #8104) show a Solid 2.0 adapter is in RC. Expect API churn on upgrade (UNVERIFIED scope).
- **No structural-sharing flag in Solid.** Selects are always deep-compared (see §3).
- **Doc drift:**
  - docs@main Query examples (`queryClient.query`) are ahead of the installed Query version.
  - The navigation-blocking prose inverts the `true`/`false` meaning.
  - The `file-based-routing.md` "React only" line is stale.
  - The Solid `useAuth` snippet uses React-style effects.
- **`HeadContent` depends on `@solidjs/meta`** (SR `HeadContent.tsx` L1). Route `head()` is the idiomatic way to set titles.

---

## Gaps vs current code

Each item says what the code does now, the idiomatic alternative, and a verdict.

1. **Pages rendered outside matches.**
   - **Now:** the root route is `component: () => null`, and `<Pages>` is injected via `InnerWrap`, choosing the page from `staticData.page` (`router/routes.ts`, `components/mount.tsx`, `components/pages/Pages.tsx`).
   - **Idiom:** per-route `component`, a root layout with `<Outlet/>`, and `pendingComponent`/`errorComponent` (§8).
   - **Verdict:** deliberate and justified. The test page must stay alive with imperative vanilla code, and there is no keep-alive (§8). The custom fade-out-then-mount also needs control the router doesn't give. Cost: `errorComponent`/`notFoundComponent`/`pendingComponent` are unusable, so the error and pending UI had to be re-derived.

2. **Global loading screen.**
   - **Now:** `withLoading()` inside loaders toggles module signals. `onResolved` hides it. Errors are read from `match.status === 'error'` (`states/loading-page.ts`, `states/router.ts`).
   - **Idiom:** root `pendingComponent` with `pendingMs`/`pendingMinMs`, or `useRouterState({select: s => s.isLoading})` for an indicator; `errorComponent` with `router.invalidate()` for retry (§4).
   - **Verdict:** partly justified. Keyframed progress text has no router equivalent, and the error component can't render given gap 1. Possible simplification: derive "shown" from `router.state.isLoading` instead of a manual show/hide signal plus an `onResolved` hide. Spinner-vs-bar style per route could go in `staticData`. Note that `defaultErrorComponent: () => null` silences the dev CatchBoundary warning, which is fine.

3. **Module-level `createMemo` over `getRouter()?.state.matches`.**
   - **Now:** `states/router.ts` builds the memo with no owner.
   - **Idiom:** in components, `useMatch({from, shouldThrow:false})` or `useMatches()`. Outside, wrap in `createRoot` or read `router.state` directly (§6).
   - **Verdict:** works, but in dev it triggers Solid's "computations created outside a createRoot" warning (unless something else wraps it, which I did not find in `states/`). It also subscribes to the whole `__store`, so it recomputes on every location change, not just on match changes. Low risk; wrap in `createRoot`.

4. **`getRouter` signal typed `AnyRouter`.**
   - **Now:** `router/navigate.ts` holds the router in a signal "so vanilla modules can navigate … without importing the route tree".
   - **Idiom:** import `router`, or type the holder as `RegisteredRouter` with a type-only import, so `router.navigate({to, params})` stays typed (§5; SK type-safety "Register").
   - **Verdict:** the circular-import concern is legitimate. The `AnyRouter` typing is the real loss, and a type-only `RegisteredRouter` costs nothing at runtime.

5. **`navigate(url: string)` with `href`.**
   - **Now:** used in the commandline lists, `ProfileSearchPage` (`` `/profile/${name}` ``), `ResultSecondaryStats` (hand-built `?type=daily&…`), `load-challenge` and `quickrestart` (`navigate("")`).
   - **Idiom:** `router.navigate({ to: '/profile/$uidOrName', params: { uidOrName } })` and `search: {...}`. Interpolating params is the "CRITICAL" mistake (SK navigation).
   - **Verdict:** not justified for internal routes. It is a convenience from the legacy string API. Keep `href` only for genuinely dynamic or external URLs.

6. **Clickable non-links.**
   - **Now:** `ResultSecondaryStats` uses `Balloon onClick={() => navigate(...)}`. Commandline items are fine, since they are imperative.
   - **Idiom:** `<Link>` or a `createLink`-wrapped `Balloon` (SK navigation "Using useNavigate for clickable elements").
   - **Verdict:** minor. It loses cmd+click and `href`.

7. **`Button` hand-rolls Link props.**
   - **Now:** `to: RoutePaths<…>`, `params?: Record<string,string>`, no `search` (`components/common/Button.tsx`).
   - **Idiom:** `createLink(ButtonAnchor)` keeps typed `params`, `search` and `activeProps`, and gives `data-status` for free. That could also replace the `active` prop and `getRoutePage()` comparisons in `Nav.tsx` (§5).
   - **Verdict:** a simplification opportunity, not a bug.

8. **Search params mirrored into signals.**
   - **Now:** `createSearchState` plus `readSearchOnEnter` in `beforeLoad` (with `cause === 'enter'`) parses with zod-urlsearchparams into page signals. `write()` calls `replaceSearch` with `ignoreBlocker`, and a guard that skips the write if the path is mid-navigation.
   - **Idiom:** `validateSearch` on the route, `useSearch({from})` as the source of truth, and `navigate({ search: prev => …, replace: true, resetScroll: false })` to write. Use `loaderDeps` so writes don't re-run loaders. Use `onEnter`/`onStay` if side effects are needed (§3, §6).
   - **Verdict:** partly justified. Keeping the custom `parseSearch`/`stringifySearch` is justified (the JSON default breaks `?mode2=15`, §3). But the two-way signal mirror and its race guard exist mostly because state lives outside the URL. `beforeLoad` runs on every navigation, and with the default `staleTime: 0` the current loaders re-run on each write; they are cheap and guarded. A `validateSearch` with a string-valued zod schema (strings in, matching the custom parser) would keep URL format and give typed `useSearch`. With zod 3 this needs `@tanstack/zod-adapter`.

9. **Side-effect `beforeLoad`.**
   - **Now:** the `profile` route's `beforeLoad` calls `setSelectedProfileName(params.uidOrName)`, a global signal.
   - **Idiom:** the page reads `useParams({ from: '/profile/$uidOrName' })()`, or `onEnter`/`onStay` for imperative needs. `beforeLoad` is for guards and context (§2, §6).
   - **Verdict:** a departure that is probably legacy. `beforeLoad` also runs on preload (`cause: 'preload'`) once preloading is enabled, which would set the profile name on hover.

10. **Auth from module globals.**
    - **Now:** `requireAuth`/`guestOnly` read `isAuthenticated()` directly. `authEvent` triggers `router.invalidate()`. A `firstAuthState` promise is awaited in the pathless `app` `beforeLoad`.
    - **Idiom:** `createRootRouteWithContext<{ auth, queryClient }>()` and `context.auth` in `beforeLoad`, with the initial auth wait before `RouterProvider` (ex@tag `authenticated-routes-firebase/src/main.tsx`).
    - **Verdict:** functionally equivalent and justified given the existing vanilla auth module. Context would make routes testable without module mocks. Neither guard preserves a `redirect` search param back to the original URL; the example does.

11. **No Query/loader integration; manual hover prefetch.**
    - **Now:** `Nav.tsx` prefetches on `onMouseEnter` via `prefetchLeaderboardPage`/`prefetchAboutPage`. Loaders await `serverConfigurationPromise` or collection readiness rather than `ensureQueryData`.
    - **Idiom:** `defaultPreload: 'intent'` and `defaultPreloadStaleTime: 0`. Loaders call `queryClient.ensureQueryData(opts)` (or `prefetchQuery` to avoid blocking), with `queryClient` from context (§2, §5).
    - **Verdict:** not deliberate as far as I can tell. This is the clearest idiomatic win. Caveat: enabling intent preload also runs `beforeLoad` and `loader` on hover, so the side-effectful `beforeLoad` and `withLoading` calls (gaps 2 and 9) must first be made preload-safe (`if (preload) …`).

12. **Global blocker via `router.history.block`.**
    - **Now:** `router/index.ts` blocks during restart, result calculation and the no-quit funbox.
    - **Idiom:** this is the documented primitive under `useBlocker` (§9). The component form would only help if the guard were owned by `TestPage`.
    - **Verdict:** justified. The comment "redirects … bypass it" matches the source (`followRedirect` sets `ignoreBlocker: true`).

13. **Title and og:url in `onResolved`.**
    - **Now:** `onResolved` diffs `getRoutePage()` to set the title, reset focus and reinstate ads.
    - **Idiom:** `onResolved` is the documented hook for post-navigation side effects (docs@tag `guide/router-events.md`). Route `head()` with `<HeadContent/>` is the declarative title alternative, but requires `@solidjs/meta` (installed).
    - **Verdict:** fine as is.

14. **Multiple Solid roots and `RouterContextProvider`.**
    - **Now:** every `data-component` root is wrapped so `<Link>` works outside `RouterProvider` (`mount.tsx`).
    - **Idiom:** a single `RouterProvider` tree.
    - **Verdict:** justified by the incremental migration. Each provider calls `router.update(...)` on mount, which is harmless with no props (§7).

15. **`TestPage` stops the test via `createEffectOn(getRoutePage)`.**
    - **Now:** `TestPage` stops the test on the route change, before the fade.
    - **Idiom:** route `onLeave` on the `test` route, or `router.subscribe('onBeforeNavigate')` to stop even earlier (§6).
    - **Verdict:** works. `onLeave` fires at commit, the same timing as the matches change, so it isn't strictly better. It would remove the dependency on the derived page memo.
