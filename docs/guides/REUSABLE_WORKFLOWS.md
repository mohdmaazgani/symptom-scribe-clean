# Reusable CI Workflows

This document explains the reusable-workflow architecture under
`.github/workflows/reusable/` and `.github/actions/`, and how to extend it.
It's a companion to `docs/guides/CHANGE_AWARE_CI.md`, which explains *when*
each job runs; this doc explains *what* each job actually does and how the
logic is shared.

## Why

`ci.yml` decides *whether* to run lint, build, tests, workflow validation,
and Supabase validation for a given change set (see
`CHANGE_AWARE_CI.md`). Before this refactor, each of those jobs repeated the
same checkout → setup-node → install-dependencies steps inline. Any change
to the Node version, cache strategy, or package manager meant editing it in
five places. This refactor extracts that shared logic into:

1. **A composite action** (`.github/actions/install-deps`) for the
   checkout-adjacent "set up Node + install dependencies" steps.
2. **Reusable workflows** (`.github/workflows/reusable/*.yml`, using
   `on: workflow_call`) for each *job* that has real CI logic — lint,
   build, test, workflow validation, Supabase validation.

`ci.yml` itself now only contains `detect-changes` (the change-classification
logic) and `ci-summary` (the required-check aggregator). Every other job in
it is a one-line `uses:` call into a reusable workflow.

## Architecture

```
.github/
├── actions/
│   └── install-deps/action.yml       # composite action: setup-node + install
└── workflows/
    ├── ci.yml                        # orchestrator: detect-changes, calls, ci-summary
    └── reusable/
        ├── lint-typecheck.yml        # workflow_call: lint + tsc
        ├── build.yml                 # workflow_call: vite build (+ optional artifact upload)
        ├── test.yml                  # workflow_call: vitest run
        ├── validate-workflows.yml    # workflow_call: actionlint
        └── validate-supabase.yml     # workflow_call: validate supabase/config.toml
```

`ci.yml` still owns **all** conditional logic (`if:` expressions based on
`detect-changes` outputs) — reusable workflows themselves don't know or care
why they were called, they just do their one job when called.

## The composite action: `install-deps`

| Input             | Default | Description                          |
| ------------------ | ------- | ------------------------------------- |
| `node-version`      | `'20'`  | Node.js version to install            |
| `package-manager`   | `'npm'` | `'npm'` or `'bun'`                    |

Used inside every reusable workflow right after `actions/checkout@v4`:

```yaml
- uses: actions/checkout@v4
- uses: ./.github/actions/install-deps
  with:
    node-version: '20'
    package-manager: 'npm'
```

It does **not** check out the repo itself — the calling job must do that
first, since composite actions run in a job's existing workspace.

## Reusable workflows: inputs and outputs

### `reusable/lint-typecheck.yml`
Runs `npm run lint` (non-blocking, matches prior behavior) and
`npm exec tsc -b`.

| Input             | Type   | Default | Required |
| ------------------ | ------ | ------- | -------- |
| `node-version`      | string | `'20'`  | no       |
| `package-manager`   | string | `'npm'` | no       |

### `reusable/build.yml`
Runs `npm run build`. Can optionally upload `dist/` as a workflow artifact.

| Input              | Type    | Default | Required |
| -------------------- | ------- | ------- | -------- |
| `node-version`        | string  | `'20'`  | no       |
| `package-manager`     | string  | `'npm'` | no       |
| `upload-artifact`     | boolean | `false` | no       |

| Output           | Description                                              |
| ----------------- | ---------------------------------------------------------- |
| `artifact-name`    | Name of the uploaded artifact, empty if `upload-artifact` was false |

Example consuming the output from a caller workflow:

```yaml
jobs:
  build:
    uses: ./.github/workflows/reusable/build.yml
    with:
      upload-artifact: true

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: ${{ needs.build.outputs.artifact-name }}
```

### `reusable/test.yml`
Copies `.env.example` → `.env`, then runs `npm test` (`vitest run`).

| Input             | Type   | Default | Required |
| ------------------ | ------ | ------- | -------- |
| `node-version`      | string | `'20'`  | no       |
| `package-manager`   | string | `'npm'` | no       |

### `reusable/validate-workflows.yml`
No inputs. Runs `actionlint` against everything in `.github/workflows/`.

### `reusable/validate-supabase.yml`
No inputs. Validates `supabase/config.toml` is well-formed TOML. Extend this
one first if you wire up real Supabase CLI checks (see below).

## Calling a reusable workflow from `ci.yml`

```yaml
lint-and-typecheck:
  needs: detect-changes
  if: needs.detect-changes.outputs.source == 'true'   # conditional logic stays in the caller
  uses: ./.github/workflows/reusable/lint-typecheck.yml
  with:
    node-version: '20'
    package-manager: 'npm'
```

A job that calls a reusable workflow (`uses:`) cannot also declare
`runs-on:` or `steps:` — it's either a "normal" job or a "caller" job, never
both. `needs.<job>.result` still works exactly the same way for caller jobs
as it does for normal ones, which is what `ci-summary` and `build`'s
`lint-and-typecheck` dependency rely on.

## Secrets

None of the current reusable workflows need secrets. When one does (e.g. a
future `deploy.yml` needing a Netlify token, or `validate-supabase.yml`
running real `supabase db lint` against a project ref), declare it
explicitly rather than blanket-inheriting:

```yaml
# in the reusable workflow
on:
  workflow_call:
    secrets:
      SUPABASE_ACCESS_TOKEN:
        required: true

# in ci.yml
validate-supabase:
  uses: ./.github/workflows/reusable/validate-supabase.yml
  secrets:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

Avoid `secrets: inherit` unless a workflow genuinely needs the whole secret
set — it silently widens what a reusable workflow can access.

## Extending this

- **New shared step** (e.g. a `format:check` step): add it to
  `reusable/lint-typecheck.yml` once, rather than editing multiple job
  definitions.
- **New job category** (e.g. Lighthouse/perf checks): add
  `reusable/lighthouse.yml` following the same `workflow_call` + inputs
  pattern, then add a corresponding `if:`-gated caller job in `ci.yml` and
  register it in `ci-summary`.
- **Different package manager per job**: every reusable workflow already
  accepts `package-manager`, so a job can pass `'bun'` without touching the
  reusable workflow file itself.
- **Real Supabase validation**: extend `reusable/validate-supabase.yml` with
  `supabase db lint` / `supabase functions deploy --dry-run`, wiring in
  `SUPABASE_ACCESS_TOKEN` via `secrets:` as shown above.
