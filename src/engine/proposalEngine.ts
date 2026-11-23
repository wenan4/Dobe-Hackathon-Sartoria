import { CRAFTS } from '../data/crafts';
import { FABRICS } from '../data/fabrics';
import { PATTERNS } from '../data/patterns';
import { SCENES } from '../data/scenes';
import type {
  ConfigurationState,
  DeconstructedRequirement,
  FeasibilityNotice,
  ProposalDraft,
  RequirementInput,
} from '../types/sartoria';

export function generateProposalDraft(
  input: RequirementInput,
  deconstructed: DeconstructedRequirement,
  config: ConfigurationState,
  feasibilityNotices: FeasibilityNotice[]
): ProposalDraft {
  const pattern = PATTERNS.find((p) => p.id === config.patternId) ?? PATTERNS[0];
  const fabric = FABRICS.find((f) => f.id === config.fabricId) ?? FABRICS[0];
  const scene = SCENES.find((s) => s.id === config.sceneId) ?? SCENES[0];
  const crafts = CRAFTS.filter((c) => config.craftIds.includes(c.id));

  const extraDays = crafts.reduce((sum, c) => sum + c.extraLeadDays, 0);
  const totalRefDays = pattern.baseLeadDays + extraDays;
  const isUniform = input.businessType === 'corporate_uniform';

  const designHighlights: string[] = [
    `廓形与体态修饰：选用「${pattern.name}」（${pattern.code}），${pattern.silhouette}；${pattern.easeAllowance}。`,
    `领型与比例：${pattern.collarType}，${pattern.lengthRatio}。`,
    `核心面料：采用「${fabric.name}」（${fabric.composition}，${fabric.gsm}g/m²），具备「${fabric.drape} · ${fabric.luster}」特性。`,
    crafts.length > 0
      ? `海派精工：叠加${crafts.map((c) => `「${c.name}」`).join('、')}，${crafts[0].highlightCopy}`
      : '克制极简：保留净面立体剪裁与内里包边精工，突出面料自然肌理。',
  ];

  const humanReviewChecklist = isUniform
    ? [
        '业务专员与客户品牌部现场核对实物面料米样与自然光显色',
        '团装版师复核 S–4XL 分级号型套码量体方案及男女领型微调',
        '商务团队独立出具正式团单报价、交付节点与合同条款（AI 不介入报价）',
        '样衣经客户终审签字后由业务人员正式下达生产指令',
      ]
    : [
        '定制顾问邀约客户在工坊高显色光源下触感比对实物面料米样',
        '资深版师完成精细量体，实测领高、肩斜、腹部/袖笼活动放量并安排毛样试身',
        '手工工坊确认非遗工艺位点与制作排期',
        '由定制专员与客户完成正式报价确认、合同签署与定金流程（AI 不介入商务决策）',
      ];

  return {
    id: `PROP-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date().toISOString(),
    projectName: input.projectName || pattern.name,
    clientName: input.clientName || '待补充客户名称',
    businessType: input.businessType,
    stylePositioning: `${deconstructed.aestheticArchetype} · ${pattern.category}`,
    emotionAlignment: deconstructed.targetAudienceInsight,
    officialSpecs: deconstructed.officialSpecs,
    patternSummary: `${pattern.name}（${pattern.code}）｜${pattern.silhouette}｜${pattern.collarType}`,
    fabricSummary: `${fabric.name}（${fabric.code}）｜${fabric.composition}｜${fabric.gsm}g/m²｜${fabric.careAndMoqNote}`,
    craftSummary:
      crafts.length > 0
        ? crafts.map((c) => `${c.name}（${c.heritageLevel}，${c.placement}）`).join('；')
        : '净面基准精工工艺',
    sceneAdaptation: `${scene.name}（${scene.formality} · ${scene.lighting.colorTempLabel}）`,
    designHighlights,
    estimatedLeadTimeNote: `参考企划周期约 ${totalRefDays} 个工作日（基准 ${pattern.baseLeadDays} 天 + 工艺 ${extraDays} 天，仅供参考，最终交期须人工核定）。`,
    feasibilityNotices,
    humanReviewChecklist,
    boundaryDisclaimer:
      '【能力边界声明】本方案由 Sartoria AI 基于企业存量静态模拟数据生成，仅作为前期需求转译与企划参考初稿。版型定稿、实物核色、正式报价、商务签约及生产下单全部由业务与技术团队人工执行。',
  };
}
