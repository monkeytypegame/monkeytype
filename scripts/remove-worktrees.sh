#!/usr/bin/env bash
# Removes the named worktrees and deletes their branches once merged into
# master. Takes explicit names only, so a cleanup never reaches another
# session's worktrees. Worktrees with uncommitted changes are skipped.
#
# usage: scripts/remove-worktrees.sh <worktree-path-or-agent-id>...
#   e.g. scripts/remove-worktrees.sh agent-a560db02f6eba0c50 ../other-worktree
set -uo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: scripts/remove-worktrees.sh <worktree-path-or-agent-id>..." >&2
  exit 1
fi

main="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"
worktrees="$(git -C "$main" worktree list --porcelain | sed -n 's/^worktree //p')"

for name in "$@"; do
  path="$name"
  [ -d "$path" ] || path="$main/.claude/worktrees/$name"
  top="$(git -C "$path" rev-parse --show-toplevel 2>/dev/null)" || top=""
  # a worktree's own root only: not a subdirectory, not the main checkout
  if [ -z "$top" ] || [ "$top" = "$main" ] ||
    [ "$(cd "$path" && pwd -P)" != "$(cd "$top" && pwd -P)" ] ||
    ! grep -qxF "$top" <<<"$worktrees"; then
    echo "skipped $name: not a linked worktree root" >&2
    continue
  fi
  if [ -n "$(git -C "$top" status --porcelain)" ]; then
    echo "skipped $name: uncommitted changes" >&2
    continue
  fi

  branch="$(git -C "$top" branch --show-current)"
  # clean per status above; --force only covers ignored files (linked node_modules)
  if ! git -C "$main" worktree remove --force "$top"; then
    echo "skipped $name: git worktree remove failed" >&2
    continue
  fi
  echo "removed $top"

  if [ -n "$branch" ]; then
    if git -C "$main" merge-base --is-ancestor "$branch" master; then
      git -C "$main" update-ref -d "refs/heads/$branch" &&
        echo "deleted branch $branch (merged into master)"
    else
      echo "kept branch $branch (not merged into master)"
    fi
  fi
done
