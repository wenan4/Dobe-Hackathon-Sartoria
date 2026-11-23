import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONFERENCE_BRIEF } from '../../data/decisionFixtures';
import type { LlmSettings } from '../../types/sartoria';
import { deconstructRequirement } from '../deconstructEngine';

const testSettings: LlmSettings = {
  enabled: true,
  baseUrl: 'https://provider.invalid/v1',
  apiKey: 'mock-fixture',
  model: 'mock-model',
};

afterEach(() => vi.unstubAllGlobals());

describe('optional legacy response fallback', () => {
  it('runs without a credential and does not call a provider', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const result = await deconstructRequirement(CONFERENCE_BRIEF, { ...testSettings, apiKey: '' });
    expect(result.engineUsed).toBe('local_semantic');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns a usable local result for an invalid response body', async () => {
    const invalid = JSON.stringify({ officialSpecs: Array.from({ length: 8 }, () => null) });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: invalid } }] })));
    const result = await deconstructRequirement(CONFERENCE_BRIEF, testSettings);
    expect(result.engineUsed).toBe('local_semantic');
    expect(result.officialSpecs).toHaveLength(8);
  });

  it('recovers after a pending request reaches its deadline', async () => {
    const abort = new AbortController();
    vi.stubGlobal('fetch', (_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true });
    }));
    const pending = deconstructRequirement(CONFERENCE_BRIEF, testSettings, abort.signal);
    abort.abort(new DOMException('Timed out', 'TimeoutError'));
    const result = await pending;
    expect(result.engineUsed).toBe('local_semantic');
    expect(result.dimensions).toHaveLength(6);
  });
});
