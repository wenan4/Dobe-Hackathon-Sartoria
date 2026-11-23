import type { CandidateCombination, Constraint, Version } from '../types/decisions';
import type { RequirementInput } from '../types/sartoria';
import { PRESET_DEMO_CASES } from './presetDemos';

export const CONFERENCE_BRIEF: RequirementInput = {
  projectName: '秋季会务团装',
  clientName: '模拟会务团队',
  businessType: 'corporate_uniform',
  season: 'autumn',
  groupSize: '60 套',
  targetSceneId: 'scene-lujiazui-summit',
  rawNarrative: '60 套，室内正式，藏青，耐皱，可机洗，不像传统制服。',
};

export const CONFERENCE_FEEDBACK = '想要更亮，最好真丝；机洗和藏青不动';
export const CASE_SIX_BRIEF = PRESET_DEMO_CASES[0].input;

interface DecisionFixture {
  id: string;
  input: RequirementInput;
  constraints: Array<Pick<Constraint, 'field' | 'value' | 'quote'> & Partial<Pick<Constraint, 'level' | 'op'>>>;
  sampleCandidate: { patternId: string; fabricId: string; craftId: string; code: string; detail: string };
}

const fixtures: DecisionFixture[] = [
  {
    id: 'conference-demo',
    input: CONFERENCE_BRIEF,
    constraints: [
      { field: 'quantity', value: 60, quote: '60 套' },
      { field: 'scene', value: 'indoor_formal', quote: '室内正式' },
      { field: 'color', value: 'navy', quote: '藏青' },
      { field: 'wrinkleResistance', value: true, quote: '耐皱' },
      { field: 'care', value: 'machine_wash', quote: '可机洗' },
      { field: 'style', value: 'traditional_uniform', quote: '不像传统制服', op: 'neq', level: 'preference' },
    ],
    sampleCandidate: {
      patternId: 'pat-minimal-unstructured-blazer',
      fabricId: 'fab-demo-navy-washable-twill',
      craftId: 'crf-demo-washable-soft-seams',
      code: 'SFG-FB-205',
      detail: '合同联调样例 · 模拟可机洗斜纹，待实物洗样',
    },
  },
  {
    id: 'official-six-demo',
    input: CASE_SIX_BRIEF,
    constraints: [
      { field: 'category', value: 'jacket', quote: '想要定制一件外套' },
      { field: 'easeAllowance', value: 'arm_mobility', quote: '不卡手臂' },
      { field: 'color', value: null, quote: null, level: 'pending' },
    ],
    sampleCandidate: {
      patternId: 'pat-official-cross-collar-silk',
      fabricId: 'fab-official-silk-jacquard-subtle',
      craftId: 'crf-cross-collar-no-button',
      code: 'SFG-FB-006',
      detail: '合同联调样例 · 案例六企划参考，面料与色彩需人工核样',
    },
  },
];

// These examples exercise the contract independently of the parser and ranking engine.
export const DECISION_VERSION_FIXTURES: Version[] = fixtures.map(({ id, input, constraints, sampleCandidate }) => {
  const { patternId, fabricId, craftId, code, detail } = sampleCandidate;
  const createdAt = '2026-11-24T01:00:00+08:00';
  const turnId = `${id}:brief`;
  const candidate: CandidateCombination = {
    id: `${patternId}/${fabricId}/${craftId}`,
    status: 'eligible',
    config: {
      patternId, fabricId, craftIds: [craftId], sceneId: input.targetSceneId,
      activeView: 'scene_look', focusedHotspotId: null,
    },
    ruleScore: 0,
    evidence: [{
      constraintId: null, assetId: fabricId, assetCode: code, kind: 'fabric',
      field: 'reference', value: null, outcome: 'reference', detail,
      source: { kind: id === 'conference-demo' ? 'team_simulation' : 'official_case', reference: detail, simulated: true },
    }],
    decisionReasons: [detail],
    comparison: { style: '合同样例', comfort: '实物待核', fit: '量体待核', care: '米样待核' },
    referenceCaseIds: [],
  };
  return {
    id: `${id}:v1`, projectId: id, number: 1, parentVersionId: null, createdAt,
    requirement: {
      schemaVersion: 'sartoria_requirement_v1', mode: 'local_rules', input,
      turns: [{ id: turnId, text: input.rawNarrative }],
      constraints: constraints.map(({ field, op = 'eq', value, level = 'hard', quote }) => ({
        id: `${turnId}:${field}`, field, op, value, level, quote,
        state: quote === null ? 'unknown' : 'explicit',
        sourceTurnId: quote === null ? null : turnId,
        verifiedBy: null, reason: null,
      })),
      questions: [],
    },
    match: { status: 'matched', recommended: candidate, alternative: null, review: [], rejected: [] },
    candidate, proposal: null, promptPack: null, revision: null,
  };
});
