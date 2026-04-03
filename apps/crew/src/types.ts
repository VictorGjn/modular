/**
 * modular-crew — Core Type Definitions
 *
 * Shared types come from @modular/core (single source of truth).
 * Crew-specific types (TeamDefinition, FlowStep, StepState, etc.) live here.
 */

import { z } from 'zod';
import type { HookDefinition } from '@modular/harness';

// ── Re-export shared types from @modular/core ────────────────────────────────
// These are the single source of truth, shared with Studio.
export type { Fact, FactStatus, TraceEvent, TraceEventType } from '@modular/core';
export { DepthLevel, DEPTH_TOKEN_RATIOS } from '@modular/core';
export { ContextSpec } from '@modular/core';
export { StructuredCondition, Condition } from '@modular/core';
export { InlineAgent, AgentRef } from '@modular/core';
export type { ResolvedAgent, AgentRunEvent } from '@modular/core';
export { Budget, estimateCost } from '@modular/core';

// Re-export provider interface
export type { StudioProvider } from '@modular/providers';

// ── Hook Definition Schema (for TeamDefinition) ──────────────────────────────

const HookDefinitionSchema = z.object({
  name: z.string(),
  run: z.string(),
  on_fail: z.enum(['abort', 'continue']).optional(),
  timeout: z.number().optional(),
});

// ── Background Task Definition Schema ────────────────────────────────────────

const BackgroundTaskSchema = z.object({
  name: z.string(),
  trigger: z.string(),
  min_interval: z.number(),
  role: z.string(),
  phases: z.array(z.string()),
});

// ── Flow Steps (crew-specific) ───────────────────────────────────────────────

export const ParallelBranch = z.object({
  agent: AgentRef,
  requires: z.array(z.string()).optional(),
  context: ContextSpec.optional(),
  publishes: z.array(z.string()).optional(),
  role: z.string().optional(),
});
export type ParallelBranch = z.infer<typeof ParallelBranch>;

export const FlowStep = z.object({
  // Single agent step
  agent: AgentRef.optional(),
  role: z.string().optional(),

  // Parallel step (mutually exclusive with agent)
  parallel: z.record(z.string(), ParallelBranch).optional(),

  // Dependencies
  after: z.union([z.string(), z.array(z.string())]).optional(),
  requires: z.array(z.string()).optional(),
  publishes: z.array(z.string()).optional(),

  // Context routing
  context: ContextSpec.optional(),

  // Conditions and loops
  when: Condition.optional(),
  retry: z.object({
    step: z.string(),
    maxAttempts: z.number().positive().default(2),
    onMaxAttempts: z.enum(['fail', 'proceed', 'human']).default('fail'),
  }).optional(),

  // Human-in-the-loop
  approval: z.boolean().default(false),
  approval_message: z.string().optional(),
  approval_timeout: z.number().positive().optional(),
  ci_auto_approve: z.boolean().optional(),

  // Timeouts
  timeout: z.number().positive().optional(),
});
export type FlowStep = z.infer<typeof FlowStep>;

// ── Team Definition (the root YAML schema) ─────────────────────────────────

export const TeamDefinition = z.object({
  $schema: z.string().optional(),
  version: z.literal(1).default(1),
  name: z.string(),
  description: z.string().optional(),

  // Execution mode
  mode: z.enum(['dag', 'coordinator']).optional(),

  // Coordinator config
  coordinator: z.object({
    scratchpad: z.boolean().optional(),
    max_workers: z.number().optional(),
    max_rounds: z.number().optional(),
  }).optional(),

  // Lifecycle hooks
  hooks: z.object({
    before_run: z.array(HookDefinitionSchema).optional(),
    after_run: z.array(HookDefinitionSchema).optional(),
    before_step: z.array(HookDefinitionSchema).optional(),
    after_step: z.array(HookDefinitionSchema).optional(),
  }).optional(),

  // Background tasks
  background: z.record(z.string(), BackgroundTaskSchema).optional(),

  // Studio connection
  studio: z.object({
    url: z.string().url(),
    apiVersion: z.string().default('v1'),
  }).optional(),

  // Defaults
  defaults: z.object({
    provider: z.string().default('anthropic'),
    model: z.string().default('claude-sonnet-4-20250514'),
    maxTurns: z.number().positive().default(15),
    tokenBudget: z.number().positive().default(50000),
    maxOutputTokens: z.number().positive().default(4000),
    stepTimeout: z.number().positive().default(300000),
  }).optional(),

  // Budget controls
  budget: Budget.optional(),

  // Coordinator-mode agents
  agents: z.record(z.string(), z.object({
    role: z.string(),
    is_coordinator: z.boolean().optional(),
    system: z.string().optional(),
    model: z.string().optional(),
    preset: z.string().optional(),
    repo: z.string().optional(),
    base_ref: z.string().optional(),
  })).optional(),

  // The flow
  flow: z.record(z.string(), FlowStep).default({}),
});
export type TeamDefinition = z.infer<typeof TeamDefinition>;

// ── Step Execution States (FSM, crew-specific) ──────────────────────────────

export const StepState = z.enum([
  'pending',
  'ready',
  'running',
  'succeeded',
  'failed',
  'retrying',
  'cancelled',
  'timed_out',
  'skipped',
  'waiting_human',
]);
export type StepState = z.infer<typeof StepState>;

export interface StepResult {
  stepId: string;
  agentId?: string;
  state: StepState;
  attempt: number;
  output?: string;
  facts: import('@modular/core').Fact[];
  error?: string;
  startedAt?: number;
  completedAt?: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  durationMs?: number;
  contextTokens?: number;
}

// ── Run State (crew-specific) ────────────────────────────────────────────────

export const RunStatus = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'budget_exceeded',
]);
export type RunStatus = z.infer<typeof RunStatus>;

export interface RunState {
  id: string;
  teamFile: string;
  teamName: string;
  task: string;
  status: RunStatus;
  steps: Map<string, StepResult>;
  facts: import('@modular/core').Fact[];
  startedAt: number;
  completedAt?: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  loopCounts: Map<string, number>;
  error?: string;
}

// ── Model Pricing (crew-specific, may diverge from core) ────────────────────

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-sonnet-4-20250514': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-4-20250514': { inputPerMillion: 0.80, outputPerMillion: 4 },
  'claude-opus-4-20250514': { inputPerMillion: 15, outputPerMillion: 75 },
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4.1': { inputPerMillion: 2, outputPerMillion: 8 },
  'gpt-4.1-mini': { inputPerMillion: 0.4, outputPerMillion: 1.6 },
};
