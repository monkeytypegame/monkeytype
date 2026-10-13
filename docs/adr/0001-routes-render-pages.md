# Routes render pages, no keep-alive

Pages are rendered by their routes through the router's `<Outlet/>`, and a page unmounts when you leave it, including the test page. Previously pages were rendered outside the router so the test page could stay alive; we dropped that because the router has no keep-alive, and rendering outside it made the router's pending, error and not-found handling unusable. Leaving the test page mid-test ends the test, which is intended.

## Consequences

- Page code must survive mount and unmount: listeners, timers and element references bind on mount and release on unmount.
- Page content must only mount once it is attached to the document (page code queries `document` and measures layout on mount).
- solid-router wraps every route in `Suspense` (solid-router #7829): pages get their data from route loaders (`ensureQueryData`), with a `Suspense` boundary inside each page as a safety net.
- A route whose `beforeLoad` blocks needs a `pendingComponent`, or nothing renders on first load.
