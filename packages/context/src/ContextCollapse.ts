/**
 * Context Collapse — 4 strategies for reducing context when over budget.
 * 1. Truncate: cut from the end
 * 2. Summarize: replace with summary
 * 3. Elide: keep headers + first lines
 * 4. Prune: remove entire sections by priority
 */

export type CollapseStrategy = 'truncate' | 'summarize' | 'elide' | 'prune';

export interface CollapseOptions {
  strategy: CollapseStrategy;
  targetTokens: number;
  preserveHeaders?: boolean;
}

export function collapseContext(
  content: string,
  currentTokens: number,
  options: CollapseOptions,
): string {
  if (currentTokens <= options.targetTokens) return content;

  const ratio = options.targetTokens / currentTokens;

  switch (options.strategy) {
    case 'truncate': {
      const targetChars = Math.floor(content.length * ratio);
      return content.slice(0, targetChars) + '\n\n... [truncated to fit token budget]';
    }
    case 'elide': {
      const lines = content.split('\n');
      const kept: string[] = [];
      let tokens = 0;
      const targetTokens = options.targetTokens;
      for (const line of lines) {
        const lineTokens = Math.ceil(line.length / 4);
        if (line.startsWith('#') || line.startsWith('##') || tokens < targetTokens * 0.8) {
          kept.push(line);
          tokens += lineTokens;
        } else if (tokens >= targetTokens) {
          kept.push('... [elided]');
          break;
        }
      }
      return kept.join('\n');
    }
    case 'prune':
    case 'summarize':
    default:
      // Fallback to truncate for now — summarize requires LLM call
      const targetChars = Math.floor(content.length * ratio);
      return content.slice(0, targetChars) + '\n\n... [collapsed]';
  }
}
