# MusicType Branching Model

This repository is a long-lived fork of MonkeyType. The goal of this branching model is to:

- keep upstream syncs clean and predictable,
- isolate MusicType product development,
- make upstream integration explicit via reviewable pull requests.

## Branches

- `upstream-main`: Local mirror branch of MonkeyType upstream default branch (`upstream/master` in this repo).
- `musictype-main`: MusicType product trunk and default integration branch for all new work.
- `feature/*`: Short-lived branches for product work.
- `sync/upstream-YYYY-MM-DD`: Temporary branches used only for each upstream sync pull request.

## One-Time Setup

Run from repo root:

```bash
git remote add upstream https://github.com/monkeytypegame/monkeytype.git
git fetch upstream

# This fork currently tracks upstream/master (not upstream/main)
git switch -c upstream-main upstream/master
git push -u origin upstream-main

git switch -c musictype-main upstream-main
git push -u origin musictype-main
```

If `upstream` remote already exists, skip the `git remote add upstream ...` line.

## Day-to-Day Development

```bash
git switch musictype-main
git pull --ff-only

git switch -c feature/<short-name>
# work, commit
git push -u origin feature/<short-name>
```

Open pull request:

- source: `feature/<short-name>`
- target: `musictype-main`

## Upstream Sync Workflow (Weekly/Biweekly)

1. Update upstream mirror branch.
2. Merge upstream mirror into a temporary sync branch from `musictype-main`.
3. Resolve conflicts and run tests.
4. Merge sync PR into `musictype-main`.

```bash
git fetch upstream

git switch upstream-main
git merge --ff-only upstream/master
git push origin upstream-main

git switch musictype-main
git pull --ff-only

git switch -c sync/upstream-YYYY-MM-DD
git merge --no-ff upstream-main
# resolve conflicts, run tests
git push -u origin sync/upstream-YYYY-MM-DD
```

Open pull request:

- source: `sync/upstream-YYYY-MM-DD`
- target: `musictype-main`

## Required Guardrails

1. Protect `upstream-main`:
   - no direct pushes from humans (or bot-only push policy),
   - no regular feature PRs into this branch.
2. Protect `musictype-main`:
   - pull request required,
   - required status checks (CI) before merge,
   - no force pushes.
3. Never rebase or force-push shared long-lived branches:
   - `upstream-main`
   - `musictype-main`
4. Enable `rerere` to reduce repeated conflict resolution effort:

```bash
git config rerere.enabled true
```

Use `--global` if you want this enabled for every local repository:

```bash
git config --global rerere.enabled true
```

## Decision Rules

- Always branch features from `musictype-main`.
- Never develop directly on `upstream-main`.
- Never merge `feature/*` directly into `upstream-main`.
- Keep upstream syncs in dedicated `sync/upstream-*` branches for auditable history.

## Suggested Repository Defaults

- Set default branch on GitHub to `musictype-main`.
- Keep `master` untouched unless you intentionally use it for migration/compatibility.
- Schedule regular upstream sync cadence (for example every Monday).
