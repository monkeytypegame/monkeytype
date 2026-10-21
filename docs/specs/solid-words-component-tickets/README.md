# Tickets: Solid `Words` component

Spec: `../solid-words-component.md`

| # | Ticket | Blocked by | Type |
|---|---|---|---|
| 01 | Render-state store + `Words` component (standalone) | – | AFK |
| 02 | Letter icons via `Fa` (`getLetterIcon`) | 01 | AFK |
| 03 | Wire `Words` into test page, delete old renderer | 01, 02 | AFK |
| 04 | Hints into component-owned container | 03 | AFK |
| 05 | Node removal → state (line jump, tape, zen, `isWordRendered`) | 03 | AFK |
| 06 | Profiling + manual browser QA | 04, 05 | HITL |

Integration branch is not shippable until 04 and 05 are merged (03 alone breaks hints and line jump/tape).

Status: mark a ticket done by changing `Status: open` → `Status: done` in its file.
