# Review Changed Files

Trigger: user asks to review changes, review code, or uses /review

## Steps

1. Determine what to review, in priority order:
   - If the user has selected specific lines/code, review that selection. Tell the user: "Reviewing selection."
   - Otherwise, run `git diff --cached --name-only`. If there are staged changes, review only staged changes (`git diff --cached`). Tell the user: "Reviewing staged changes."
   - Otherwise, run `git diff --name-only`. If there are unstaged changes, review only unstaged changes (`git diff`). Tell the user: "Reviewing unstaged changes."
   - Otherwise, review the last commit (`git diff HEAD~1`). Tell the user: "Reviewing last commit."
2. Read the full file for each changed file (not just the diff) to understand context.
3. Review for:
   - **Bugs**: null/undefined access, race conditions, off-by-one errors, missing error handling at system boundaries
   - **Dead code**: unused imports, variables, functions, or parameters introduced or left behind by the changes
   - **Redundancy**: code that duplicates existing logic or can be simplified
   - **Consistency**: does the change follow patterns established in surrounding code and project conventions (see CLAUDE.md)
   - **Tailwind**: non-canonical classes, inline styles that should be Tailwind, missing responsive variants if siblings have them
   - **Solid-specific**: broken reactivity, missing cleanup, doing things not the "Solid way"
   - **Improvements**: any other changes that would make the code more robust, readable, maintainable, better
4. Output a concise list of findings. Highlight which issues should be absolutely fixed before merging/committing. If nothing found, say "No issues found."
