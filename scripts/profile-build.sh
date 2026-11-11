#!/usr/bin/env bash
# Builds a production frontend for profiling (docs/PROFILING.md) and copies the
# keystroke harness next to it.
#
# usage: scripts/profile-build.sh <ref|.> <out-dir> [patch-file]
#   .    the main checkout as it is (a patch is applied for the build only)
#   ref  any commit, built in a temporary worktree that is removed afterwards
#   e.g. scripts/profile-build.sh . frontend/dist-a
#        scripts/profile-build.sh origin/master frontend/dist-c
#        scripts/profile-build.sh . frontend/dist-b variant-b.patch
#
# Keep the builds until profiling is over: a rebuild costs 1-2 minutes each.
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: scripts/profile-build.sh <ref|.> <out-dir> [patch-file]" >&2
  exit 1
fi

ref="$1"
main="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"
mkdir -p "$2"
out="$(cd "$2" && pwd)"
log="${TMPDIR:-/tmp}/profile-build-$(basename "$out").log"
patch=""
[ "$#" -ge 3 ] && patch="$(cd "$(dirname "$3")" && pwd)/$(basename "$3")"

build() {
  # older refs: their vite plugins resolve ./dist from the cwd and fail once
  # in a fresh worktree, the retry passes
  for _ in 1 2; do
    if (cd "$1/frontend" && node_modules/.bin/vite build --outDir "$out" >"$log" 2>&1); then
      return 0
    fi
  done
  echo "build failed, see $log" >&2
  return 1
}

if [ "$ref" = "." ]; then
  src="$main"
  if [ -n "$patch" ]; then
    git -C "$src" apply "$patch"
    trap 'git -C "$src" apply -R "$patch"' EXIT
  fi
  build "$src"
else
  src="${TMPDIR:-/tmp}/profile-build-$$"
  # .vscode is write-protected in the sandbox
  git -C "$main" worktree add --no-checkout --detach "$src" "$ref" >/dev/null
  trap 'git -C "$main" worktree remove --force "$src"' EXIT
  git -C "$src" sparse-checkout set --no-cone '/*' '!/.vscode/'
  git -C "$src" checkout -q
  "$main/scripts/setup-worktree.sh" "$src" >/dev/null
  [ -n "$patch" ] && git -C "$src" apply "$patch"
  build "$src"
fi

cp "$main/frontend/scripts/profiling/keystroke.js" "$out/keystroke.js"
echo "built $ref into $out"
