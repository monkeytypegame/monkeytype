# Commit Changes

Trigger: user asks to commit, or uses /commit

## Steps

1. Determine what to commit:
   - Run `git diff --cached --name-only` to check for staged changes.
   - If there are staged changes, commit only those. Tell the user: "Committing staged changes."
   - If no staged changes, run `git diff --name-only` to check for unstaged changes.
   - If there are unstaged changes, stage all of them (`git add` each file by name) and commit. Tell the user: "Staging and committing all changes."
   - If no changes at all, tell the user "Nothing to commit." and stop.
2. Run `git diff --cached` to see the full diff of what will be committed.
3. Write a conventional commit message:
   - Format: `<type>: <description>`
   - Types: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test`, `perf`
   - Description: lowercase, imperative mood, no period, concise
   - Pick the type that best fits the change. Use `feat` for new features, `fix` for bug fixes, `refactor` for code restructuring, `style` for visual/CSS-only changes, `chore` for maintenance/tooling.
   - Add a body (separated by blank line) only if the description alone is insufficient to understand the change.
4. Show the user the proposed commit message and ask for confirmation before committing.
5. On confirmation, create the commit. Use a HEREDOC for the message:
   ```
   git commit -m "$(cat <<'EOF'
   <type>: <description>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```
6. Run `git status` after to verify success.
