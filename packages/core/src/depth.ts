/**
 * Depth Level System — the 5-level context packing system.
 * Shared across crew and studio.
 */

import { z } from 'zod';

export const DepthLevel = z.enum(['full', 'detail', 'summary', 'headlines', 'mention']);
export type DepthLevel = z.infer<typeof DepthLevel>;

/** Token ratios per depth — used for cost estimation and budget allocation. */
export const DEPTH_TOKEN_RATIOS: Record<DepthLevel, number> = {
  full: 1.0,
  detail: 0.75,
  summary: 0.5,
  headlines: 0.25,
  mention: 0.1,
};

/** Knowledge types for the context engineering pipeline. */
export const KnowledgeType = z.enum([
  'ground_truth', 'signal', 'evidence', 'framework', 'hypothesis', 'guideline',
]);
export type KnowledgeType = z.infer<typeof KnowledgeType>;
