/**
 * Budget types and cost estimation shared across Crew and Studio.
 */

import { z } from 'zod';

export const Budget = z.object({
  maxTokens: z.number().positive().optional(),
  maxCost: z.number().positive().optional(),
  warnAt: z.number().min(0).max(1).optional(),
});
export type Budget = z.infer<typeof Budget>;

/** Model pricing (input/output per 1M tokens in USD). */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 1, output: 5 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'mock-model': { input: 0, output: 0 },
};

export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['claude-sonnet-4-20250514']!;
  return (tokensIn * pricing.input + tokensOut * pricing.output) / 1_000_000;
}
