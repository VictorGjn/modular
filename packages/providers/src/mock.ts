/**
 * MockProvider — In-memory StudioProvider for --mock mode.
 * Returns canned responses with simulated latency.
 * Used for offline development, CI/CD, and demos.
 */

import type { ResolvedAgent, AgentRunEvent } from '@modular/core';
import type { DepthLevel } from '@modular/core';
import type { StudioProvider } from './interface.js';
import { refToId, delay, chunkText } from './helpers.js';

export interface MockProviderOptions {
  chunkDelay?: number;
  wordCount?: number;
  defaultModel?: string;
  emitFacts?: boolean;
}

const DEFAULTS: Required<MockProviderOptions> = {
  chunkDelay: 50,
  wordCount: 80,
  defaultModel: 'mock-model',
  emitFacts: true,
};

function generateMockOutput(agentName: string, input: string, wordCount: number): string {
  const summary = input.length > 120 ? input.slice(0, 120) + '…' : input;
  return [
    `## ${agentName} — Mock Output`,
    '', `**Task**: ${summary}`, '',
    `This is a simulated response from the mock provider.`,
    `In production, agent \`${agentName}\` would process the task through modular-patchbay with full context routing and depth-packed knowledge.`,
    '', '### Analysis', '',
    '1. The input was received and parsed successfully.',
    '2. Context sources would be resolved via the graph engine.',
    '3. The depth-packed context would be assembled per the context spec.',
    '', '### Recommendations', '',
    '- Proceed with the proposed approach.',
    '- Review the generated artifacts.',
    '',
    `*[Mock output — ${wordCount} words target | agent: ${agentName}]*`,
  ].join('\n');
}

export class MockProvider implements StudioProvider {
  private readonly opts: Required<MockProviderOptions>;

  public readonly calls = {
    resolveAgent: [] as Array<{ ref: string }>,
    executeAgent: [] as Array<{ agent: ResolvedAgent; input: string }>,
    packContext: [] as Array<{ sources: string[]; depth: DepthLevel; tokenBudget: number }>,
  };

  constructor(options: MockProviderOptions = {}) {
    this.opts = { ...DEFAULTS, ...options };
  }

  async resolveAgent(ref: string): Promise<ResolvedAgent> {
    this.calls.resolveAgent.push({ ref });
    const id = refToId(ref);
    return {
      id,
      name: id,
      systemPrompt: `You are ${id}. This is a mock agent.`,
      model: this.opts.defaultModel,
      maxTurns: 15,
    };
  }

  async *executeAgent(
    agent: ResolvedAgent,
    input: string,
    signal?: AbortSignal,
  ): AsyncGenerator<AgentRunEvent> {
    this.calls.executeAgent.push({ agent, input });
    const output = generateMockOutput(agent.name, input, this.opts.wordCount);
    const chunks = chunkText(output);

    for (const chunk of chunks) {
      if (signal?.aborted) break;
      await delay(this.opts.chunkDelay, signal);
      yield { type: 'text', text: chunk };
    }

    if (this.opts.emitFacts) {
      yield { type: 'fact', fact: {
        key: `${agent.name}_output`,
        value: output.slice(0, 200),
        source: agent.name,
        status: 'final',
        timestamp: Date.now(),
      } };
    }

    yield { type: 'done', usage: { tokensIn: 100, tokensOut: output.length / 4 } };
  }

  async packContext(
    sources: string[],
    depth: DepthLevel,
    tokenBudget: number,
  ): Promise<string> {
    this.calls.packContext.push({ sources, depth, tokenBudget });
    return `[Mock packed context: ${sources.length} sources at depth ${depth}, budget ${tokenBudget}]`;
  }
}
