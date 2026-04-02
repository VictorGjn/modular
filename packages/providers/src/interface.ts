/**
 * StudioProvider — the contract between Crew/Studio and any LLM backend.
 * Both MockProvider and PatchbayProvider implement this.
 */

import type { ResolvedAgent, AgentRunEvent, ContextSpec } from '@modular/core';
import type { DepthLevel } from '@modular/core';

export interface StudioProvider {
  /** Resolve an agent ref to a fully-hydrated ResolvedAgent. */
  resolveAgent(ref: string): Promise<ResolvedAgent>;

  /** Execute an agent with streaming events. */
  executeAgent(
    agent: ResolvedAgent,
    input: string,
    signal?: AbortSignal,
  ): AsyncIterable<AgentRunEvent>;

  /** Pack context from sources at a given depth. */
  packContext(
    sources: string[],
    depth: DepthLevel,
    tokenBudget: number,
  ): Promise<string>;
}
