/**
 * Shared helpers used by multiple providers.
 */

/** Strip the studio protocol prefix from an agent ref. */
export function refToId(ref: string): string {
  return ref.replace(/^studio:\/\/agents\//, '');
}

/** Delay that respects AbortSignal. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

/** Split text into chunks roughly sized like SSE fragments. */
export function chunkText(text: string, maxChunkWords: number = 8): string[] {
  const words = text.split(/(\s+)/);
  const chunks: string[] = [];
  let current = '';
  let wordCount = 0;

  for (const token of words) {
    current += token;
    if (/\S/.test(token)) wordCount++;
    if (wordCount >= maxChunkWords) {
      chunks.push(current);
      current = '';
      wordCount = 0;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
