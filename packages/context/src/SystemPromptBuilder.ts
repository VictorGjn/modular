/**
 * System Prompt Builder — static/dynamic boundary pattern.
 * Extracted from Claude Code's architecture: the system prompt is
 * split into a static prefix (cacheable) and a dynamic suffix
 * (changes per turn). This reduces API costs significantly.
 */

export interface SystemPromptSection {
  id: string;
  content: string;
  priority: number;
  isStatic: boolean;
}

export interface BuiltPrompt {
  staticPrefix: string;
  dynamicSuffix: string;
  full: string;
  tokenEstimate: number;
}

const BOUNDARY_MARKER = '\n\n<!-- __DYNAMIC_BOUNDARY__ -->\n\n';

export class SystemPromptBuilder {
  private sections: SystemPromptSection[] = [];

  addSection(section: SystemPromptSection): this {
    this.sections.push(section);
    return this;
  }

  build(): BuiltPrompt {
    const sorted = [...this.sections].sort((a, b) => b.priority - a.priority);
    const staticParts = sorted.filter(s => s.isStatic).map(s => s.content);
    const dynamicParts = sorted.filter(s => !s.isStatic).map(s => s.content);

    const staticPrefix = staticParts.join('\n\n');
    const dynamicSuffix = dynamicParts.join('\n\n');
    const full = staticPrefix + BOUNDARY_MARKER + dynamicSuffix;

    return {
      staticPrefix,
      dynamicSuffix,
      full,
      tokenEstimate: Math.ceil(full.length / 4),
    };
  }

  clear(): this {
    this.sections = [];
    return this;
  }
}
