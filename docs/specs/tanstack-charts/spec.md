Status: ready-for-agent

# Spec: replacing Chart.js with TanStack Solid Charts

Companion to `roadmap.md` next to this file. Decisions were settled in a grilling session on 2026-11-12 and are summarised under "Settled decisions" at the end. The library is `@tanstack/charts` 1.5.0 (stable compatibility contract since 1.0); its docs are the reference for anything this spec doesn't pin down.

## Problem Statement

The frontend draws every chart through `ChartJs`, a hand-rolled wrapper around Chart.js 3.7 (2021): a `<canvas>` that receives Chart.js `data` and `options` objects, with colors spliced into the options by a second function. Nine chart call sites fight that API — dual reversed axes, scriptable point radii, annotation plugins, a trendline plugin, time scales with a date adapter, custom external tooltips — and the wrapper papers over the seams (`@ts-expect-error`s, `Chart.register` at module scope, a global `createRoot` effect mutating `Chart.defaults`). Chart.js's canvas-only rendering, its plugin ecosystem, and its options object are all now in the way of the codebase moving forward: themes are CSS variables, components are Solid, and the rest of the data layer is reactive.

For a developer, each chart is a block of Chart.js option objects that resists the Solid way: reactivity is faked (data memos that happen to read `getTheme()`, a deferred-update hack for the expensive history chart, a manual `Chart` instance lifecycle). For a user, the maintenance cost shows up as the slow path: the account history chart (up to ~7k points) redrew by imperative `chart.update("none")`, and new chart features mean learning one more plugin API.

Beside the Chart.js charts, the **activity calendar** (account page and profile) is a legacy imperative DOM calendar — a hand-built CSS grid of cells with hand-measured balloon tooltips, the long-standing "left: the Solid component" remainder of the solid-monkeytype migration (U2). The same library renders it natively, so it joins this plan as its own step.

## Solution

Every chart becomes a direct consumer of TanStack Solid Charts' `Chart` component: the application prepares typed rows, builds a `defineChart` definition (marks, scales, guides, tooltip), memoizes it against the values it captures, and renders `<Chart definition=… ariaLabel=… />`. No wrapper component: the `Chart` adapter is the only chart boundary.

- **Chrome is themed by CSS.** A new `tanstack-charts.scss` (vendor layer) sets the library's palette and tooltip tokens from our theme variables on the chart host: foreground via `color` (inherited `currentColor`), `--ts-chart-1…4` from main/sub/error/sub-alt, `--ts-chart-tooltip-*` from bg/sub-alt/text. Data-mark colors stay where they are today — resolved from the theme state inside the definition — so a theme change re-creates the definition and re-paints, same as today.
- **SVG everywhere for now.** The default renderer is SVG; no canvas imports ship yet. A later step measures the dense charts (history, result) and converts to the library's canvas renderer only if the measurement says so.
- **The activity calendar becomes a chart.** Following the library's calendar example (catalog 118, token-usage-calendar): one `cell` mark per in-window day on a week × weekday band-scale grid, an ordinal colour scale over the five levels, the months row as x-axis ticks and the weekday column as responsive y-axis ticks. The component works only on `days` and computes window, levels, months and weekdays itself. It retires the legacy DOM calendar module, completing solid-monkeytype U2 (that row links here and keeps its remainder text).
- **One integration branch, one move to master.** Every step lands on `integration/charts` (S1 creates it; each step is a PR against it). During development each chart component keeps its Chart.js implementation beside the new one, selected by a temporary dev-only flag (DevOptionsModal checkbox + `__mt` handle, default Chart.js), so reviewers compare the two renderings in the browser per step. When the last step is in, a single move PR brings the whole branch into `master`, and the removal of the Chart.js code ships inside that same PR: master never carries both chart libraries, and users get the new charts in one deploy. The calendar has no Chart.js half to compare against: it is verified against the existing calendar's behaviour directly.

Users see no behaviour change except the recorded deviations below: error markers may become dots, PB-line labels lose their badge background, zero-value bars may render at zero width, and tooltips move from the canvas to the library's DOM tooltip (styled to match via the scss tokens).

## User Stories

1. As a signed-in user on my account page, I want my typing speed history to look and behave as it does today (speed/accuracy/averages/PB lines, toggles, tooltip, click-to-open-result), so that the chart rework changes nothing I rely on.
2. As a user, I want the history chart to re-theme instantly when I change themes, so that it matches the rest of the site.
3. As a user on the result page, I want the result chart (wpm, raw, burst, errors, PB lines, legend, word highlighting on hover) to behave as it does today.
4. As a user, I want the daily activity, histogram, and mini result charts to look as they do today.
5. As a developer, I want chart colours for axes, grids and tooltips to live in one CSS file next to our other theme variables, so that a new theme needs no chart code changes.
6. As a developer, I want each chart to be plain Solid: data prepared as typed rows, a memoized chart definition, one `Chart` component, so that charts follow the rest of the codebase (reactivity, theming, testing).
7. As a developer, I want to flip every chart between the old and new renderer with one dev switch, so that I can verify parity page by page in the browser.
8. As a developer, I want the project's chart dependencies to stay in the `vendor-chart` bundle, so that the chart code doesn't bloat the app or vendor-tanstack chunks.
9. As a user, I want charts to stay fast as my data grows, so that a measured, gated step decides when the dense charts move to the canvas renderer.
10. As a maintainer, I want the Chart.js dependency removable in one final step once every chart is verified, so that the migration leaves no two-lives state behind.
11. As a signed-in user, I want my activity calendar on the account page (and a profile's calendar on the profile page) to keep its current look — day cells coloured from no tests (background) through four intensity levels, months above, weekdays to the side, the less→more legend, the UTC note — rendered by the new chart engine.
12. As a user on a narrow screen, I want the calendar to stay usable: weekday labels shorten or hide and month labels thin out as the chart narrows, instead of the grid overflowing.

## Implementation Decisions

- **Package**: `@tanstack/charts` (exact `1.5.0`) with the `solid-js` peer. `Chart` is imported from `@tanstack/charts/solid`. The `@tanstack/solid-charts` compat package is not used (its README points new applications to the adapter subpath). Granular subpaths are used where a capability is optional: `scales/linear|point|band|time`, `tooltip`, `regression`, `d3/shape`, `focus`, `mark/decorative`, `crosshair`.
- **No wrapper component.** The old `common/ChartJs.tsx` is a Chart.js-specific wrapper; the new charts import `Chart` directly. The library's `Chart` is the wrapper.
- **Per-chart shape**: each chart component keeps its data preparation (the existing memos: buckets, moving averages, PB lines, …) as plain typed rows, adds a pure exported definition builder (`build…Definition(rows, theme, …) → ChartDefinition`), memoizes the complete definition against the values it captures (data, `getTheme()`, config reads, visibility), and renders `<Chart definition={…} ariaLabel={…} height={…} />` in the existing sized container. Fixed heights stay the ones the containers already use (400/200px, the result page's `h-50`, the modal's `h-60`); width follows the container via the adapter's responsive measurement (`initialWidth` supplies the first frame).
- **Chart-to-grammar mapping**:
  - Lines: `lineY`; smooth curves via `d3Curve(d3.curveCardinal.tension(0.5))` (Chart.js global `tension: 0.5`); straight where today is straight (daily-activity line). Where both look acceptable in the comparison, monotone is the fallback.
  - Fills: `areaY`/gradient or `fill` + `fillOpacity` (result burst fill; the themed-area catalog example is the reference composition, with `decorative()` on the area/line where only the points or the tooltip should be interactive).
  - Bars: `barY` with the existing categorical domain (histogram buckets, about-page histogram, daily-activity minutes).
  - Error markers (rotated cross today): a small shared custom mark built with `createMark`/`compositeMark` drawing constant-pixel cross arms, reusing the existing "hidden when zero" radius logic; if the custom mark proves fiddly, plain `dot` is the recorded fallback.
  - PB/funbox/percentile/identity annotation lines: `ruleY`/`ruleX` (+ `text` marks for labels); labels are plain text — the badge background is dropped (deviation).
  - Daily-activity trendline: the `linearRegressionY` mark (dotted) replaces `chartjs-plugin-trendline`.
  - Dual y-axes (result, history, daily activity, mini result): named scales with `channel: 'y'` + `side` + `yScale` binding; reversed axes via `reverse: true` (history x and accuracy); axis titles/labels via `axis.label`/`axis.ticks.format` (ticks thin and rotate automatically, replacing `autoSkip*`).
  - Time scale (daily activity): the compact `scaleUtc` with `Intl.DateTimeFormat` tick formatting, or `d3-scale`'s `scaleTime` if the day ticks need it; the date adapter is gone.
  - Tooltips: the library's DOM tooltip. Rich content (history, daily activity) via `format`/`formatGroup` and/or `renderTooltipBody` (Solid JSX inside the tooltip body). Focus modes: `group-x` where today is `mode: "index"`, `nearest`/`nearest-x` where today is `nearest`. The result chart's word-highlight side effect moves from the tooltip `afterLabel` callback to the `onFocusGroupChange`/`onFocusChange` callback.
  - Click-to-open-result on the history chart: `onSelect`.
  - Legends: none — the Chart.js wrapper never registered the legend plugin, and the result chart's legend is its own HTML overlay, which stays.
- **Activity calendar** (own PR after the first): `cell(days, { x: 'week', y: 'weekday', color: 'level', key: 'dateKey' })` with a compact `scaleBand` week domain (0…week count) and a seven-value weekday domain; levels from the ported `getBuckets` algorithm (trim 10% off each end of the non-zero test counts, average the middle, buckets at `floor(mid/2)`, `mid`, `mid*1.5` → levels 0–4) computed in the component over the visible window; the window (last 52 weeks, or the full selected year) comes from `days`; month labels are x-axis ticks with explicit values + `format` + the built-in `thin` (responsive, like the example); the weekday column is a y-axis whose tick labels shorten ("Sunday" → "Sun") or hide via the responsive `chart` builder; cells stay square through `aspectRatio = weekCount / 7` with responsive width. Levels colour via a `scaleOrdinal` range of `--activity-level-0…4` variables (defined in `tanstack-charts.scss`, the same `color-mix` values as today: `--bg-color` / `--main-color` at 20/50/75/100% over `--sub-alt-color`), shared with the less→more legend. The per-day tooltip label ("3 tests on Monday 13 May 2025" / "no activity on …") moves to the tooltip `format`; keyboard focus is enabled (the example's setting) — an improvement over the balloon. Out-of-window week filler days are simply not drawn. The component keeps its Solid chrome (year dropdown on the account page, total-tests title, legend, UTC note, no-data state) and takes `days: TestActivityDay[]` + `isAccountPage` as props; its only imports from `states/test-activity` are `loadAllYearsTestActivity` and the `TestActivityDay` type. The port retires `elements/test-activity.ts` (189 lines, sole caller was the old component) and the now-dead calendar helpers/types in `states/test-activity.ts` (`getLast12MonthsCalendar`, `getYearCalendar`, `getMonths`, `getCells`, `getTotalTests`, `buildCalendar`, `getBuckets`, `TestActivityCalendar/Cell/Month`); `toTestActivityDays` stays (the user query and the profile view use it).
- **Theme colors**: `src/styles/tanstack-charts.scss` sets, on the chart host class: `color` (foreground for ticks, labels, titles, grid defaults) from the text/sub variables, `--ts-chart-1…4` from `--main-color`/`--sub-color`/`--error-color`/`--sub-alt-color`, and `--ts-chart-tooltip-*` (background from `--bg-color`, border/radius/shadow from sub-alt + roundness). It is imported in `vendor.scss` alongside the other vendor libraries. Visible grid lines that Chart.js painted with `subAlt` are set per-scale with that variable in the definition. Data-mark paints resolve the theme state in the definition as today.
- **Bundle**: `vite.config.ts` `vendor-chart` group test becomes `/node_modules\/(chart|@tanstack\/charts|d3-)/` and the group moves ahead of `vendor-tanstack` (first match wins), so the core, its d3 dependencies, and the legacy Chart.js packages all land in one chunk until the removal step. No `@tanstack/charts/canvas` import ships until the (later) canvas step.
- **Parity flag**: one dev-only boolean (dev state module, DevOptionsModal checkbox, exposed on `__mt`) that each chart component reads to pick between its two implementations; it defaults to Chart.js, so an unverified chart on the integration branch behaves exactly as on master, and tests are unchanged. Both implementations in a chart component are visible side by side in code; the old half carries a `// Stepping stone: replaced by the TanStack implementation; removed in S12` comment.
- **Intended deviations** (user-visible, accepted): error markers may render as dots instead of rotated crosses; PB/funbox annotation labels lose their rounded badge background; zero-value bars may render at zero width (no `minBarLength`); tooltips are DOM elements with the library's positioning instead of Chart.js's on-canvas box (visuals matched via the scss tokens).

## Testing Decisions

- **Seam: the definition builders.** Each chart's definition builder is pure (rows + theme + config in, `ChartDefinition` out) and gets a new spec asserting the analytical contract on fixed data: mark list and paints, scale domains/positions/reversal, annotation values, and the tooltip `format`/`formatGroup` output. The calendar's pure helpers get the same treatment: window selection, week/weekday placement, the `getBuckets` levels (outlier trimming included), month tick values, and the per-day tooltip strings on fixed day arrays. This is the highest seam that doesn't require a renderer; prior art: the existing `ResultChart.spec.tsx` (which asserts PB line contents through a mocked chart) keeps its assertions against the definition builder.
- **Existing app specs stay green unchanged.** They run with the flag at its Chart.js default and keep their current `vi.mock` of `common/ChartJs` (the test-page harness mock included). If the `@tanstack/charts/solid` import misbehaves in jsdom on the new branch (it never mounts in tests), the harness gains a mock of the adapter only.
- **Browser parity check** is the behaviour gate per PR, per `docs/AGENT_BROWSER.md`: with the dev flag both ways, compare each touched chart (theme on, theme off, hover/click/tooltip, resize).
- No new automated renderer tests (no screenshot-diff harness in this repo); the parity flag and the removal step are the gates.

## Out of Scope

- Converting any chart to the canvas renderer now; measuring performance and converting only if warranted is a later, separate step (roadmap S11).
- Deleting any Chart.js code before the move: the dependencies, `ChartJs.tsx`, mocks, the `chartCanvas` rule, the storybook stories, and the parity flag are removed in the move PR into master (S12) — one deploy, no intermediate master state. The move starts when the maintainer asks, after every step's parity is verified on the branch.
- New chart features (replay charts, …): the migration is behaviour-preserving.
- Changing what the activity calendar shows (which windows, which levels, what the tooltip says): it keeps today's behaviour; the calendar step is a rendering replacement, not a redesign.
- The solid-monkeytype migration effort (`docs/specs/solid-monkeytype/`): separate spec and roadmap; these PRs don't touch it, except that both are "built the Solid way".

## Further Notes

- The library's docs follow `main`; pin the implementation to the `v1.5.0` release-source docs (the published version this spec targets).
- Bundle: the integration branch temporarily carries the TanStack core (~43–50 kB gzip) beside Chart.js (~46–60 kB); the move PR (S12) ships only the TanStack half, so master's bundle moves once, netting roughly neutral. Track the chunk with `vite-plugin-inspect` on the branch and in the move PR.
- The account history chart's `deferUpdates` (500 ms idle) exists because Chart.js redrawing 7k points was expensive; keep an equivalent gate on the new implementation's definition updates if the S11 measurement shows updates are costly, otherwise drop it.

## Settled decisions

| # | Decision | Outcome |
|---|---|---|
| 1 | Package | `@tanstack/charts` + `@tanstack/charts/solid`, not the `@tanstack/solid-charts` compat package |
| 2 | Renderer | SVG only for now; no canvas imports; a later measurement step decides on canvas for the dense charts |
| 3 | Parity | Temporary global dev-only renderer flag (DevOptionsModal + `__mt`), default Chart.js, deleted with the Chart.js code |
| 4 | Deviations | Error markers: keep the cross via a small custom mark (dot is the accepted fallback); plain text PB labels; no `minBarLength` |
| 5 | Curves | `d3Curve(cardinal, tension 0.5)`, monotone as visual fallback; `d3-shape` joins the bundle |
| 6 | PRs | 1: infra + four easy charts · 2: activity calendar · 3: history · 4: result · 5: dev modal · then S11 measure, S12 removal on request |
| 7 | Docs | Local `docs/specs/tanstack-charts/`, no GitHub issues |
| 8 | Calendar placement | Its own PR after the first (S7): a self-contained `cell`-mark chart needing only the foundation, but too visible to mix into the simple-charts PR |
| 9 | Calendar internals | The component works only on `days` and computes window/levels/months/weekdays itself (ported `getBuckets`); from `states/test-activity` it imports only `loadAllYearsTestActivity` (+ type). The legacy `elements/test-activity.ts` and the dead calendar helpers go with it; the solid-monkeytype U2 row keeps its remainder text but links to S7 |
| 10 | Calendar chrome | The chrome (year dropdown, title, legend, UTC note, no-data) stays Solid; only the grid becomes the chart — months as x-axis ticks, weekday column as responsive y-axis ticks |
| 11 | Branching | All steps land on integration branch `integration/charts` (one PR per step against it); when the plan is done, one move PR brings the branch into master, removal included, so master never ships two chart libraries |
