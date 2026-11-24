import { describe, expect, it } from 'vitest';
import { DECISION_CASE_REFERENCES, DECISION_CATALOG } from '../../data/decisionCatalog';
import { PRESET_DEMO_CASES } from '../../data/presetDemos';
import { SCENES } from '../../data/scenes';
import { REQUIREMENT_SCHEMA_VERSION } from '../../types/decisions';
import type { Constraint, DecisionRequirement } from '../../types/decisions';
import { buildAssetCatalogCsv } from '../../utils/exporters';
import { evaluateDecisionConfiguration, matchDecision } from '../decisionMatching';
import { buildLocalDecisionRequirement } from '../requirementInterview';

const uniformBrief = '60 套团体职业服，秋季室内正式活动，藏青色，要耐皱、可机洗，不像传统制服。';

function constraint(
  field: Constraint['field'], value: Constraint['value'],
  level: Constraint['level'] = 'hard', op: Constraint['op'] = 'eq',
): Constraint {
  return {
    id: field, field, op, value, level, state: 'confirmed',
    sourceTurnId: 'customer', quote: uniformBrief, verifiedBy: '业务员', reason: null,
  };
}

const uniformRequirements: DecisionRequirement = {
  schemaVersion: REQUIREMENT_SCHEMA_VERSION,
  mode: 'local_rules',
  input: {
    projectName: '秋季会务', clientName: '测试客户', businessType: 'corporate_uniform', season: 'autumn',
    groupSize: '60 套', targetSceneId: 'scene-lujiazui-summit', rawNarrative: uniformBrief,
  },
  turns: [{ id: 'customer', text: uniformBrief }],
  constraints: [
    constraint('businessType', 'corporate_uniform'), constraint('quantity', 60),
    constraint('scene', 'indoor_formal'), constraint('season', 'autumn'), constraint('color', 'navy'),
    constraint('wrinkleResistance', true), constraint('care', 'machine_wash'),
    constraint('style', 'traditional_uniform', 'hard', 'neq'),
  ],
  questions: [],
};

function updated(...changes: Constraint[]): DecisionRequirement {
  const fields = new Set(changes.map(({ field }) => field));
  return { ...uniformRequirements, constraints: [
    ...uniformRequirements.constraints.filter(({ field }) => !fields.has(field)), ...changes,
  ] };
}

describe('Static catalog decision matching', () => {
  it('uses a bounded four-part catalog with unique IDs and traceable simulation sources', () => {
    const groups = Object.values(DECISION_CATALOG);
    const assets = groups.flat();
    expect(groups.map((records) => records.length)).toEqual([9, 13, 11, 3]);
    expect(new Set(assets.map(({ asset }) => asset.id)).size).toBe(36);
    expect(new Set(assets.map(({ asset }) => asset.code)).size).toBe(36);
    for (const { source } of assets) {
      expect(source.simulated).toBe(true);
      expect(source.reference).toBeTruthy();
    }
    const csv = buildAssetCatalogCsv();
    expect(csv.split('\n')).toHaveLength(37);
    expect(csv).toContain('官方案例参考');
    expect(csv).toContain('团队合成属性');
    expect(csv).toContain('https://www.ginetex.net/article/GB/care-symbols');
    expect(csv).toContain('fab-shikumen-stone-gray');
    expect(csv).toContain('case-hist-004');
    expect(csv).not.toContain('case-hist-005');
    const activeReferences = new Set(DECISION_CATALOG.cases.map(({ asset }) => asset.id));
    for (const { asset } of DECISION_CASE_REFERENCES) {
      expect(SCENES.some((scene) => scene.id === asset.sceneId)).toBe(true);
      expect(DECISION_CATALOG.patterns.some((pattern) => pattern.asset.id === asset.patternId)).toBe(true);
      expect(DECISION_CATALOG.fabrics.some((fabric) => fabric.asset.id === asset.fabricId)).toBe(true);
      expect(asset.craftIds.every((id) => DECISION_CATALOG.crafts.some((craft) => craft.asset.id === id))).toBe(true);
      const config = {
        patternId: asset.patternId, fabricId: asset.fabricId, craftIds: asset.craftIds, sceneId: asset.sceneId,
        activeView: 'scene_look' as const, focusedHotspotId: null,
      };
      const candidate = evaluateDecisionConfiguration({ ...uniformRequirements, constraints: [] }, config);
      expect(candidate.status).toBe('eligible');
      expect(candidate.referenceCaseIds.every((id) => activeReferences.has(id))).toBe(true);
      expect(candidate.evidence.filter(({ kind }) => kind === 'case').every(({ assetId }) => activeReferences.has(assetId))).toBe(true);
    }
  });

  it('shows two materially distinct qualified options, a care review, and a wash violation', () => {
    const result = matchDecision(uniformRequirements);
    expect(result.status).toBe('matched');
    expect(result.recommended?.config.fabricId).toBe('fab-demo-navy-washable-twill');
    expect(result.alternative?.config.fabricId).toBe('fab-demo-navy-lustrous-blend');
    expect(result.recommended?.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ constraintId: 'style', field: 'style', outcome: 'satisfies', value: 'modern' }),
      expect.objectContaining({ constraintId: 'care', assetCode: 'SFG-FB-211', outcome: 'satisfies', value: 'machine_wash' }),
      expect.objectContaining({ constraintId: 'care', assetCode: 'SFG-CR-211', outcome: 'satisfies', value: 'machine_wash' }),
    ]));
    expect(result.review[0].config.fabricId).toBe('fab-demo-navy-silk-satin');
    expect(result.review[0].evidence).toContainEqual(expect.objectContaining({
      constraintId: 'care', assetCode: 'SFG-FB-213', outcome: 'unknown', value: null,
    }));
    expect(result.rejected[0].evidence).toContainEqual(expect.objectContaining({
      constraintId: 'care', assetCode: 'SFG-FB-201', outcome: 'conflict', value: 'dry_clean',
    }));
  });

  it('re-ranks flexible silk and brighter finish preferences after hard requirements pass', () => {
    const requirement = updated(constraint('luster', 'high', 'preference'), constraint('fabric', 'silk', 'preference'));
    const local = matchDecision(requirement);
    expect(local.recommended?.config.fabricId).toBe('fab-demo-navy-lustrous-blend');
    expect(local.recommended?.config.craftIds).toEqual(['crf-demo-washable-satin-seams']);
    expect(local.recommended?.evidence).toContainEqual(expect.objectContaining({
      constraintId: 'fabric', value: 'blend', outcome: 'conflict',
    }));
    expect(matchDecision({ ...requirement, mode: 'validated' })).toEqual(local);
  });

  it('returns no match when silk and machine wash are mandatory and reruns if care is edited', () => {
    const conflict = matchDecision(updated(constraint('fabric', 'silk')));
    expect(conflict).toMatchObject({ status: 'no_match', recommended: null, alternative: null });
    expect(conflict.review.map(({ config }) => config.fabricId)).toContain('fab-demo-navy-silk-satin');
    expect(conflict.rejected[0].evidence).toContainEqual(expect.objectContaining({
      constraintId: 'fabric', outcome: 'conflict',
    }));

    const changed = matchDecision(updated(constraint('care', 'dry_clean')));
    expect(changed.recommended?.config.fabricId).toBe('fab-bund-navy-wool130');
    expect(changed.rejected[0].evidence).toContainEqual(expect.objectContaining({
      constraintId: 'care', value: 'machine_wash', outcome: 'conflict',
    }));
  });

  it('applies the same compatibility and missing-source rules to manual choices', () => {
    const result = matchDecision(uniformRequirements);
    const config = result.recommended!.config;
    const wrongCraft = evaluateDecisionConfiguration(uniformRequirements, {
      ...config, craftIds: ['crf-demo-washable-satin-seams'],
    });
    expect(wrongCraft.status).toBe('rejected');
    expect(wrongCraft.evidence).toContainEqual(expect.objectContaining({
      field: 'craftCompatibility', outcome: 'conflict', assetCode: 'SFG-CR-212',
    }));
    const componentUnknown = evaluateDecisionConfiguration(uniformRequirements, { ...config, craftIds: [] });
    expect(componentUnknown.status).toBe('needs_review');
    expect(componentUnknown.evidence).toContainEqual(expect.objectContaining({
      constraintId: 'care', kind: 'pattern', outcome: 'unknown',
    }));
    expect(evaluateDecisionConfiguration(uniformRequirements, { ...config, fabricId: 'fabric-outside-catalog' }).status)
      .toBe('rejected');
    expect(evaluateDecisionConfiguration(uniformRequirements, { ...config, fabricId: 'fab-heavy-cashmere-obsidian' }).status)
      .toBe('needs_review');
  });

  it('admits the documented heritage blends without guessing their wash care', () => {
    const requirement = { ...uniformRequirements, constraints: [
      constraint('businessType', 'corporate_uniform'), constraint('quantity', 45),
      constraint('scene', 'indoor_formal'), constraint('fabric', 'blend'),
    ] };
    for (const [color, fabricId] of [['pine_green', 'fab-shanghai-pine-green'], ['stone_gray', 'fab-shikumen-stone-gray']]) {
      const colored = { ...requirement, constraints: [...requirement.constraints, constraint('color', color)] };
      expect(matchDecision(colored).recommended?.config.fabricId).toBe(fabricId);
      const requiringCare = matchDecision({ ...colored, constraints: [...colored.constraints, constraint('care', 'dry_clean')] });
      expect(requiringCare.status).toBe('no_match');
      expect(requiringCare.review.find(({ config }) => config.fabricId === fabricId)?.evidence).toContainEqual(
        expect.objectContaining({ assetId: fabricId, field: 'care', value: null, outcome: 'unknown' }),
      );
    }
  });

  it('uses a concrete lapel option with concealed closure and rejects it for a stand-only order', () => {
    const requirement = { ...uniformRequirements, constraints: [
      constraint('businessType', 'corporate_uniform'), constraint('quantity', 42),
      constraint('scene', 'indoor_formal'), constraint('color', 'stone_gray'),
      constraint('closure', 'no_visible_buttons'), constraint('collar', 'stand', 'hard', 'neq'),
    ] };
    const lapel = matchDecision(requirement).recommended;
    expect(lapel?.config.patternId).toBe('pat-haipai-suit-ensemble-lapel');
    const pattern = DECISION_CATALOG.patterns.find(({ asset }) => asset.id === lapel?.config.patternId);
    expect(pattern?.asset.blueprintConfig).toMatchObject({ collarStyle: 'notch_lapel', closureStyle: 'hidden_placket' });
    const stand = { ...requirement, constraints: [...requirement.constraints.slice(0, -1), constraint('collar', 'stand')] };
    expect(matchDecision(stand).recommended?.config.patternId).toBe('pat-haipai-suit-ensemble');
    expect(evaluateDecisionConfiguration(stand, lapel!.config).status).toBe('rejected');
  });

  it('does not turn official design suggestions or an unspecified color into hard requirements', () => {
    const demo = PRESET_DEMO_CASES[0];
    const result = matchDecision({
      ...uniformRequirements, input: demo.input,
      constraints: [constraint('category', 'jacket'), constraint('easeAllowance', 'arm_mobility'),
        constraint('style', 'new_chinese', 'preference'), constraint('collar', 'cross_open', 'preference'),
        constraint('color', null, 'pending'), constraint('care', null, 'pending')],
    });
    expect(result.recommended?.config).toEqual(demo.recommendedConfig);
    expect(result.recommended?.referenceCaseIds).toContain('case-hist-006');
    expect(result.recommended?.evidence).toContainEqual(expect.objectContaining({
      assetId: 'case-hist-006', outcome: 'reference',
    }));
    expect(result.recommended?.evidence.some(({ field }) => field === 'color')).toBe(false);
  });

  it('keeps the two-piece stage outfit and fit direction as compatible decisions', () => {
    const demo = PRESET_DEMO_CASES[1];
    const requirement: DecisionRequirement = {
      ...uniformRequirements, input: demo.input,
      constraints: [constraint('category', 'two_piece'), constraint('easeAllowance', 'arm_mobility'),
        constraint('scene', 'outdoor_stage')],
    };
    expect(matchDecision(requirement).recommended?.config).toEqual(demo.recommendedConfig);
    const indoor = matchDecision({ ...requirement, constraints: [
      constraint('category', 'two_piece'), constraint('scene', 'indoor_performance'),
    ] });
    expect(indoor.recommended?.config.sceneId).toBe('scene-jingan-salon');
  });

  it('consumes unmodified local interview results from the main free-text flow and the two official briefs', () => {
    const brief = buildLocalDecisionRequirement({
      ...uniformRequirements.input,
      businessType: 'private_couture',
      targetSceneId: 'scene-studio-minimal',
    });
    const main = matchDecision(brief);
    expect(main.recommended?.config.fabricId).toBe('fab-demo-navy-washable-twill');
    expect(main.alternative?.config.fabricId).toBe('fab-demo-navy-lustrous-blend');
    for (const demo of PRESET_DEMO_CASES.slice(0, 2)) {
      const interpreted = buildLocalDecisionRequirement(demo.input);
      expect(matchDecision(interpreted).recommended?.config).toEqual(demo.recommendedConfig);
    }
  });
});
