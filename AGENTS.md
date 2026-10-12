Be extremely concise. Sacrifice grammar for concision.
Frontend is partially migrated from vanilla JS to SolidJS — new components use `.tsx`, legacy code remains vanilla.
Single test file: `pnpm vitest run path/to/test.ts`
When running oxc lint, always use `--format agent`.
For typechecking, use `pnpm oxlint --type-aware --type-check` instead of `tsc`.
Coding standards (styling, icons, refs, modals) for writing and reviewing code: `CODING_STANDARDS.md`.
Browser testing, dev server, `window.__mt` debug handle: `docs/AGENT_BROWSER.md`.
In plan mode, before writing up a plan, ask clarifying questions if needed. At the end of plan mode, give me a list of unresolved questions to answer, if any. Make them concise.