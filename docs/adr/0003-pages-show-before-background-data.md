# Pages show before their background data

Navigating to a page waits only for its blocking data (eg. account results, friends), behind a loading step on the loading page. All other data is background data: the route's loader starts fetching it without waiting (`prefetchQuery`), and the page appears immediately with a loader per section. This is a deliberate departure from awaiting `ensureQueryData` in every loader, so pages like about appear instantly.

## Consequences

- solid-router makes every route a `Suspense` boundary, so a query read suspends the nearest boundary. Every component reading background data needs a `Suspense` boundary close to the read (`AsyncContent` provides one around the whole component). The page-level `Suspense` is only a safety net: if it shows, a read is missing its boundary.
- A router pending component (loading page with a spinner after 500ms, shown at least 500ms) catches any navigation that is still unexpectedly slow.
