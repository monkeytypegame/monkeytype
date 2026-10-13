# Page fade is an out-in switch transition

The page fade is a Solid out-in switch transition around `<Outlet/>`: the old page stays until it has faded out, then the new page is inserted and faded in, so two pages are never visible at once. Prototyped and measured on branch `prototype/route-fade`.

## Considered Options

- **View Transitions (`defaultViewTransition`)**: rejected. The router finishes its update before slow pages (settings) render, so the new view is captured empty and the page renders live underneath the fading old page: both are visible at once.
- **Fading `<main>` on router events (`onBeforeNavigate` / `onResolved`)**: rejected as built. Routes without loaders resolve within a frame, so the old page is swapped out at full opacity. Awaiting the fade in a root `beforeLoad` would fix that, but runs on every navigation (search param changes, redirects) and couples animation to route guards.
