import { HISTORICAL_CASES } from '../data/cases';
import { CRAFTS } from '../data/crafts';
import { FABRICS } from '../data/fabrics';
import { PATTERNS } from '../data/patterns';
import { PRESET_DEMO_CASES } from '../data/presetDemos';
import { SCENES } from '../data/scenes';
import type {
  ConfigurationState,
  DeconstructedRequirement,
  FeasibilityNotice,
  MatchExplanation,
  RequirementInput,
} from '../types/sartoria';

export function recommendInitialConfig(
  input: RequirementInput,
  _deconstructed: DeconstructedRequirement
): ConfigurationState {
  if (input.presetDemoId) {
    const preset = PRESET_DEMO_CASES.find((p) => p.id === input.presetDemoId);
    if (preset && preset.input.rawNarrative === input.rawNarrative) {
      return {
        ...preset.recommendedConfig,
        sceneId: input.targetSceneId || preset.recommendedConfig.sceneId,
      };
    }
  }

  const text = `${input.projectName} ${input.rawNarrative}`.toLowerCase();
  const isUniform = input.businessType === 'corporate_uniform';

  // Smart semantic pattern selection covering all 4 official archetypes + uniform + evening gown
  let patternId = isUniform ? 'pat-haipai-suit-ensemble' : 'pat-official-h-low-collar';
  let fabricId = isUniform ? 'fab-bund-navy-wool130' : 'fab-official-acetate-jacquard';
  let craftIds: string[] = isUniform
    ? ['crf-full-canvas-guiba', 'crf-hidden-mandarin-placket', 'crf-milanese-cuff-label']
    : ['crf-low-collar-ergo', 'crf-hidden-mandarin-placket'];
  let sceneId = input.targetSceneId || (isUniform ? 'scene-lujiazui-summit' : 'scene-studio-minimal');

  if (!isUniform) {
    if (text.includes('演出') || text.includes('演奏') || text.includes('舞台') || text.includes('两件')) {
      patternId = 'pat-official-stage-twopiece';
      fabricId = 'fab-official-ivory-rose-stage';
      craftIds = ['crf-contrast-piping-cuff', 'crf-haipai-pipa-button'];
      sceneId = 'scene-outdoor-stage';
    } else if (text.includes('香云纱') || text.includes('溜肩')) {
      patternId = 'pat-official-xiangyun-dropped';
      fabricId = 'fab-official-xiangyun-matte';
      craftIds = ['crf-low-collar-ergo', 'crf-hidden-mandarin-placket'];
      sceneId = input.targetSceneId || 'scene-studio-minimal';
    } else if (text.includes('梅花') || text.includes('青果') || text.includes('脖子细') || text.includes('内搭')) {
      patternId = 'pat-official-shawl-plum';
      fabricId = 'fab-official-plum-song';
      craftIds = ['crf-plum-starlight-motif'];
      sceneId = input.targetSceneId || 'scene-jingan-salon';
    } else if (text.includes('晚礼服') || text.includes('礼服') || text.includes('晚宴')) {
      patternId = 'pat-haipai-gown-column';
      fabricId = text.includes('月白')
        ? 'fab-suzhou-moonlight-white'
        : text.includes('丝绒') || text.includes('绯红')
          ? 'fab-xiangyun-crimson-velvet'
          : 'fab-song-obsidian-gold';
      craftIds = ['crf-haipai-pipa-button', 'crf-suzhou-magnolia-embroidery'];
      sceneId = input.targetSceneId || 'scene-bund-banquet';
    }
  } else {
    if (text.includes('暖灰')) fabricId = 'fab-shikumen-stone-gray';
    else if (text.includes('松墨绿') || text.includes('墨绿')) fabricId = 'fab-shanghai-pine-green';
  }

  return {
    patternId,
    fabricId,
    craftIds,
    sceneId,
    activeView: 'scene_look',
    focusedHotspotId: null,
  };
}

export function evaluateMatch(
  input: RequirementInput,
  _deconstructed: DeconstructedRequirement,
  config: ConfigurationState
): MatchExplanation {
  const pattern = PATTERNS.find((p) => p.id === config.patternId) ?? PATTERNS[0];
  const fabric = FABRICS.find((f) => f.id === config.fabricId) ?? FABRICS[0];
  const scene = SCENES.find((s) => s.id === config.sceneId) ?? SCENES[0];
  const crafts = CRAFTS.filter((c) => config.craftIds.includes(c.id));

  let patternScore = 80;
  if (pattern.businessType === input.businessType) patternScore += 12;
  if (pattern.suitableScenes.includes(scene.id)) patternScore += 5;
  if (pattern.seasonFit.includes(input.season) || pattern.seasonFit.includes('all_season')) {
    patternScore += 1;
  }
  patternScore = Math.min(98, patternScore);

  let fabricScore = 78;
  if (fabric.suitableBusiness.includes(input.businessType)) fabricScore += 11;
  if (fabric.suitableScenes.includes(scene.id)) fabricScore += 5;
  if (fabric.seasons.includes(input.season) || fabric.seasons.includes('all_season')) {
    fabricScore += 4;
  } else {
    fabricScore -= 8;
  }
  if (input.businessType === 'corporate_uniform' && fabric.isDelicateForUniform) {
    fabricScore -= 16;
  }
  fabricScore = Math.max(58, Math.min(98, fabricScore));

  let craftScore = crafts.length === 0 ? 78 : 86;
  let incompatibleCount = 0;
  for (const craft of crafts) {
    if (craft.compatibleFabrics.includes(fabric.weave)) {
      craftScore += 4;
    } else {
      incompatibleCount += 1;
      craftScore -= 10;
    }
  }
  craftScore = Math.max(56, Math.min(98, craftScore));

  let sceneScore = 82;
  if (scene.suitableBusiness.includes(input.businessType)) sceneScore += 8;
  if (scene.recommendedColorFamilies.includes(fabric.colorFamily)) sceneScore += 7;
  sceneScore = Math.min(98, sceneScore);

  const overallScore = Math.round(
    patternScore * 0.28 + fabricScore * 0.28 + craftScore * 0.22 + sceneScore * 0.22
  );

  const reasons: MatchExplanation['reasons'] = [
    {
      category: '版型适配',
      title: pattern.name,
      detail: `${pattern.silhouette}；${pattern.easeAllowance}`,
      score: patternScore,
    },
    {
      category: '面料适配',
      title: `${fabric.name}（${fabric.gsm}g/m²）`,
      detail: `${fabric.composition} · ${fabric.drape} · ${fabric.luster}`,
      score: fabricScore,
    },
    {
      category: '工艺组合',
      title: crafts.length > 0 ? crafts.map((c) => c.shortName).join(' + ') : '净面极简精工',
      detail:
        incompatibleCount > 0
          ? `存在 ${incompatibleCount} 项工艺与「${fabric.weave}」需版师复核兼容性。`
          : '所选工艺与面料织法及体态诉求规范兼容。',
      score: craftScore,
    },
    {
      category: '场景契合',
      title: `${scene.name} · ${scene.lighting.colorTempLabel}`,
      detail: scene.backdropHint,
      score: sceneScore,
    },
  ];

  const similarCaseIds = HISTORICAL_CASES.map((hc) => {
    let sim = 0;
    if (hc.businessType === input.businessType) sim += 35;
    if (hc.patternId === pattern.id) sim += 30;
    if (hc.fabricId === fabric.id) sim += 25;
    if (hc.sceneId === scene.id) sim += 15;
    return { id: hc.id, sim };
  })
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 2)
    .map((x) => x.id);

  return {
    overallScore,
    patternScore,
    fabricScore,
    craftScore,
    sceneScore,
    reasons,
    similarCaseIds,
  };
}

export function evaluateFeasibility(
  input: RequirementInput,
  config: ConfigurationState
): FeasibilityNotice[] {
  const notices: FeasibilityNotice[] = [];
  const pattern = PATTERNS.find((p) => p.id === config.patternId) ?? PATTERNS[0];
  const fabric = FABRICS.find((f) => f.id === config.fabricId) ?? FABRICS[0];
  const crafts = CRAFTS.filter((c) => config.craftIds.includes(c.id));

  if (input.season === 'summer' && fabric.gsm >= 280) {
    notices.push({
      id: 'feas-summer-heavy-gsm',
      level: 'risk',
      dimension: '季节克重',
      title: `夏季选配重磅面料预警（${fabric.gsm}g/m²）`,
      detail: `「${fabric.shortName}」克重偏高，夏季或室外易闷热，建议换选 195–235g/m² 透气面料。`,
    });
  } else if (input.season === 'winter' && fabric.gsm <= 190) {
    notices.push({
      id: 'feas-winter-light-gsm',
      level: 'caution',
      dimension: '季节克重',
      title: `冬季偏轻克重提示（${fabric.gsm}g/m²）`,
      detail: `「${fabric.shortName}」偏轻薄，若含户外环节建议增加内搭保暖或换选高克重面料。`,
    });
  } else {
    notices.push({
      id: 'feas-season-ok',
      level: 'pass',
      dimension: '季节克重',
      title: `克重与体感适配良好（${fabric.gsm}g/m² · ${fabric.drape}）`,
      detail: `满足当前季候与场景穿着舒适度要求。`,
    });
  }

  if (input.businessType === 'corporate_uniform' && fabric.isDelicateForUniform) {
    notices.push({
      id: 'feas-uniform-delicate',
      level: 'risk',
      dimension: '团单规范',
      title: '团体职业服选配娇贵纯丝/丝绒风险',
      detail: `「${fabric.shortName}」高频团装易勾丝且维护成本高，建议优先选用 Super 130s 羊毛、羊毛真丝混纺或抗皱斜纹呢。`,
    });
  }

  const incompatibleCrafts = crafts.filter((c) => !c.compatibleFabrics.includes(fabric.weave));
  if (incompatibleCrafts.length > 0) {
    notices.push({
      id: 'feas-craft-incompat',
      level: 'risk',
      dimension: '工艺兼容',
      title: `工艺与织法需复核：${incompatibleCrafts.map((c) => c.shortName).join('、')}`,
      detail:
        incompatibleCrafts[0].incompatibleNotes ||
        `当前工艺与「${fabric.weave}」织法需由资深版师评估衬布加固方案。`,
    });
  } else if (crafts.length > 0) {
    notices.push({
      id: 'feas-craft-ok',
      level: 'pass',
      dimension: '工艺兼容',
      title: `已选 ${crafts.length} 项工艺与「${fabric.weave}」兼容`,
      detail: '符合海派工坊制作规范，可进入毛样试身核定。',
    });
  }

  const extraDays = crafts.reduce((sum, c) => sum + c.extraLeadDays, 0);
  const totalRefDays = pattern.baseLeadDays + extraDays;
  if (extraDays >= 10) {
    notices.push({
      id: 'feas-lead-time',
      level: 'caution',
      dimension: '工期排期',
      title: `含高工时手工工艺（参考周期约 ${totalRefDays} 工作日）`,
      detail: `非遗手工预计额外增加 ${extraDays} 个工作日，实际排期须由工坊人工核定。`,
    });
  } else {
    notices.push({
      id: 'feas-lead-standard',
      level: 'pass',
      dimension: '工期排期',
      title: `参考企划周期约 ${totalRefDays} 个工作日`,
      detail: '处于集团标准周期内，最终交期以业务签单排期为准。',
    });
  }

  notices.push({
    id: 'feas-human-boundary',
    level: 'caution',
    dimension: '人工边界',
    title: 'AI 企划参考初稿 · 终审/报价/下单须人工完成',
    detail: '视觉预览与参数清单仅作前期沟通参考，实物米样核色、版型定稿与报价签约由人工执行。',
  });

  return notices;
}
