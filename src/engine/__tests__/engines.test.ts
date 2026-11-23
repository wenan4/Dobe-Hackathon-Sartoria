import { describe, expect, it } from 'vitest';
import { PRESET_DEMO_CASES } from '../../data/presetDemos';
import { buildAssetCatalogCsv, buildLedgerCsv, buildPromptPackMarkdown } from '../../utils/exporters';
import { deconstructLocally } from '../deconstructEngine';
import { createSeedLedgerRecords } from '../ledgerStore';
import { evaluateFeasibility, evaluateMatch, recommendInitialConfig } from '../matchingEngine';
import { generateVisualPromptPack } from '../promptEngine';
import { generateProposalDraft } from '../proposalEngine';
import { resolveStageVisual } from '../visualResolver';

describe('Sartoria AI Core Engines (Official 4 Cases + Competition Suite)', () => {
  it('translates all 4 official cases and 2 competition cases into 8 official specs + 6 aesthetic dimensions', () => {
    expect(PRESET_DEMO_CASES).toHaveLength(6);
    for (const demo of PRESET_DEMO_CASES) {
      const result = deconstructLocally(demo.input);
      expect(result.officialSpecs).toHaveLength(8);
      expect(result.dimensions).toHaveLength(6);
      expect(result.emotionTags.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('dynamically parses spontaneous ergonomic free-text into accurate 8-field tailoring specs', () => {
    const customInput = {
      projectName: '自定义测试',
      clientName: '自由输入客户',
      businessType: 'private_couture' as const,
      season: 'autumn' as const,
      groupSize: '1 套',
      targetSceneId: 'scene-studio-minimal',
      rawNarrative: '想要一件低调内敛的中式外套，我脖子比较短而且有点溜肩，还有小肚腩，偏好香云纱面料。',
    };
    const res = deconstructLocally(customInput);
    const collarSpec = res.officialSpecs.find((s) => s.key === 'collar')?.value ?? '';
    const patternSpec = res.officialSpecs.find((s) => s.key === 'patternStructure')?.value ?? '';
    const fabricSpec = res.officialSpecs.find((s) => s.key === 'fabric')?.value ?? '';
    const easeSpec = res.officialSpecs.find((s) => s.key === 'easeAllowance')?.value ?? '';

    expect(collarSpec).toContain('3cm');
    expect(patternSpec).toContain('自然落肩');
    expect(fabricSpec).toContain('香云纱');
    expect(easeSpec).toContain('腹部');

    const recConfig = recommendInitialConfig(customInput, res);
    expect(recConfig.patternId).toBe('pat-official-xiangyun-dropped');
    expect(recConfig.fabricId).toBe('fab-official-xiangyun-matte');
  });

  it('matches Official Case 1 and Corporate Uniform with high suitability and resolves clean stage visuals', () => {
    const case1 = PRESET_DEMO_CASES[0];
    const deconstructed = deconstructLocally(case1.input);
    const config = recommendInitialConfig(case1.input, deconstructed);
    const match = evaluateMatch(case1.input, deconstructed, config);
    const visual = resolveStageVisual(config);

    expect(config.patternId).toBe('pat-official-h-low-collar');
    expect(config.fabricId).toBe('fab-official-acetate-jacquard');
    expect(match.overallScore).toBeGreaterThanOrEqual(90);
    expect(visual.heroImage).toBe('/assets/official1-studio-jacket.jpg');
    expect(visual.hotspots).toHaveLength(3);
  });

  it('triggers feasibility guardrails on summer heavy fabric and corporate uniform delicate silk', () => {
    const corporate = PRESET_DEMO_CASES.find((d) => d.id === 'demo-corporate-haipai-uniform')!;
    const summerHeavy = evaluateFeasibility(
      { ...corporate.input, season: 'summer' },
      { ...corporate.recommendedConfig, fabricId: 'fab-heavy-cashmere-obsidian' }
    );
    expect(summerHeavy.some((n) => n.id === 'feas-summer-heavy-gsm' && n.level === 'risk')).toBe(
      true
    );

    const silkUniform = evaluateFeasibility(corporate.input, {
      ...corporate.recommendedConfig,
      fabricId: 'fab-official-plum-song',
    });
    expect(silkUniform.some((n) => n.id === 'feas-uniform-delicate' && n.level === 'risk')).toBe(
      true
    );
    expect(silkUniform.some((n) => n.dimension === '人工边界')).toBe(true);
  });

  it('generates proposal with 8 official specs, compiles 3-tool visual prompt packs, and exports UTF-8 BOM CSV', () => {
    const stageCase = PRESET_DEMO_CASES.find((d) => d.id === 'official-case-3')!;
    const deconstructed = deconstructLocally(stageCase.input);
    const pack = generateVisualPromptPack(stageCase.input, deconstructed, stageCase.recommendedConfig);
    const feasibility = evaluateFeasibility(stageCase.input, stageCase.recommendedConfig);
    const proposal = generateProposalDraft(
      stageCase.input,
      deconstructed,
      stageCase.recommendedConfig,
      feasibility
    );

    expect(proposal.officialSpecs).toHaveLength(8);
    expect(pack.shots).toHaveLength(3);
    expect(pack.shots[0].prompts.midjourney).toContain('--v 6.1');
    expect(pack.shots[0].prompts.midjourney).not.toMatch(/[\u4e00-\u9fa5]/); // Pure idiomatic English MJ prompt!
    expect(pack.shots[2].prompts.jimeng_cn).toContain('户外音乐舞台');

    const md = buildPromptPackMarkdown(pack);
    expect(md).toContain('### Midjourney v6.1');

    const seeds = createSeedLedgerRecords();
    expect(seeds).toHaveLength(3);
    const ledgerCsv = buildLedgerCsv(seeds);
    expect(ledgerCsv.startsWith('\uFEFF')).toBe(true);
    expect(ledgerCsv).toContain('SFG-2026-001');

    const catalogCsv = buildAssetCatalogCsv();
    expect(catalogCsv).toContain('SFG-PT-101');
  });
});
