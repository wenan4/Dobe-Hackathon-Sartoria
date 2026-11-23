import { PRESET_DEMO_CASES } from '../data/presetDemos';
import type {
  AuditLogEntry,
  ConfigurationState,
  DeconstructedRequirement,
  LedgerRecord,
  LedgerReviewStatus,
  RequirementInput,
  StylePackId,
} from '../types/sartoria';
import { deconstructLocally } from './deconstructEngine';
import { evaluateFeasibility, evaluateMatch } from './matchingEngine';
import { generateVisualPromptPack } from './promptEngine';
import { generateProposalDraft } from './proposalEngine';

const STORAGE_KEY = 'sartoria_ai_ledger_v2';

export function buildLedgerRecordFromSession(params: {
  id?: string;
  projectCode?: string;
  stylePackId: StylePackId;
  input: RequirementInput;
  deconstructed: DeconstructedRequirement;
  config: ConfigurationState;
  specialistNotes?: string;
  status?: LedgerReviewStatus;
  existingLogs?: AuditLogEntry[];
  actionNote?: string;
  createdAt?: string;
}): LedgerRecord {
  const now = new Date().toISOString();
  const match = evaluateMatch(params.input, params.deconstructed, params.config);
  const feasibility = evaluateFeasibility(params.input, params.config);
  const proposal = generateProposalDraft(
    params.input,
    params.deconstructed,
    params.config,
    feasibility
  );
  const promptPack = generateVisualPromptPack(params.input, params.deconstructed, params.config);

  const baseLogs: AuditLogEntry[] = params.existingLogs ?? [
    {
      id: `log-${Date.now()}-1`,
      timestamp: params.createdAt ?? now,
      stage: '需求解构',
      action: '完成官方 8 项专业参数与六维审美转译',
      detail: `体态与情绪识别：${
        params.deconstructed.bodyErgonomics.slice(0, 2).join('、') ||
        params.deconstructed.emotionTags.slice(0, 3).join('、')
      }`,
      actor: 'Sartoria AI 助手',
    },
    {
      id: `log-${Date.now()}-2`,
      timestamp: params.createdAt ?? now,
      stage: '资源选配',
      action: '完成场景化选配与可行性护栏评估',
      detail: `综合契合 ${match.overallScore}% · 版型 ${params.config.patternId} · 面料 ${params.config.fabricId}`,
      actor: 'Sartoria AI 助手',
    },
    {
      id: `log-${Date.now()}-3`,
      timestamp: now,
      stage: '方案初稿',
      action: '输出定制方案初稿与三平台 AI 视觉提示词包',
      detail: `方案编号 ${proposal.id}（草稿待人工终审）`,
      actor: 'Sartoria AI 助手',
    },
  ];

  const logs = params.actionNote
    ? [
        ...baseLogs,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now,
          stage: '人工复核' as const,
          action: params.actionNote,
          detail: `人工流转状态：${params.status ?? '待业务专员复核'}`,
          actor: '定制业务专员（人工）' as const,
        },
      ]
    : baseLogs;

  return {
    id: params.id ?? `rec-${Date.now().toString(36)}`,
    projectCode:
      params.projectCode ??
      `SFG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
    projectName: params.input.projectName || '未命名定制企划',
    clientName: params.input.clientName || '待补充客户',
    businessType: params.input.businessType,
    stylePackId: params.stylePackId,
    createdAt: params.createdAt ?? now,
    updatedAt: now,
    status: params.status ?? '待业务专员复核',
    matchScore: match.overallScore,
    requirementInput: params.input,
    deconstructed: params.deconstructed,
    config: params.config,
    proposal,
    promptPack,
    specialistNotes: params.specialistNotes ?? '',
    auditLogs: logs,
  };
}

export function createSeedLedgerRecords(): LedgerRecord[] {
  const seedIds = ['official-case-1', 'official-case-3', 'demo-corporate-haipai-uniform'];
  const selectedDemos = PRESET_DEMO_CASES.filter((d) => seedIds.includes(d.id));

  return selectedDemos.map((demo, idx) => {
    const deconstructed = deconstructLocally(demo.input);
    const seedTime = new Date(Date.now() - (3 - idx) * 3600 * 1000 * 5).toISOString();
    return buildLedgerRecordFromSession({
      id: `seed-${demo.id}`,
      projectCode: `SFG-2026-00${idx + 1}`,
      stylePackId: 'shanghai-haipai',
      input: demo.input,
      deconstructed,
      config: demo.recommendedConfig,
      specialistNotes: demo.specialistNoteSeed,
      status: idx === 0 ? '待版师/报价终审' : '待业务专员复核',
      createdAt: seedTime,
    });
  });
}

export function loadLedgerRecords(): LedgerRecord[] {
  if (typeof window === 'undefined') {
    return createSeedLedgerRecords();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = createSeedLedgerRecords();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    const parsed = JSON.parse(raw) as LedgerRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : createSeedLedgerRecords();
  } catch {
    return createSeedLedgerRecords();
  }
}

export function saveLedgerRecords(records: LedgerRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}
