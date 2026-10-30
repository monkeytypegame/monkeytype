Status: settled — ready for ticketing (planned in [#8545](https://github.com/monkeytypegame/monkeytype/pull/8545))

# Spec: the Rust + WebAssembly rewrite

Full-stack rewrite of Monkeytype in Rust: the entire UI in Rust compiled to WebAssembly, the server in Rust. One big-bang build, one cutover.

## Settled decisions

1. **Scope**: both frontend and backend.
2. **Frontend**: full UI in Rust (**Leptos**), compiled to WebAssembly. The SolidJS migration is **abandoned**.
3. **Backend**: Rust; same HTTP API, same MongoDB schema.
4. **Mode**: big bang — the rewrite builds on an **integration branch in this repo** (`rust-rewrite`); master keeps running the old site until cutover.
5. **Feature freeze** from P0: no new features on master; critical bugfixes and security only.
6. **Parity target**: current production only; tribe (`newtribemerge`) is out of scope.
7. **No fallback**: if P0 fails any gate, the project stops — the solid roadmap is not revived (already superseded, decision 2).
8. **Beta**: subdomain before cutover.
9. **Queue**: Redis streams replace bullmq; no Postgres.

## Ground truth (scouted)

| Fact | Consequence |
|---|---|
| Frontend ~81k TS lines: components 37k, test 9.1k, utils 5.7k, states 3k, config 2.9k, controllers 2.4k, elements 2.2k, input 1.9k, router 1k | Port is the bulk of the effort; components shrink ~40% in Rust (Leptos is terser) |
| Word generation uses `Math.random` (`words-generator.ts`), no seeded reproducibility | No seed-compat constraint. Parity = replay a recorded RNG stream into the Rust generator, expect identical words |
| Auth = Firebase ID tokens verified server-side (`firebase-admin`, LRU-cached) | Replace with JWKS + signature verification; no client SDK needed |
| Backend: Express 5, MongoDB, Redis (bullmq), nodemailer+MJML, cron, anticheat, prom metrics | Crate-for-crate mapping exists for everything; queue is the one design gap (decision 9) |
| Solid spec (`solid-monkeytype/spec.md`): 3-layer test architecture, `data-ui-*` theme contract, one state home per concern, ~50 user stories | Inherited verbatim — it is language-agnostic. Its user stories are this rewrite's acceptance checklist |
| Theming/funbox/custom CSS target the DOM contract | SCSS files carry over; the contract becomes `data-ui-*` only → one announced custom-CSS break at cutover |

## Architecture

Cargo workspace, one `core` compiled for both targets:

```
crates/
  core/     platform-free domain: word generation, funbox logic, challenges, live stats,
            result computation, config metadata, schemas (serde).
            Native → server; WASM → web. All parity fixtures live here.
  server/   axum app: same REST paths and shapes as today; MongoDB (same collections),
            Redis streams, Firebase ID-token auth, mail, cron, anticheat, metrics.
  web/      Leptos (client-rendered) + wasm-bindgen: router, all pages, the test.
```

- **Test page**: inherit the solid spec's three layers — DOM-free **engine** (commands + read-only signals, owns EventLog/timer/stats/funbox plugins), **input layer** (WASM event handlers → commands; never renders synchronously), **render layer** (Leptos components; imperative DOM only inside the component that owns the element: caret, canvas, fades, layout).
- **Web plumbing**: rAF loop via `web_sys`; router (history API); signals-based query cache; `reqwest-wasm` against the same OpenAPI contract, types generated server-side.
- **Five TS packages dissolve into**: contracts → OpenAPI-generated types; schemas → serde in `core`; challenges, funbox, util → `core` modules. One implementation, both targets.
- **No data migration** (same schema, same API). **Theming**: SCSS copied; `data-ui-element`/`data-ui-state`/`data-ui-variant` is the only contract.
- **Testing**: `core` = native unit tests + parity fixtures (fast, exhaustive). `web` = Playwright in a real browser (the vitest+jsdom harness cannot test WASM; re-implement the `__mt` debug handle for the AGENT_BROWSER.md workflow). `server` = existing integration tests re-pointed at axum.
- **Branch discipline**: work happens in worktrees off `rust-rewrite` (per the existing worktree convention); nothing lands on master until the P5 cutover merge.

### Parity (the cutover gate)

1. **Engine fixtures**: for every mode × funbox × language, record the old generator's `Math.random` stream → replay into Rust `core` → byte-identical word lists. Result computation: recorded EventLog → identical result JSON.
2. **API contract tests**: record HTTP at the edge of the old server; the Rust server must pass them unchanged.
3. **Perf gates**: 60fps typing loop on mid hardware; WASM initial bundle within the P0-measured budget; cold start ≤ today's.

## Ticket graph

IDs are stable; `/to-tickets` refines each into a self-contained ticket. A completed ticket is demoable or verifiable on its own.

### P0 — spike (gates everything; 1–2 parallel)

| ID | Ticket | Blocked by |
|---|---|---|
| P0-1 | Wordgen parity harness: record `Math.random` streams from the old generator (mode × funbox corpus); port wordgen into `core`; replay → identical word lists | none |
| P0-2 | WASM shell: Cargo workspace, Leptos CSR, trunk build, boots in browser; measure bundle + cold start; verify hard deps: webaudio, canvas, IME composition, Arabic joined-script spans | none |
| P0-3 | **Go/no-go**: minimal time-mode loop in Leptos (input → letter spans → caret → live stats) at 60fps on mid hardware; gate memo — **fail any gate → project stops** (decision 7) | P0-1, P0-2 |

### P1 — core test experience (after P0-3)

| ID | Ticket | Blocked by |
|---|---|---|
| P1-1 | Engine crate: DOM-free (phase, active word, timer, EventLog, commands, read-only signals); keystroke-log replay parity: recorded old event logs → identical letter states and live stats | P0-3 |
| P1-2 | Input layer: WASM keydown/beforeinput/composition → engine commands; render-store writes; never renders synchronously | P1-1 |
| P1-3 | Words rendering: letter/word spans with `data-ui-*`, typo hints (incl. merged), active word, direction | P1-2 |
| P1-4 | Caret and layout: caret + pace caret, line jump, tape scroll, break joining, resize/font re-layout, rAF-driven | P1-3 |
| P1-5 | Timer + live stats: rAF timer, wpm/accuracy/progress, progress bar, out-of-focus | P1-3 |
| P1-6 | All test modes: words/quote/custom/zen + mode UI (quote picker, custom text, practice words) | P1-5 |
| P1-7 | Funboxes: all funboxes in `core` + document-level effects | P1-3 |
| P1-8 | Scripts and IME: RTL, joined-script shaping/wrapping, inline composition | P1-3 |
| P1-9 | Restart and focus: config store, restart flow (fade, settings retake, single merged restart), focus mode, keymap highlight | P1-4, P1-5 |
| P1-10 | Sound and TTS: key/error sounds, monkey-power canvas, TTS | P1-5 |
| P1-11 | Finish and result: finish/fail, result computation (EventLog → result JSON parity), result screen, save status, PB/XP | P1-5, P1-9 |
| P1-12 | Result extras: chart canvas + hover→word highlight, words history, replay, screenshot | P1-11 |

### P2 — rest of site (after P0-3, parallel with P1)

| ID | Ticket | Blocked by |
|---|---|---|
| P2-1 | App shell: router, all page routes, loading page/bar, page fades, header/footer/nav, mobile nav | P0-3 |
| P2-2 | Auth client: Firebase token storage/refresh in wasm, attach to API, sign-out | P2-1 |
| P2-3 | Settings page: all config UI, funbox UI, persistence | P2-1, P1-9 |
| P2-4 | Account and profile: profile, XP/streak/level, activity calendar, tags/presets, favourite quotes, Discord linking | P2-2 |
| P2-5 | Public pages: leaderboards, quote search, about/contribution, PSAs, notifications | P2-1 |
| P2-6 | Commandline, modals, theme picker, fonts | P2-1 |
| P2-7 | Parity sweep: every solid-spec user story (1–50) green in Playwright; analytics, mobile, custom-CSS behaviour | P1-12, P2-3, P2-4, P2-5, P2-6 |

### P3 — backend (after P0-3, parallel with P1/P2)

| ID | Ticket | Blocked by |
|---|---|---|
| P3-1 | Server skeleton: axum + tokio, same env/config, MongoDB (same schema), tracing, prom metrics, health; HTTP record/replay contract harness green on a few routes | P0-3 |
| P3-2 | Auth: Firebase ID-token verification (JWKS, LRU cache), user endpoints | P3-1 |
| P3-3 | User data: config/presets/tags/quotes CRUD, profile, Discord OAuth | P3-2 |
| P3-4 | Results: submit/score, anticheat port, XP/PB/streak/today, challenges | P3-2 |
| P3-5 | Content: quotes/words/languages search, rating, admin | P3-1 |
| P3-6 | Leaderboards: MongoDB aggregation parity (same inputs → same outputs) | P3-4 |
| P3-7 | Async: Redis streams queues + workers, mail (MJML precompiled at build, lettercat), cron, rate limits, webhooks | P3-2 |
| P3-8 | Contract parity: full recorded contract suite green; load smoke vs old server | P3-3, P3-4, P3-5, P3-6, P3-7 |

### P4 — beta, P5 — cutover

| ID | Ticket | Blocked by |
|---|---|---|
| P4-1 | Beta: subdomain deploy of the Rust stack; dogfood; DB write policy (shadow vs live writes) decided here | P1-12, P2-7, P3-8 |
| P4-2 | Hardening: bug bash, in-the-wild perf, freeze held | P4-1 |
| P5-1 | Cutover: DNS switch; old stack kept warm 4–6 weeks for rollback; custom-CSS break announced; TS tree deleted and branch merged after the rollback window | P4-2 |

## Risks

- **R1 motivation**: the driver is one user request, not a measured pain. P0's go/no-go is the cheap exit; per decision 7 there is no fallback — a failed spike closes the project.
- **R2 feature freeze**: settled (decision 5); residual risk is duration (months) — no scope creep in P1–P3, and the freeze must survive the P4 beta.
- **R3 joined scripts**: Arabic/Hebrew letter-spans with connecting forms across a foreign DOM stack is the hardest UI case; P0-2 proves or kills it.
- **R4 WASM tail**: memory growth on long sessions, canvas chart perf — gated in P0-3/P1, budget set in P0-2.
- **R5 no direct crate equivalents** for MJML (precompile), sound libs, charts (hand-rolled canvas or `plotters`) — each verified in P0-2, none may be a P1 surprise.
- **R6 distribution drift**: a different RNG than `Math.random` is statistically fine (both uniform) but every `random() < p` site must keep its call count and order — the stream-replay fixtures (P0-1) enforce this.

## Disposition of existing work

- `solid-monkeytype/roadmap.md` + `spec.md`: **superseded** (decisions 2, 7). The spec's architecture section and user stories stay as the living reference this spec cites; the roadmap is closed, its unfinished rows never resumed.
- `GLOSSARY.md`: add `core` / engine-layer terms when P1 starts.

## Next steps in the flow

No tracker is configured in AGENTS.md → run `/setup-matt-pocock-skills`, then `/to-tickets` against this spec (local `.scratch/rust-rewrite/issues/` or the chosen tracker). Work tickets via `/implement`, blockers-first, in worktrees off `rust-rewrite`.
