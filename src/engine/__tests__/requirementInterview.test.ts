import { describe, expect, it } from 'vitest';
import { PRESET_DEMO_CASES } from '../../data/presetDemos';
import type { RequirementInput } from '../../types/sartoria';
import { buildLocalDecisionRequirement, extractRevisionConstraints } from '../requirementInterview';
import { parseRequirementResponse, parseRequirementResponseOrFallback } from '../requirementSchema';

const corporateContext: RequirementInput = {
  projectName: '秋季会务服', clientName: '项目联系人', businessType: 'corporate_uniform',
  season: 'autumn', groupSize: '', targetSceneId: 'scene-studio-minimal', rawNarrative: '',
};

const mainBrief = { ...corporateContext, rawNarrative: '60 套，室内正式，藏青，耐皱，可机洗，不像传统制服。' };

function makeModelResponse(input: RequirementInput) {
  const { schemaVersion, constraints, questions } = buildLocalDecisionRequirement(input);
  const unknown = { value: null, state: 'unknown', level: 'pending', sourceTurnId: null, quote: null, reason: '原话未提及' };
  const dimension = { ...unknown, score: null };
  return {
    schemaVersion, constraints, questions,
    dimensions: {
      styleTone: dimension, silhouetteReq: dimension, fabricTexture: dimension,
      craftDetail: dimension, colorSystem: dimension, sceneFit: dimension,
    },
    aestheticArchetype: unknown, emotionTags: [],
  };
}

describe('the offline requirement interview', () => {
  it('preserves the main corporate brief and the exclusion with a verbatim quote', () => {
    const requirements = buildLocalDecisionRequirement(mainBrief);
    expect(requirements.mode).toBe('local_rules');
    expect(requirements.questions).toEqual([]);
    expect(requirements.constraints.filter(({ level }) => level === 'hard')).toMatchObject([
      { field: 'quantity', value: 60, quote: '60 套' },
      { field: 'scene', value: 'indoor_formal', quote: '室内正式' },
      { field: 'color', value: 'navy', quote: '藏青' },
      { field: 'care', value: 'machine_wash', quote: '可机洗' },
      { field: 'wrinkleResistance', value: true, quote: '耐皱' },
      { field: 'style', value: 'traditional_uniform', quote: '不像传统制服', op: 'neq' },
    ]);
    expect(requirements.constraints.find(({ field }) => field === 'businessType')).toMatchObject({
      value: 'corporate_uniform', state: 'suggested', quote: null,
    });
  });

  it('reads only the requested preferences and leaves preserved hard fields alone', () => {
    const revision = extractRevisionConstraints({ id: 'r-1', text: '想要更亮，最好真丝；机洗和藏青不动' });
    expect(revision).toMatchObject([
      { field: 'fabric', value: 'silk', level: 'preference', sourceTurnId: 'r-1', quote: '最好真丝' },
      { field: 'luster', value: 'high', level: 'preference', sourceTurnId: 'r-1', quote: '想要更亮' },
    ]);
  });

  it('leaves mutually exclusive demands, ranges and withdrawals pending', () => {
    const text = '至少六十套，必须藏青，也不能用藏青，取消机洗';
    const revision = extractRevisionConstraints({ id: 'r-2', text });
    expect(revision).toMatchObject([
      { field: 'quantity', value: null, state: 'unknown', quote: '至少六十套' },
      { field: 'color', value: null, state: 'unknown', quote: text },
      { field: 'care', value: null, state: 'unknown', quote: '取消机洗' },
    ]);
    expect(buildLocalDecisionRequirement({ ...corporateContext, rawNarrative: text }).questions).toHaveLength(2);
    expect(extractRevisionConstraints({ id: 'r-3', text: '藏青改黑色，洗护改为只能干洗' })).toMatchObject([
      { field: 'color', value: 'obsidian', level: 'hard' },
      { field: 'care', value: 'dry_clean', level: 'hard' },
    ]);
  });

  it('keeps the official case references separate from explicit fit and item requirements', () => {
    const case6 = PRESET_DEMO_CASES.find(({ id }) => id === 'official-case-6')!;
    const { constraints } = buildLocalDecisionRequirement(case6.input);
    expect(constraints.find(({ field }) => field === 'category')).toMatchObject({ value: 'jacket', state: 'explicit' });
    expect(constraints.find(({ field }) => field === 'easeAllowance')).toMatchObject({ value: 'arm_mobility', state: 'explicit' });
    expect(constraints.find(({ field }) => field === 'fabric')).toMatchObject({ value: 'silk', state: 'suggested', quote: null });
    expect(constraints.find(({ field }) => field === 'collar')).toMatchObject({ value: 'cross_open', state: 'suggested', quote: null });
    expect(constraints.find(({ field }) => field === 'color')).toMatchObject({ value: null, state: 'unknown', quote: null });

    const case3 = PRESET_DEMO_CASES.find(({ id }) => id === 'official-case-3')!;
    const confirmed = buildLocalDecisionRequirement(case3.input).constraints;
    expect(confirmed.find(({ field }) => field === 'patternStructure')).toMatchObject({ value: 'two_piece', state: 'explicit' });
    expect(confirmed.find(({ field }) => field === 'easeAllowance')).toMatchObject({ value: 'arm_mobility', state: 'explicit' });
  });
});

describe('the strict requirement response boundary', () => {
  it('accepts a complete, versioned and semantically supported payload', () => {
    const response = makeModelResponse(mainBrief);
    expect(parseRequirementResponse(JSON.stringify(response), mainBrief)).toMatchObject({ ok: true, requirement: { mode: 'validated' } });
  });

  it('recovers from malformed JSON or a response outside the schema', () => {
    expect(parseRequirementResponseOrFallback('invalid', mainBrief)).toMatchObject({ ok: false, requirement: { mode: 'local_rules' } });
    for (const reply of [
      { ...makeModelResponse(mainBrief), inventory: [] },
      { ...makeModelResponse(mainBrief), schemaVersion: 'sartoria_requirement_v2' },
      { ...makeModelResponse(mainBrief), dimensions: {} },
    ]) {
      expect(parseRequirementResponse(reply, mainBrief)).toMatchObject({ ok: false });
    }
  });

  it('rejects invented evidence, reversed exclusions and model confirmations', () => {
    for (const patch of [
      { quote: '一定要传统制服', op: 'eq' }, { quote: '不像传统制服', op: 'eq' },
      { sourceTurnId: 'nonexistent' }, { value: 'casual' }, { level: 'preference' },
      { state: 'confirmed', verifiedBy: 'ghost' },
    ]) {
      const response = makeModelResponse(mainBrief);
      Object.assign(response.constraints.find(({ field }) => field === 'style')!, patch);
      expect(parseRequirementResponse(response, mainBrief)).toMatchObject({ ok: false });
    }
  });

  it('rejects a missing hard requirement or an invented suggested color', () => {
    const response = makeModelResponse(mainBrief);
    response.constraints = response.constraints.filter(({ field }) => field !== 'care');
    expect(parseRequirementResponse(response, mainBrief)).toMatchObject({ ok: false });

    const input = { ...corporateContext, rawNarrative: '可机洗' };
    const chosenColor = makeModelResponse(input);
    Object.assign(chosenColor.constraints.find(({ field }) => field === 'color')!, {
      state: 'suggested', level: 'preference', value: 'navy', reason: '设计建议',
    });
    expect(parseRequirementResponse(chosenColor, input)).toMatchObject({ ok: false });
  });
});
