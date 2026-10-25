Be extremely concise. Sacrifice grammar for concision.
Frontend is partially migrated from vanilla JS to SolidJS — new components use `.tsx`, legacy code remains vanilla.
Single test file: `pnpm vitest run path/to/test.ts`
When running oxc lint, always use `--format agent`.
Format with `npx oxfmt <files>` (not prettier).
For typechecking, use `pnpm oxlint --type-aware --type-check` instead of `tsc`.
Coding standards (styling, icons, refs, modals) for writing and reviewing code: `CODING_STANDARDS.md`.
Before any browser testing, read `docs/AGENT_BROWSER.md` (dev server, `window.__mt` debug handle, gotchas).
Roadmap steps (C1, EP1…): `docs/specs/solid-monkeytype/roadmap.md`. Done = tests, lint and a browser check; tick the row, then update rows that cite it.
In a git worktree, run `scripts/setup-worktree.sh` before building or testing; there, pnpm tries to reinstall unless `pnpm_config_verify_deps_before_run=false` is set, else run tools via `node_modules/.bin/`.
In plan mode, before writing up a plan, ask clarifying questions if needed. At the end of plan mode, give me a list of unresolved questions to answer, if any. Make them concise.