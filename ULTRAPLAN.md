# ULTRAPLAN v2 — What's Next for Modular

**Date:** 2026-04-04  
**Version:** 2.0 (post-ultrareview from 6 perspectives: Backend, Frontend, UI/UX, Design Systems, CPO, VC)  
**Scope:** Monorepo-wide (packages/\*, apps/crew, apps/studio)

---

## Where We Are

Modular is a **context engineering platform** with two apps:

- **Crew** (apps/crew) — CLI + DAG engine for multi-agent teams with depth-routed context. ~5K LoC. **Primary adoption wedge.**
- **Studio** (apps/studio) — Visual IDE for agent design. 60K LoC, v1.0.6, 916 unit + 62 E2E tests. **Enterprise upgrade path.**

Six shared packages: `@modular/core` (types), `@modular/providers` (LLM abstraction), `@modular/worktree` (git isolation), `@modular/context` (compaction/collapse), `@modular/harness` (FactBus/Mailbox/Hooks/Budget), `@modular/ui` (stub).

### Known Gaps

1. **Crew duplicates harness** — `crew/src/{facts,hooks,trace}` are near-copies of `packages/harness/src`
2. **Type divergence** — `Fact` has different fields in core vs crew; `FactStatus` has 2 vs 3 values
3. **No monorepo CI** — cross-package changes have no automated verification
4. **No lockfile** — non-reproducible builds
5. **No users** — zero external adoption, no npm publish, no landing page
6. **Token color mismatch** — `@modular/ui` uses `#6366f1`, Studio ds/ uses `#FE5000`
7. **Ultraplan cost bug** — hardcoded `tt*.000003` ignores existing `MODEL_PRICING` table

---

## v1 → v2 Changes (What the Reviews Changed)

| v1 | v2 | Why |
|----|-----|-----|
| Phase 1-4 engineering, Phase 5 distribution | New Phase 0: Ship + distribute first | CPO + VC: "No users = building in a vacuum" |
| CI at priority #5 | CI at priority #2 | Backend + Frontend: "Cross-package changes without CI is reckless" |
| Design system extraction in Phase 4 (after features) | Token foundation before Phase 3 features | Frontend + Design Systems: "Building on local imports then rewiring is guaranteed pain" |
| No accessibility mention | Accessibility as cross-cutting concern | Design + UI/UX: "Enterprise blocker, WCAG showstopper" |
| 44+ component extraction | ~20 extractable primitives (realistic scope) | Design Systems: "4 are store-coupled, 7 are app-specific" |
| Layer Progression as gamification | Reframed as "Configuration Coverage" | UI/UX: "'Unlock Layer 3' is patronizing to senior engineers" |
| Context Graph: 2 days | Context Graph: Tier 1 demo (2d) + Tier 2 production (5d) | UI/UX: "2 days gets you a demo, not a feature" |
| No error taxonomy | Added typed error hierarchy | Backend: "Without this, retry logic is guesswork" |
| No concurrency model | FactBus mutex for coordinator mode | Backend: "Two workers can publish conflicting facts simultaneously" |
| Studio + Crew as equals | Crew-first strategy | CPO + VC: "Pick one wedge. Crew is simpler, npm-installable, proves the thesis" |

---

## The Plan: 7 Phases

### Phase 0 — Ship & Distribute (WEEK 1-2)

_Get Crew into developers' hands. Prove the thesis with real users._

| # | Task | Why |
|---|------|-----|
| 0.1 | **`crew run --demo` zero-config experience** | Bundled team.yaml + mock mode + beautiful terminal output. Time-to-wow under 2 minutes. |
| 0.2 | **npm publish `modular-crew`** | `npm i -g modular-crew && crew run --demo` must work. Changesets + publish pipeline. |
| 0.3 | **Landing page** | One page: problem, 90-second demo video, `npm install` command. Deploy to Vercel. |
| 0.4 | **Opt-in anonymous telemetry** | Commands run, team sizes, error rates. Know what breaks and what gets used. |
| 0.5 | **10 design partners** | Outreach to dev tool builders. Weekly check-ins. Their feedback drives Phase 2+. |

**Activation metric:** % of installers who complete a successful `crew run` within 24 hours.  
**Exit criterion:** Crew published on npm, landing page live, 10 design partners onboarded.

---

### Phase 1 — Structural Integrity (WEEK 2-3)

_Finish the monorepo migration. Eliminate duplication. CI green._

| # | Task | Why |
|---|------|-----|
| 1.1 | **Monorepo CI workflow** | `bun install → turbo build → turbo test → turbo type-check`. Must land before any cross-package changes. |
| 1.2 | **Add lockfile** | `bun.lock` for reproducible builds. |
| 1.3 | **Reconcile types into @modular/core** | Decide: core's `Fact` (with `confidence`, `epistemicType`, 3 statuses) wins. Crew re-exports. Move `TeamDefinition`, `FlowStep`, `Budget`, `StepState`, `RunState`, `StudioProvider`, `ModelPricing` into core. |
| 1.4 | **Deduplicate crew vs harness** | Delete `crew/src/{facts,hooks,trace,background,presets}/`, rewire to `@modular/harness`. |
| 1.5 | **Move PatchbayProvider to @modular/providers** | From `crew/src/studio/patchbay.ts` to shared package. |
| 1.6 | **Fix ultraplan cost estimation** | Replace `tt*.000003` with `estimateCost()` from `MODEL_PRICING`. One-line fix. |
| 1.7 | **Add typed error hierarchy** | `packages/core/src/errors.ts`: `RetryableError`, `FatalError`, `BudgetExceededError`. Required before retry logic. |
| 1.8 | **SQLite migration system** | Add `schema_version` table + `migrate()` to `run-store.ts`. Schema changes without this = data loss. |

**Exit criterion:** `turbo build && turbo test && turbo type-check` green. Zero local copies of shared code in crew.

---

### Phase 2 — Crew Runtime (WEEK 3-5)

_Make Crew work end-to-end with real LLM providers._

| # | Task | Why |
|---|------|-----|
| 2.1 | **AnthropicProvider + OpenAIProvider** | Direct Claude/OpenAI API. No Studio server dependency. |
| 2.2 | **CLI polish** | Arg parsing (yargs), colored output, `crew init`, `crew doctor`, `--verbose`/`--quiet`. |
| 2.3 | **Ultraplan → execution** | `crew plan` → `crew run --plan <id>`. Plans become executable. |
| 2.4 | **FactBus concurrency guard** | Mutex/queue for concurrent publish in coordinator mode. |
| 2.5 | **Resume/retry with error taxonomy** | Use typed errors from 1.7. Retry on `RetryableError`, abort on `FatalError`. Exponential backoff. |
| 2.6 | **Worktree integration** | Wire `@modular/worktree` into crew when `repo:` is specified. |
| 2.7 | **Export from Studio → Crew** | Generate `crew team.yaml`, `.claude/CLAUDE.md`, `.cursorrules` from Studio wizard. Bridges the two products. |

**Exit criterion:** `crew run team.yaml --task "..."` works with Claude API. Plans executable. Runs persist and resume.

---

### Phase 3 — Design Foundations (WEEK 3-4, parallel with Phase 2)

_Fix the token system and extract primitives BEFORE building new Studio features._

| # | Task | Why |
|---|------|-----|
| 3.1 | **Reconcile token colors** | `@modular/ui` stub (`#6366f1`) vs Studio theme.ts (`#FE5000`). Studio's 66 semantic tokens are the source of truth. |
| 3.2 | **Build ThemeProvider context** | Replace `useTheme()` Zustand store coupling with React context in `@modular/ui`. Every ds/ component depends on this. |
| 3.3 | **Extract ~20 clean primitives** | Badge, Chip, Divider, Spinner, StatusDot, SkeletonLoader, Progress, EmptyState, Card, Avatar, Tooltip, Section, Button, Input, TextArea, Select, Toggle, Tabs, Modal, IconButton. Add render tests per component. |
| 3.4 | **Fix a11y basics during extraction** | `htmlFor`/`id` binding on Input labels, `:focus-visible` on Button (currently uses hover-only JS), ARIA patterns on interactive components. |
| 3.5 | **Leave app-specific components in Studio** | Toast (store-coupled), ProviderOnboarding, FeatureFlagsSettings, GenerateBtn, FloatingRunButton, AutoImproveButton, RefineButton. |

**Exit criterion:** `@modular/ui` has 20 primitives with ThemeProvider, render tests, and basic a11y. Studio imports from `@modular/ui`.

---

### Phase 4 — Studio v1.1 Features (WEEK 5-8)

_Build differentiating features on the new shared foundation._

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 4.1 | **Code-Aware Tree Indexer** | 3-5 days | TS/Python AST extraction. Biggest competitive differentiator. |
| 4.2 | **Context Graph UI — Tier 1 (demo)** | 2 days | Static layout with click-to-inspect. Consolidate graph libs (pick `@xyflow/react` OR `react-force-graph-2d`, not both). |
| 4.3 | **Context Graph UI — Tier 2 (production)** | +5 days | Force-directed with filtering, accessible list-view fallback, 100+ node performance caps. |
| 4.4 | **Dual-Agent Qualification Loop** | 3-5 days | Agent Testeur + Agent Correcteur. Novel, defensible. |
| 4.5 | **Context Ablation Testing** | 3-4 days | A/B test knowledge sources with quality delta measurement. |
| 4.6 | **Configuration Coverage indicator** | 2 days | Dependency-graph checklist (NOT gamification). "Your agent covers layers 0-2; tools unlock layer 3." |
| 4.7 | **Blocking UX fixes** | 1-2 days | FactInsights → ReviewTab, depth slider labels, per-source config UX. |
| 4.8 | **Dynamic-import heavy deps** | 1 day | `React.lazy()` for mermaid (2MB+), graph libs. Wrap in Suspense + ErrorBoundary. |

**Exit criterion:** Studio v1.1 with code-aware indexing, context graph, qualification loop. Bundle <500KB initial load.

---

### Phase 5 — Observability & Robustness (WEEK 6-8, parallel with Phase 4)

_Production-readiness for both products._

| # | Task | Why |
|---|------|-----|
| 5.1 | **Structured logging** | OpenTelemetry-compatible trace export for crew runs. |
| 5.2 | **Health endpoints** | `/health` and `/ready` for Studio server. `crew doctor` enhanced. |
| 5.3 | **Zustand store audit** | Audit 28 stores for selector granularity. Add lint rule preventing `useStore()` without selectors. |
| 5.4 | **Error boundary strategy** | Wrap graph/visualization features so crashes don't take down the IDE. |
| 5.5 | **Storybook + visual regression** | For `@modular/ui`. Chromatic or Percy baseline. |
| 5.6 | **Component state documentation** | Loading, empty, error, disabled states for all new Phase 4 components. |

---

### Phase 6 — Enterprise & Growth (MONTH 2-3)

_Only after Crew has users and Studio has features._

| # | Task | Why |
|---|------|-----|
| 6.1 | **Auth + multi-tenant** | JWT, workspace isolation, API keys. Required for enterprise pilots. |
| 6.2 | **Usage analytics dashboard** | Backend exists, wire UI. Track agents, generations, exports, spend. |
| 6.3 | **OpenAPI docs** | Auto-generate from Express routes. |
| 6.4 | **npm publish Studio** | `npm i -g modular-studio && modular-studio`. |
| 6.5 | **Helm chart** | K8s deployment (Docker already exists). |
| 6.6 | **Product Hunt launch** | Stars + inbound. |
| 6.7 | **Case study** | Syroco dogfooding story + design partner testimonials. |
| 6.8 | **Revised exit thesis** | Target realistic acquirers: Anthropic (agent context for Claude Code), Sourcegraph (code intelligence), JetBrains (IDE). Not OSS projects with no M&A budget. |

---

## Cross-Cutting Concerns (All Phases)

| Concern | Action |
|---------|--------|
| **Testing** | Every feature ships with tests. Crew: 80%+ coverage. Studio: maintain 916+ unit, 62+ E2E. |
| **Type safety** | TypeScript strict. No `any`. Zod schemas as source of truth. |
| **Accessibility** | WCAG AA minimum. `aria-label`, `role`, focus management on all interactive components. Color contrast audit before Phase 4. |
| **Bundle size** | Target <500KB gzipped initial load. Dynamic-import mermaid, graph libs. Audit with `vite-bundle-visualizer`. |
| **Backward compat** | YAML `version: 1` frozen. New features in `version: 2` with migration. |
| **Feedback loops** | Telemetry (opt-in), design partner check-ins, GitHub Discussions for community. |
| **Documentation** | Each package gets README. Component states documented. No separate docs site until Phase 6. |

---

## Dependency Graph

```
Phase 0 (Ship Crew)
    │
Phase 1 (Foundation + CI)
    ├──→ Phase 2 (Crew Runtime)  ──→ Phase 6
    ├──→ Phase 3 (Design Foundations) ──→ Phase 4 (Studio v1.1) ──→ Phase 6
    └──→ Phase 5 (Observability) ──→ Phase 6
```

Phase 0 → 1 is sequential. Phases 2, 3, 5 run in parallel after Phase 1. Phase 4 depends on Phase 3. Phase 6 depends on all.

---

## Priority Stack (If Time Is Limited)

| # | Task | Impact |
|---|------|--------|
| 1 | **npm publish Crew + demo mode** (0.1, 0.2) | Users can try it in 2 minutes |
| 2 | **Monorepo CI** (1.1) | Safety net for everything else |
| 3 | **Reconcile types + dedup** (1.3, 1.4) | Unlocks cross-package work |
| 4 | **Real providers** (2.1) | Crew works without Studio |
| 5 | **Landing page** (0.3) | Distribution |
| 6 | **Export Studio → Crew** (2.7) | Bridges both products |
| 7 | **Code-aware tree indexer** (4.1) | Biggest differentiator |
| 8 | **ThemeProvider + primitive extraction** (3.2, 3.3) | Foundation for Studio features |
| 9 | **Dual-agent qualification** (4.4) | Novel, defensible |
| 10 | **Context Graph Tier 1** (4.2) | Demo wow factor |

---

## Moat Reality Check (from VC Review)

| Claimed IP | Defensibility | Verdict |
|------------|--------------|---------|
| Tree-aware retrieval | Hard to replicate (2+ months) | **Real moat** |
| Dual-agent qualification loop | Novel pattern, non-trivial | **Real moat** |
| Knowledge Type System | Good design, replicable in 2-4 weeks | Moderate |
| Depth Mixer | Good design, replicable in 2-4 weeks | Moderate |
| Metaprompt V2 | Prompt chain | Weak |
| Auto-lessons | Feedback loop | Weak |
| Cost intelligence | If/else on model selection | Weak |
| 14 native connectors | Integration work | Weak |

**Focus investment on the two real moats.** Everything else is table stakes.

---

## Key Metrics to Track

| Metric | Target (90 days) |
|--------|-----------------|
| npm installs (Crew) | 500+ |
| GitHub stars | 200+ |
| Successful `crew run` completions | 100+ |
| Design partners with weekly usage | 10 |
| Token savings validated (3-5x claim) | 3 case studies |
| Studio v1.1 shipped | Yes |

---

*"Context engineering > prompt engineering" — but only if someone can install it.*

**Reviewed by:** Backend, Frontend, UI/UX, Design Systems, CPO, VC  
**v2 changes:** Distribution-first sequencing, realistic scope, accessibility, error taxonomy, Crew-led strategy, honest moat assessment.
