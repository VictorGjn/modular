/**
 * Core types shared between Crew and Studio.
 * Zod schemas are the source of truth (runtime validation + TS types).
 */

import { z } from 'zod';
import { DepthLevel } from './depth.js';

// ── Context Spec ─────────────────

export const ContextSpec = z.object({
  depth: DepthLevel.default('detail'),
  sources: z.array(z.string()).optional(),
  tokenBudget: z.number().positive().optional(),
  adaptiveRetrieval: z.boolean().default(false),
  traversal: z.object({
    followImports: z.boolean().default(true),
    followTests: z.boolean().default(false),
    followDocs: z.boolean().default(true),
  }).optional(),
});
export type ContextSpec = z.infer<typeof ContextSpec>;

// ── Fact ──────────────────────────

export type FactStatus = 'provisional' | 'final' | 'superseded';

export interface Fact {
  key: string;
  value: string;
  source: string;
  status: FactStatus;
  tags?: string[];
  timestamp: number;
  supersedes?: string;
  confidence?: number;
  epistemicType?: string;
}

// ── Trace Events ────────────────

export type TraceEventType =
  | 'run.start' | 'run.end'
  | 'step.start' | 'step.end'
  | 'context.pack' | 'context.resolve'
  | 'fact.publish' | 'fact.require'
  | 'approval.request' | 'approval.response';

export interface TraceEvent {
  timestamp: number;
  runId: string;
  stepId?: string;
  agentId?: string;
  type: TraceEventType;
  data?: Record<string, unknown>;
}

// ── Conditions ──────────────────

export const StructuredCondition = z.object({
  fact: z.string(),
  equals: z.string().optional(),
  not: z.string().optional(),
  gt: z.number().optional(),
  lt: z.number().optional(),
  contains: z.string().optional(),
});

export const Condition = z.union([
  z.string(),
  StructuredCondition,
]);
export type Condition = z.infer<typeof Condition>;
