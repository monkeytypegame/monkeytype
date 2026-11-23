# Coding Standards

Judgement calls for review. Mechanical rules live in oxlint (`packages/oxlint-config`, `frontend/.oxlintrc.json`) — not repeated here.

## Styling (SolidJS)

- Tailwind classes via the `class` prop. Conditional classes: `class={cn("base", { "opacity-0": cond() })}` (`frontend/src/ts/utils/cn.ts`, tailwind-merge — later classes win).
- Colors: only those defined in the Tailwind config. No hex/rgb literals, no inline `style` for anything Tailwind can express (arbitrary values like `grid-cols-[...]` are fine).

## Icons

- Legacy (vanilla) code: `<i class="fas fa-...">` FontAwesome tags.
- Solid code: `Fa` component (`frontend/src/ts/components/common/Fa.tsx`).

## Refs

- Callback ref assignment: `let inputRef: HTMLInputElement | undefined;` + `ref={(el) => (inputRef = el)}`. Not the `let ref!: T` definite-assignment pattern.
- Act on refs in `onMount`, not `createEffect`.

## Modals

New Solid modal must be registered in both:

1. `frontend/src/ts/components/modals/Modals.tsx` — render it
2. `frontend/src/ts/states/modals.ts` — add its `ModalId`

Missing either → modal never shows.

## Solid migration

- When migrating a module, convert its importers to named imports too, and rename overly generic exports (`getState` → `getClientState`) so named imports stay readable.
- Build it the Solid way, not as a port: state in signals, stores or queries; derived values as memos or plain functions; effects only for real side effects; components own their elements and lifecycle. A straight port or bridge is allowed only as a stepping stone (splits the work, or unblocks other conversions), and gets a comment saying it's temporary, what replaces it, and the roadmap step if one matches (`// Stepping stone: replaced by <what> in T7`). See spec, "Built the Solid way, not ported".

## Types

- API request/response shapes come from `@monkeytype/contracts` (bodies: `<Name>Response`, base: `util/api`); domain shapes from `@monkeytype/schemas`. A diff that writes such a shape inline reuses or derives from those instead.

## Comments

- A diff that changes behaviour updates the comments describing it: search comments for every name the diff removes or renames (functions, components, files, docs).
