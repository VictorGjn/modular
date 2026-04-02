/**
 * Reactive Compaction — intelligent context compression under token pressure.
 * Monitors 5 signal types and compacts when budget threshold is hit.
 */

export type CompactionSignal =
  | 'token_pressure'
  | 'turn_count'
  | 'context_staleness'
  | 'repetition'
  | 'low_relevance';

export interface CompactionConfig {
  maxTokens: number;
  pressureThreshold: number;
  strategies: CompactionStrategy[];
}

export type CompactionStrategy = 'summarize' | 'drop_old' | 'reduce_depth' | 'merge_similar';

export interface CompactionResult {
  originalTokens: number;
  compactedTokens: number;
  strategiesApplied: CompactionStrategy[];
  droppedSections: string[];
}

export class ReactiveCompactor {
  private config: CompactionConfig;

  constructor(config: CompactionConfig) {
    this.config = config;
  }

  shouldCompact(currentTokens: number, signals: CompactionSignal[]): boolean {
    const utilization = currentTokens / this.config.maxTokens;
    if (utilization > this.config.pressureThreshold) return true;
    if (signals.includes('token_pressure')) return true;
    if (signals.length >= 3) return true;
    return false;
  }

  compact(sections: Array<{ id: string; content: string; tokens: number; priority: number }>,
    signals: CompactionSignal[]
  ): CompactionResult {
    const sorted = [...sections].sort((a, b) => a.priority - b.priority);
    const originalTokens = sorted.reduce((s, sec) => s + sec.tokens, 0);
    const target = Math.floor(this.config.maxTokens * this.config.pressureThreshold);
    const strategiesApplied: CompactionStrategy[] = [];
    const droppedSections: string[] = [];

    let currentTokens = originalTokens;

    // Strategy 1: Drop low-priority sections
    if (currentTokens > target && this.config.strategies.includes('drop_old')) {
      strategiesApplied.push('drop_old');
      for (const sec of sorted) {
        if (currentTokens <= target) break;
        if (sec.priority < 3) {
          currentTokens -= sec.tokens;
          droppedSections.push(sec.id);
        }
      }
    }

    // Strategy 2: Reduce depth on medium-priority sections
    if (currentTokens > target && this.config.strategies.includes('reduce_depth')) {
      strategiesApplied.push('reduce_depth');
      for (const sec of sorted) {
        if (currentTokens <= target) break;
        if (sec.priority >= 3 && sec.priority < 7) {
          const reduced = Math.floor(sec.tokens * 0.5);
          currentTokens -= (sec.tokens - reduced);
        }
      }
    }

    return { originalTokens, compactedTokens: currentTokens, strategiesApplied, droppedSections };
  }
}
