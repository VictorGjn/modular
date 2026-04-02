/**
 * Agent-related types shared between Crew and Studio.
 */

import { z } from 'zod';
import { DepthLevel } from './depth.js';
import type { ContextSpec, Fact } from './types.js';

// ── Agent Definition ─────────────

export const InlineAgent = z.object({
  model: z.string().optional(),
  system: z.string(),
  tools: z.array(z.string()).optional(),
  maxTurns: z.number().positive().optional(),
  maxOutputTokens: z.number().positive().optional(),
  tokenBudget: z.number().positive().optional(),
  preset: z.string().optional(),
  is_coordinator: z.boolean().optional(),
  repo: z.string().optional(),
  base_ref: z.string().optional(),
});
export type InlineAgent = z.infer<typeof InlineAgent>;

export const AgentRef = z.union([
  z.string(),
  InlineAgent,
]);
export type AgentRef = z.infer<typeof AgentRef>;

// ── Resolved Agent (runtime) ─────

export interface ResolvedAgent {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  tools?: string[];
  maxTurns?: number;
  maxOutputTokens?: number;
}

// ── Agent Run Events ─────────────

export type AgentRunEventType = 'text' | 'tool_call' | 'fact' | 'error' | 'done';

export interface AgentRunEvent {
  type: AgentRunEventType;
  text?: string;
  toolName?: string;
  toolInput?: unknown;
  fact?: Fact;
  error?: string;
  usage?: { tokensIn: number; tokensOut: number; costUsd?: number };
}

// ── Agent Run Config & Result ────

export interface AgentRunConfig {
  agentId: string;
  systemPrompt: string;
  model: string;
  maxTurns: number;
  input: string;
  tools?: string[];
}

export interface AgentRunResult {
  agentId: string;
  output: string;
  status: 'completed' | 'failed' | 'killed' | 'max_turns' | 'error';
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  error?: string;
  facts?: Fact[];
}
