import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONFERENCE_BRIEF } from '../../data/decisionFixtures';
import { deconstructRequirement } from '../deconstructEngine';
import { matchDecision } from '../decisionMatching';
import { buildLocalDecisionRequirement } from '../requirementInterview';

afterEach(() => vi.unstubAllGlobals());

describe('decision workflow recovery with the existing Worker client', () => {
  it('interviews and matches locally without calling a provider', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const result = await deconstructRequirement(CONFERENCE_BRIEF, 'local_rules');
    expect(result).toMatchObject({ ok: true, data: { engineUsed: 'local_semantic' } });
    expect(matchDecision(buildLocalDecisionRequirement(CONFERENCE_BRIEF)).status).toBe('matched');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows local retry after a malformed online response', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('invalid json', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const result = await deconstructRequirement(CONFERENCE_BRIEF, 'online_worker');
    expect(result.ok).toBe(false);
    expect(fetch).toHaveBeenCalledWith('/api/deconstruct', expect.objectContaining({ credentials: 'same-origin' }));
    const recovered = await deconstructRequirement(CONFERENCE_BRIEF, 'local_rules');
    expect(recovered).toMatchObject({ ok: true, data: { engineUsed: 'local_semantic' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('exposes an upstream timeout for the UI and leaves local matching available', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({
      ok: false, errorCode: 'UPSTREAM_TIMEOUT', message: '在线拆解超时，请重试或切换本地模式。',
    }, { status: 504 }));
    vi.stubGlobal('fetch', fetch);
    const result = await deconstructRequirement(CONFERENCE_BRIEF, 'online_worker');
    expect(result).toMatchObject({ ok: false, error: { errorCode: 'UPSTREAM_TIMEOUT' } });
    const recovered = await deconstructRequirement(CONFERENCE_BRIEF, 'local_rules');
    expect(recovered).toMatchObject({ ok: true, data: { engineUsed: 'local_semantic' } });
    expect(matchDecision(buildLocalDecisionRequirement(CONFERENCE_BRIEF)).status).toBe('matched');
  });
});
