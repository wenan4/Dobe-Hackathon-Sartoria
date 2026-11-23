import { CRAFTS } from '../data/crafts';
import { FABRICS } from '../data/fabrics';
import { PATTERNS } from '../data/patterns';
import { SCENES } from '../data/scenes';
import type { LedgerRecord, VisualPromptPack } from '../types/sartoria';

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildLedgerCsv(records: LedgerRecord[]): string {
  const headers = [
    '项目编号',
    '项目名称',
    '客户名称',
    '业务类型',
    '复核状态（人工流转）',
    '综合适配度',
    '选用版型',
    '选用面料',
    '工艺组合',
    '目标场景',
    '情绪审美标签',
    '业务专员备注',
    '最近更新时间',
  ];

  const rows = records.map((rec) => {
    const pat = PATTERNS.find((p) => p.id === rec.config.patternId);
    const fab = FABRICS.find((f) => f.id === rec.config.fabricId);
    const scene = SCENES.find((s) => s.id === rec.config.sceneId);
    const craftNames = CRAFTS.filter((c) => rec.config.craftIds.includes(c.id))
      .map((c) => c.name)
      .join(' / ');

    return [
      rec.projectCode,
      rec.projectName,
      rec.clientName,
      rec.businessType === 'private_couture' ? '高端海派私定' : '团体职业服定制',
      rec.status,
      `${rec.matchScore}%`,
      pat ? `${pat.code} ${pat.name}` : rec.config.patternId,
      fab ? `${fab.code} ${fab.name}` : rec.config.fabricId,
      craftNames || '基准工艺',
      scene?.name ?? rec.config.sceneId,
      rec.deconstructed.emotionTags.join('、'),
      rec.specialistNotes || '（待补充）',
      rec.updatedAt,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  // UTF-8 BOM ensures Excel opens Chinese CSV cleanly without mojibake
  return `\uFEFF${[headers.map(escapeCsvCell).join(','), ...rows].join('\n')}`;
}

export function buildAssetCatalogCsv(): string {
  const headers = ['资产大类', '资产编号', '资产名称', '风格包', '核心参数', '适用规范与说明'];
  const rows: string[][] = [
    ...PATTERNS.map((p) => [
      '海派经典版型',
      p.code,
      p.name,
      p.stylePackId,
      `${p.silhouette} | ${p.collarType}`,
      p.usageStandard,
    ]),
    ...FABRICS.map((f) => [
      '特色定制面料',
      f.code,
      f.name,
      f.stylePackId,
      `${f.composition} | ${f.gsm}g/m² | ${f.luster}`,
      f.careAndMoqNote,
    ]),
    ...CRAFTS.map((c) => [
      '非遗与经典工艺',
      c.code,
      c.name,
      c.stylePackId,
      `${c.heritageLevel} | ${c.placement} | +${c.extraLeadDays}天`,
      c.usageStandard,
    ]),
  ];

  return `\uFEFF${[
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
  ].join('\n')}`;
}

export function buildPromptPackMarkdown(pack: VisualPromptPack): string {
  const lines: string[] = [
    `# ${pack.packTitle}`,
    '',
    `- 生成时间：${pack.generatedAt}`,
    `- 色彩与光照基准：${pack.paletteSummary}`,
    `- 使用说明：本视觉需求包由 Sartoria AI 辅助生成，仅供前期审美对齐，实物色泽须以工坊面料米样为准。`,
    '',
  ];

  for (const shot of pack.shots) {
    lines.push(`## ${shot.shotTitle}`);
    lines.push(`> ${shot.shotSubtitle}`);
    lines.push(`- 推荐画幅：\`${shot.aspectRatio}\` ｜ 镜头：${shot.cameraSpec} ｜ 灯光：${shot.lightingSpec}`);
    lines.push('');
    lines.push('### Midjourney v6.1');
    lines.push('```text');
    lines.push(shot.prompts.midjourney);
    lines.push('```');
    lines.push('');
    lines.push('### Flux.1 / Stable Diffusion');
    lines.push('```text');
    lines.push(shot.prompts.flux_sd);
    lines.push('```');
    lines.push('');
    lines.push('### 即梦（中文直出）');
    lines.push('```text');
    lines.push(shot.prompts.jimeng_cn);
    lines.push('```');
    lines.push('');
    lines.push(`- 负向提示词（Negative Prompt）：\`${shot.negativePrompt}\``);
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
