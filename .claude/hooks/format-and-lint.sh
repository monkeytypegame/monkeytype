#!/bin/bash
# PostToolUse hook: format, lint, and run matching test for edited file.
# Exit 2 surfaces stderr to Claude.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only run on ts/tsx/js/jsx files
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx && "$FILE_PATH" != *.js && "$FILE_PATH" != *.jsx ]]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT" || exit 0
REL_PATH="${FILE_PATH#"$ROOT"/}"

FAILED=0

npx oxfmt "$REL_PATH" >/dev/null 2>&1 || true

# Lint from the file's package dir so its .oxlintrc.json applies
case "$REL_PATH" in
  packages/*) PKG_DIR=$(echo "$REL_PATH" | cut -d/ -f1-2) ;;
  frontend/* | backend/*) PKG_DIR=$(echo "$REL_PATH" | cut -d/ -f1) ;;
  *) PKG_DIR=. ;;
esac
if ! LINT_OUT=$(cd "$PKG_DIR" && npx oxlint --type-aware --type-check --format agent "${REL_PATH#"$PKG_DIR"/}" 2>&1); then
  echo "$LINT_OUT" | grep -v -i browserslist >&2
  FAILED=1
fi

# Run matching test file if it exists
# Map frontend/src/ts/<path>/<file>.ts(x) -> frontend/__tests__/<path>/<file>.spec.ts(x)
if [[ "$REL_PATH" == frontend/src/ts/* ]]; then
  REL="${REL_PATH#frontend/src/ts/}"
  BASE="${REL%.*}"
  EXT="${REL##*.}"
  TEST_FILE="__tests__/${BASE}.spec.${EXT}"
  if [[ -f "frontend/$TEST_FILE" ]]; then
    TEST_OUT=$(cd frontend && NO_COLOR=1 npx vitest run "$TEST_FILE" 2>&1)
    if [[ $? -ne 0 ]]; then
      echo "$TEST_OUT" | tail -40 >&2
      FAILED=1
    fi
  fi
fi

[[ $FAILED -eq 1 ]] && exit 2
exit 0
