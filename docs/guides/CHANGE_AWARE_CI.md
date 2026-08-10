# Change-Aware CI Strategy

This document explains how `.github/workflows/ci.yml` decides which jobs to
run for a given push or pull request, and how to extend it.

## Why

Before this change, `ci.yml` and `tests.yml` ran the full lint → type-check →
build → test sequence on every PR, including PRs that only touched a
`README.md` or a GitHub Actions file. That wastes Actions minutes and slows
down feedback for contributors making small, low-risk changes — a common
pattern in a GSSoC repo with many first-time contributors submitting
doc/typo fixes.

## How change detection works

A single job, `detect-changes`, runs first and uses
[`dorny/paths-filter`](https://github.com/dorny/paths-filter) to diff the
incoming commits against the base branch (for PRs) or the previous commit
(for pushes to `main`). It classifies every changed file into one or more of
these categories:

| Category    | Paths                                                                                     | Meaning                                    |
| ----------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `workflows` | `.github/workflows/**`                                                                    | CI/automation definitions                   |
| `docs`      | `**/*.md`, `docs/**`, issue/PR templates                                                  | Documentation only                          |
| `config`    | `package.json`, `tsconfig*.json`, `vite.config.ts`, `tailwind.config.ts`, `Dockerfile`, … | Build/tooling configuration                 |
| `assets`    | `public/**`                                                                                | Static assets (icons, images, manifest)     |
| `supabase`  | `supabase/**`                                                                              | Database migrations, functions, config      |
| `tests`     | `**/*.test.ts(x)`, `**/*.spec.ts(x)`, `src/test/**`                                       | Test files                                  |
| `source`    | `src/**`, `index.html`                                                                     | Application code                            |

A file can belong to more than one category (e.g. `src/lib/foo.test.ts`
matches both `source` and `tests`) — that's intentional. Every other job
reads the boolean outputs of `detect-changes` and decides independently
whether it has anything relevant to do.

## Job → category mapping

| Job                   | Runs when                          | Rationale                                                        |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| `lint-and-typecheck`   | `source` \|\| `tests` \|\| `config` | Anything that gets compiled or linted changed                     |
| `build`                | `source` \|\| `config`, and lint passed | A build only needs re-validating if app code or its config changed |
| `unit-tests`           | `source` \|\| `tests` \|\| `config` | Same code paths that affect lint/type-check affect test outcomes  |
| `validate-workflows`   | `workflows`                         | Lints the workflow YAML itself (`actionlint`) instead of the app  |
| `validate-supabase`    | `supabase`                          | Validates Supabase migrations/config without touching the app     |
| `ci-summary`           | always                              | Aggregates results; see below                                     |

Because the conditions are independent per job, the examples from the issue
fall out naturally with no extra "only" flags to maintain:

- **Docs-only PR** → `docs=true`, everything else `false` → `lint`, `build`,
  `test` all skip. Nothing runs except `detect-changes` and `ci-summary`.
- **Workflow-only PR** → `workflows=true` only → `validate-workflows` runs,
  app jobs skip.
- **Asset-only PR** (e.g. swapping a favicon) → `assets=true` only → nothing
  expensive runs.
- **Any `src/**` change** → `source=true` → full lint/build/test pipeline
  runs, same as before this change.

## Branch protection / required checks

Skipped jobs are **not** the same as passing jobs from GitHub's point of
view — a required check that gets skipped is reported as "pending" forever,
which blocks merges. To avoid that, branch protection should require only
one job: **`CI summary` (`ci-summary`)**. It always runs (`if: always()`),
prints a table of what ran/skipped and why to the job summary, and fails
only if a job that actually executed reported `failure` or `cancelled`.
Skipped jobs are treated as "not applicable," not as failures.

If you add a new conditional job, add it to `ci-summary`'s `needs:` list and
to the result-checking loop, or it won't gate the merge.

## Concurrency

The workflow sets:

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

so pushing a new commit to a PR cancels the in-flight run for the previous
commit instead of letting both finish.

## Extending this

- **New source directory** (e.g. a future `server/` or `functions/`
  directory): add a filter entry and, if it needs its own pipeline instead
  of piggybacking on `source`, add a new category + job following the same
  `needs: detect-changes` / `if:` pattern, then wire it into `ci-summary`.
- **Frontend/backend split**: if the repo grows a real backend directory,
  duplicate the `lint-and-typecheck` / `build` / `unit-tests` trio scoped to
  that directory's filter category so frontend-only and backend-only PRs
  each run just their own pipeline, as called out in the original issue.
- **Reusable workflow**: once there's more than one repo/workflow needing
  the same `detect-changes` logic, extract it into
  `.github/workflows/detect-changes.yml` with `workflow_call` and have
  `ci.yml` call it via `uses:` — kept as a single workflow file here to
  minimize surface area for the initial implementation.
