# Monkeytype AI Coding Instructions

Make the responses extremely concise. Sacrifice grammar for the sake of concision.

## Architecture
**Monorepo**: pnpm + Turborepo with frontend (Vite + SolidJS), backend (Express + MongoDB + Redis), and shared packages.

## Commands
All commands support `-fe`, `-be`, `-pkg` suffixes for targeted execution:
```bash
pnpm run lint-fe    # Frontend linting
pnpm run test-be    # Backend + integration tests  
pnpm run build-pkg  # Packages only
pnpm run dev        # All workspaces with hot reload
```

## SolidJS Migration
Frontend is partially migrated - new components use SolidJS (`.tsx`), legacy code remains vanilla JS. 

## Debug Tips
- Type/lint errors: Run `pnpm run lint` (OXLint is source of truth, not tsc)

## Key Files
- `turbo.json`: Task deps and caching
- `frontend/src/ts/config-metadata.ts`: Config validation rules
- `packages/contracts/src/index.ts`: API contract structure
- `packages/funbox/src/list.ts`: All funbox definitions
- `backend/src/api/routes/index.ts`: ts-rest setup
