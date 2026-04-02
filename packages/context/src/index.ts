/**
 * @modular/context — Portable context engineering primitives.
 * 
 * These are standalone modules extracted from modular-studio's
 * context engine. They have no dependency on the graph DB or
 * the studio server — they work with plain text and token budgets.
 */
export * from './SystemPromptBuilder.js';
export * from './ReactiveCompaction.js';
export * from './ContextCollapse.js';
export * from './ToolUseSummary.js';
// MemoryStore and AgentSearch will be added in subsequent PRs
