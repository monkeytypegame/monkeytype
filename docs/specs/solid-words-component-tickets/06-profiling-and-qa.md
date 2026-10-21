# 06 — Profiling + manual browser QA (HITL)

Status: open
Blocked by: 04, 05

## What
See spec "Testing Decisions" (manual QA checklist, profiling). Read `docs/AGENT_BROWSER.md` first.
- Run the manual QA checklist on the integration branch; file follow-up fixes as needed.
- Profile per-keystroke cost (input handler time + frame time) master vs integration branch, long timed test, tape mode on. Regression blocks merge.
