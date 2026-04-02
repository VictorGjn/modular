/**
 * Tool Use Summary — groups tool calls and generates concise summaries.
 * Reduces context window consumption from verbose tool outputs.
 */

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output: string;
  durationMs?: number;
}

export interface ToolGroup {
  toolName: string;
  count: number;
  summary: string;
  totalDurationMs: number;
}

/** Group tool calls by name and produce concise summaries. */
export function summarizeToolUse(calls: ToolCall[]): ToolGroup[] {
  const groups = new Map<string, ToolCall[]>();
  for (const call of calls) {
    const group = groups.get(call.name) ?? [];
    group.push(call);
    groups.set(call.name, group);
  }

  return [...groups.entries()].map(([name, calls]) => ({
    toolName: name,
    count: calls.length,
    summary: calls.length === 1
      ? `${name}: ${calls[0].output.slice(0, 100)}`
      : `${name} (x${calls.length}): ${calls.map(c => c.output.slice(0, 50)).join('; ')}`,
    totalDurationMs: calls.reduce((s, c) => s + (c.durationMs ?? 0), 0),
  }));
}

/** Format tool groups as compact markdown for context injection. */
export function formatToolSummary(groups: ToolGroup[]): string {
  if (groups.length === 0) return '';
  const lines = groups.map(g =>
    `- **${g.toolName}** (x${g.count}, ${g.totalDurationMs}ms): ${g.summary.slice(0, 150)}`
  );
  return `### Tool Usage Summary\n${lines.join('\n')}`;
}
