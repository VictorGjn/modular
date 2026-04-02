# modular

> Context engineering platform — Studio (visual IDE) + Crew (agent orchestration runtime).

## Architecture

```
modular/
├── apps/
│   ├── crew/       ← CLI + DAG engine for agent teams
│   └── studio/     ← Visual IDE for context engineering
├── packages/
│   ├── core/       ← Shared types, Zod schemas, interfaces
│   ├── providers/  ← LLM provider abstraction (Mock, Patchbay)
│   ├── worktree/   ← Git worktree isolation per agent
│   ├── context/    ← Context engineering primitives
│   ├── harness/    ← Agent execution runtime (FactBus, Mailbox, Hooks)
│   └── ui/         ← Shared React components + design tokens
```

## Packages

| Package | Description |
|---------|-------------|
| `@modular/core` | Shared TypeScript types with Zod validation: DepthLevel, ContextSpec, Fact, Agent types, Budget, TraceEvents |
| `@modular/providers` | StudioProvider interface + MockProvider. PatchbayProvider (HTTP client) stays in apps/crew |
| `@modular/worktree` | Git worktree manager — unified from crew + studio. Safe parallel agent work via isolated branches |
| `@modular/context` | Portable context primitives: SystemPromptBuilder, ReactiveCompaction, ContextCollapse, ToolUseSummary |
| `@modular/harness` | Agent execution core: FactBus, Mailbox, HookRunner, BudgetGuard, EventStream, Presets |
| `@modular/ui` | Shared design tokens and React components (stub — growing as crew UI develops) |

## Setup

```bash
bun install
bun run build
bun run test
```

## Development

```bash
# Build all packages
bun run build

# Type-check everything
bun run type-check

# Run tests
bun run test

# Dev mode (watch)
bun run dev
```

## Migration Status

- [x] Create monorepo scaffold with bun workspaces + turborepo
- [x] Extract @modular/core (types, Zod schemas)
- [x] Extract @modular/providers (StudioProvider, MockProvider)
- [x] Extract @modular/worktree (unified from crew + studio)
- [x] Extract @modular/context (SystemPromptBuilder, ReactiveCompaction, etc.)
- [ ] Extract @modular/harness (FactBus, Mailbox, Hooks — stubs created)
- [ ] Import crew into apps/crew
- [ ] Import studio into apps/studio
- [ ] Rewire imports to use workspace packages
- [ ] Set up @modular/ui with studio's design system
