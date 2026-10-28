#!/usr/bin/env bash
# Prepares a git worktree (e.g. an agent's .claude/worktrees/agent-*) to build
# and test without installing: links node_modules and the gitignored build
# inputs from the main checkout.
#
# usage: scripts/setup-worktree.sh [worktree-path]   (default: current dir)
#
# pnpm's deps check before running a script sees the linked node_modules as
# out of date and tries to reinstall: set pnpm_config_verify_deps_before_run=false,
# or run tools via node_modules/.bin (vitest, vite, oxlint, oxfmt).
set -euo pipefail

worktree="$(cd "${1:-.}" && git rev-parse --show-toplevel)"
main="$(cd "$(git -C "$worktree" rev-parse --git-common-dir)/.." && pwd)"

if [ "$worktree" = "$main" ]; then
  echo "setup-worktree: $worktree is the main checkout, nothing to do" >&2
  exit 1
fi

link() {
  local rel="$1"
  [ -e "$main/$rel" ] || return 0
  [ -d "$(dirname "$worktree/$rel")" ] || return 0
  # -L: a dangling link exists too, and ln would fail on it
  if [ -e "$worktree/$rel" ] || [ -L "$worktree/$rel" ]; then return 0; fi
  ln -s "$main/$rel" "$worktree/$rel"
  echo "linked $rel"
}

# dependencies
link node_modules
for dir in frontend backend frontend/storybook "$main"/packages/*; do
  link "${dir#"$main/"}/node_modules"
done

# gitignored build inputs
link frontend/.env
link frontend/.env.production
link frontend/src/ts/constants/firebase-config.ts
link frontend/src/ts/constants/firebase-config-live.ts
link frontend/src/webfonts-generated
link frontend/static/webfonts-preview
link backend/.env
