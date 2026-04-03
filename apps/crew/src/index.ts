/**
 * modular-crew — Public API
 *
 * Two export surfaces:
 *   import { compileTeam, FactBus, ... } from 'modular-crew'       // full framework
 *   import { ContextRouter, ... } from 'modular-crew/context'      // standalone context engine
 */

// ── Types (re-export everything) ─────────────────────────────────────────────
export * from './types.js';

// ── Harness (from @modular/harness) ────────────────────────────────────────
export { FactBus, FactTimeoutError } from '@modular/harness';
export { InMemoryMailbox, SQLiteMailbox } from '@modular/harness';
export { BudgetGuard } from '@modular/harness';
export { TurnEventEmitter } from '@modular/harness';
export { PRESETS, resolvePreset, listPresets } from '@modular/harness';
export { runHooks } from '@modular/harness';
export { InProcessBackend } from '@modular/harness';
export type { MailboxStore, AgentMessage } from '@modular/harness';
export type { SwarmBackend, AgentRunConfig, AgentResult, AgentHandle } from '@modular/harness';
export type { HookDefinition, HooksConfig } from '@modular/harness';

// ── Worktree (from @modular/worktree) ──────────────────────────────────────
export { prepareAgentWorktree, cleanupWorktrees } from '@modular/worktree';

// ── Crew-specific components ──────────────────────────────────────────────
export { ContextRouter } from './context/router.js';
export { RunStore } from './store/run-store.js';

// ── Compiler ───────────────────────────────────────────────────────────────
export { compileTeam, buildAgentPrompt, extractFacts } from './compiler/inngest-compiler.js';
export { parseTeamFile, validateTeam, topoSort } from './compiler/team-parser.js';

// ── Studio Providers ──────────────────────────────────────────────────────
export { PatchbayProvider } from './studio/patchbay.js';
