# ULTRAPLAN — What's Next for Modular

**Date:** 2026-04-04
**Status:** Living document — updated as phases complete
**Scope:** Monorepo-wide (packages/\*, apps/crew, apps/studio)

---

## Where We Are

Modular is a **context engineering platform** with two apps:

- **Studio** (apps/studio) — Visual IDE for designing agents with context-aware knowledge, tools, memory, and qualification. 60K lines of TypeScript/React. v1.0.6 shipped with 916 unit tests + 62 E2E.
- **Crew** (apps/crew) — CLI + DAG engine for multi-agent teams with depth-routed context, fact bus, coordinator mode, and budget guards. ~5K lines of TypeScript.

Six shared packages extracted into the monorepo:

| Package | Lines | Status |
|---------|-------|--------|
| `@modular/core` | ~200 | Shared types, Zod schemas |
| `@modular/providers` | ~250 | StudioProvider interface + MockProvider |
| `@modular/worktree` | ~200 | Git worktree isolation |
| `@modular/context` | ~350 | SystemPromptBuilder, ReactiveCompaction, ContextCollapse, ToolUseSummary |
| `@modular/harness` | ~750 | FactBus, Mailbox, Hooks, BudgetGuard, EventStream, Presets |
| `@modular/ui` | ~50 | Stub — design tokens only |

### Known Gaps (from README migration checklist)

1. **Crew still uses local copies** — `crew/src/{facts,hooks,trace,orchestrator}` duplicates `packages/harness/src`. Imports say `workspace:*` but actual code paths use local files.
2. **@modular/ui has no consumers** — Studio's 44+ design system components (`ds/`) are not shared.
3. **No CI for the monorepo** — Studio has its own CI, but the root `turbo build && turbo test` has no GitHub Actions workflow.
4. **Type divergence** — `apps/crew/src/types.ts` (384 lines) re-declares schemas that should come from `@modular/core` (74 lines). The core package is anemic.

---

## The Plan: 5 Phases

### Phase 1 — Structural Integrity (Foundation)

_Finish the monorepo migration. Eliminate duplication. Make `turbo build && turbo test` green._

| # | Task | Why | Files |
|---|------|-----|-------|
| 1.1 | **Consolidate types into @modular/core** | crew/src/types.ts has 384 lines of Zod schemas that belong in core. Core currently only has 74 lines. Move `TeamDefinition`, `FlowStep`, `Budget`, `StepState`, `RunState`, `StudioProvider`, `ModelPricing` into core. Crew re-exports. | `packages/core/src/`, `apps/crew/src/types.ts` |
| 1.2 | **Deduplicate crew vs harness** | `crew/src/facts/fact-bus.ts` ≈ `packages/harness/src/fact-bus.ts`. Same for mailbox, hooks, events, presets, summarizer, background. Delete crew's local copies, rewire imports to `@modular/harness`. | `apps/crew/src/{facts,hooks,trace,background,presets}/`, `packages/harness/src/` |
| 1.3 | **Move PatchbayProvider to @modular/providers** | Currently in `crew/src/studio/patchbay.ts`. It's the real HTTP provider — belongs in the shared package alongside MockProvider. | `apps/crew/src/studio/patchbay.ts` → `packages/providers/src/patchbay.ts` |
| 1.4 | **Add monorepo CI workflow** | `.github/workflows/ci.yml`: `bun install → turbo build → turbo test → turbo type-check → turbo lint`. Matrix: Node 20 + 22. | `.github/workflows/ci.yml` |
| 1.5 | **Add `bun.lockb` or `bun.lock`** | No lockfile in repo. Builds are non-reproducible. | Root |

**Exit criterion:** `turbo build && turbo test && turbo type-check` passes. Zero local copies of shared code in crew.

---

### Phase 2 — Crew Runtime Completion (Make It Real)

_Crew has the architecture but gaps in execution. Close them._

| # | Task | Why | Files |
|---|------|-----|-------|
| 2.1 | **Real provider integration** | Crew only has Mock + Patchbay providers. Add `AnthropicProvider` (Claude API direct) and `OpenAIProvider` using their respective SDKs. No more dependency on Studio server for basic runs. | `packages/providers/src/{anthropic,openai}.ts` |
| 2.2 | **CLI polish** | `bin/crew.ts` needs: proper arg parsing (yargs/commander), colored output, `--verbose`/`--quiet` flags, `crew init` template scaffolding, `crew doctor` health checks. | `apps/crew/bin/crew.ts` |
| 2.3 | **SQLite run store** | `crew/src/store/run-store.ts` exists but needs: proper migrations, query by status/date, fact retrieval by run, export to JSON. | `apps/crew/src/store/` |
| 2.4 | **Ultraplan → Crew integration** | Ultraplan generates plans but they don't feed back into execution. Wire `crew plan` → `crew run --plan <id>` so plans become executable. | `apps/crew/src/orchestrator/ultraplan.ts`, `bin/crew.ts` |
| 2.5 | **Worktree integration** | `@modular/worktree` exists but crew doesn't use it. When `repo:` is specified in YAML, agents should get isolated git worktrees. | `apps/crew/src/compiler/inngest-compiler.ts`, `packages/worktree/` |
| 2.6 | **Resume/retry robustness** | `resume.ts` exists but E2E test coverage is thin. Add: resume after budget exceeded, resume after crash, retry with exponential backoff. | `apps/crew/src/orchestrator/resume.ts`, `apps/crew/tests/` |

**Exit criterion:** `crew run team.yaml --task "..." ` works end-to-end with Claude API (no Studio server required). Plans are executable. Runs persist and can resume.

---

### Phase 3 — Studio Completion (Ship v1.1)

_Close the open items from PLAN-REMAINING.md and ROADMAP-V3.md Phase A/B._

| # | Task | Why | Source |
|---|------|-----|--------|
| 3.1 | **Context Graph UI** | Force-directed graph visualization in Knowledge tab. Backend done, UI pending. Visual wow factor for demos. | ROADMAP-V3 A4 |
| 3.2 | **Code-Aware Tree Indexer** | Current indexer only parses markdown headings. Need TypeScript/Python AST extraction for symbol-level retrieval. Biggest value-add for code-focused agents. | PLAN-REMAINING I1, ROADMAP-V3 B4 |
| 3.3 | **Dual-Agent Qualification Loop** | Agent Testeur + Agent Correcteur in auto-fix loop. No competitor has this. Samuel Neveu pattern. | ROADMAP-V3 B1 |
| 3.4 | **Context Ablation Testing** | A/B test knowledge sources: "removing source X drops quality by 12%". Novel capability. | ROADMAP-V3 B2 |
| 3.5 | **Layer Progression Indicator** | Boris Cherny's dependency graph as UX. Gamifies agent maturity: "You're at Layer 2 — unlock Layer 3 by adding tools." | ROADMAP-V3 B3 |
| 3.6 | **Export to CLI formats** | Generate `.claude/CLAUDE.md`, `.cursorrules`, `crew team.yaml` directly from the wizard. Bridges design-time → runtime. | ROADMAP-V3 B5 |
| 3.7 | **Blocking UX fixes** | Move FactInsights to ReviewTab (B1), depth slider labels (B2), per-source config UX (B3). | PLAN-REMAINING B1-B3 |

**Exit criterion:** Studio v1.1 with context graph, code-aware indexing, and export-to-CLI. Qualification loop works end-to-end with real LLM.

---

### Phase 4 — @modular/ui + Design System (Unify the Frontend)

_Extract Studio's mature design system into the shared package. Prepare for crew's future UI._

| # | Task | Why |
|---|------|-----|
| 4.1 | **Extract ds/ components to @modular/ui** | Studio has 44+ components in `src/components/ds/` (Button, Modal, Card, Input, Select, Tabs, Toast, Tooltip, etc.). Extract to `packages/ui/` with proper exports. |
| 4.2 | **Design tokens as CSS variables** | `packages/ui/src/tokens.ts` is a stub. Populate with Studio's actual theme (colors, spacing, typography, shadows) as CSS custom properties. |
| 4.3 | **Storybook setup** | Add Storybook to `packages/ui/` for visual component documentation. Wire into `turbo dev`. |
| 4.4 | **Studio consumes @modular/ui** | Rewire Studio's imports from `../ds/Button` to `@modular/ui`. Verify no regressions. |

**Exit criterion:** `@modular/ui` is a publishable, documented component library. Studio uses it as a dependency.

---

### Phase 5 — Enterprise & Distribution (ROADMAP-V3 Phase C/D)

_Make it installable, deployable, and sellable._

| # | Task | Why | Source |
|---|------|-----|--------|
| 5.1 | **Auth + multi-tenant** | "It's not a toy." Basic JWT auth, workspace isolation, API keys. | ROADMAP-V3 C1 |
| 5.2 | **Usage analytics dashboard** | Track agents created, generations run, exports made, token spend. Backend exists, needs UI. | ROADMAP-V3 C2 |
| 5.3 | **OpenAPI documentation** | Auto-generate from Studio's Express routes. Makes integration trivial. | ROADMAP-V3 C3 |
| 5.4 | **npm publish pipeline** | `npm i -g modular-studio` and `npm i -g modular-crew`. Turborepo `publish` task with changesets. | ROADMAP-V3 C5 |
| 5.5 | **Helm chart** | Docker already exists. Add Helm for K8s deployment. | ROADMAP-V3 C4 |
| 5.6 | **Landing page + case study** | Marketing site. Syroco dogfooding story. "Context engineering > prompt engineering" positioning. | ROADMAP-V3 D1-D3 |
| 5.7 | **Product Hunt launch** | Stars + awareness + inbound interest from target buyers. | ROADMAP-V3 D4 |

**Exit criterion:** `npm install -g modular-studio && modular-studio` works. Auth enabled. Helm deployable. Public landing page live.

---

## Cross-Cutting Concerns (All Phases)

| Concern | Action |
|---------|--------|
| **Testing** | Every new feature ships with unit tests. Crew target: 80%+ coverage. Studio: maintain 916+ unit, 62+ E2E. |
| **Type safety** | All packages use TypeScript strict. No `any` escape hatches. Zod schemas are the source of truth. |
| **Bundle size** | Studio already code-splits. Monitor via `turbo build` output. Target: <500KB gzipped for initial load. |
| **Documentation** | Each package gets a focused README. Root README stays high-level. No separate docs site until Phase 5. |
| **Backward compat** | YAML `version: 1` schema is frozen. New features use `version: 2` with migration. |

---

## Dependency Graph

```
Phase 1 (Foundation)
    ├──→ Phase 2 (Crew Runtime)
    │        └──→ Phase 5 (Enterprise)
    ├──→ Phase 3 (Studio v1.1)
    │        └──→ Phase 5 (Enterprise)
    └──→ Phase 4 (Design System)
             └──→ Phase 5 (Enterprise)
```

Phases 2, 3, and 4 can run **in parallel** once Phase 1 is done.
Phase 5 depends on all three.

---

## Priority Stack (What to Build First)

If time is limited, this is the ranked order of highest-impact items across all phases:

1. **1.1 + 1.2** — Consolidate types + deduplicate crew/harness (unlocks everything)
2. **2.1** — Real provider integration for crew (makes crew usable without Studio)
3. **3.2** — Code-aware tree indexer (biggest competitive differentiator for Studio)
4. **3.1** — Context graph UI (demo wow factor)
5. **1.4** — Monorepo CI (prevents regressions)
6. **3.6** — Export to CLI (bridges Studio → Crew → real usage)
7. **2.2** — CLI polish (makes crew feel professional)
8. **3.3** — Dual-agent qualification loop (novel, defensible)
9. **4.1** — Extract design system (long-term velocity)
10. **5.4** — npm publish (distribution)

---

*"Context engineering > prompt engineering" — this plan makes that real, from foundation to distribution.*
