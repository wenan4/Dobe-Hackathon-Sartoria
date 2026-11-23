import { useEffect, useMemo, useState } from 'react';
import { BoundaryModal } from './components/BoundaryModal';
import { LlmConfigModal } from './components/LlmConfigModal';
import { TopNav, type WorkspaceTab } from './components/TopNav';
import { HISTORICAL_CASES } from './data/cases';
import { PRESET_DEMO_CASES } from './data/presetDemos';
import { deconstructLocally, deconstructRequirement } from './engine/deconstructEngine';
import {
  buildLedgerRecordFromSession,
  loadLedgerRecords,
  saveLedgerRecords,
} from './engine/ledgerStore';
import { evaluateFeasibility, evaluateMatch, recommendInitialConfig } from './engine/matchingEngine';
import { generateVisualPromptPack } from './engine/promptEngine';
import { generateProposalDraft } from './engine/proposalEngine';
import { resolveStageVisual } from './engine/visualResolver';
import { AssetKnowledgeBase } from './pages/AssetKnowledgeBase';
import { BusinessLedger } from './pages/BusinessLedger';
import { ConfiguratorStudio } from './pages/ConfiguratorStudio';
import { ProposalAndPrompts } from './pages/ProposalAndPrompts';
import { RequirementStudio } from './pages/RequirementStudio';
import type {
  AuditLogEntry,
  ConfigurationState,
  DeconstructedRequirement,
  LedgerRecord,
  LedgerReviewStatus,
  LlmSettings,
  PresetDemoCase,
  RequirementInput,
  StylePackId,
} from './types/sartoria';

const LLM_STORAGE_KEY = 'sartoria_ai_llm_settings_v1';

function loadLlmSettings(): LlmSettings {
  try {
    const raw = window.localStorage.getItem(LLM_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LlmSettings;
  } catch {
    // ignore
  }
  return {
    enabled: false,
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
  };
}

export default function App() {
  const initialDemo = PRESET_DEMO_CASES[0];

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('requirements');
  const [activeStylePackId, setActiveStylePackId] = useState<StylePackId>('shanghai-haipai');
  const [input, setInput] = useState<RequirementInput>(initialDemo.input);
  const [deconstructed, setDeconstructed] = useState<DeconstructedRequirement>(() =>
    deconstructLocally(initialDemo.input)
  );
  const [config, setConfig] = useState<ConfigurationState>(initialDemo.recommendedConfig);
  const [isDeconstructing, setIsDeconstructing] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<AuditLogEntry[]>([
    {
      id: 'init-log-1',
      timestamp: new Date().toISOString(),
      stage: '需求解构',
      action: `初始化载入「${initialDemo.title}」`,
      detail: '完成官方 8 项专业参数转译与推荐资产匹配',
      actor: 'Sartoria AI 助手',
    },
  ]);

  const [ledgerRecords, setLedgerRecords] = useState<LedgerRecord[]>(() => loadLedgerRecords());
  const [llmSettings, setLlmSettings] = useState<LlmSettings>(() => loadLlmSettings());
  const [showLlmModal, setShowLlmModal] = useState(false);
  const [showBoundaryModal, setShowBoundaryModal] = useState(false);

  useEffect(() => {
    saveLedgerRecords(ledgerRecords);
  }, [ledgerRecords]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  const appendSessionLog = (
    stage: AuditLogEntry['stage'],
    action: string,
    detail: string,
    actor: AuditLogEntry['actor'] = 'Sartoria AI 助手'
  ) => {
    setSessionLogs((prev) => [
      ...prev.slice(-18),
      {
        id: `slog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        stage,
        action,
        detail,
        actor,
      },
    ]);
  };

  const match = useMemo(() => evaluateMatch(input, deconstructed, config), [input, deconstructed, config]);
  const feasibility = useMemo(() => evaluateFeasibility(input, config), [input, config]);
  const visual = useMemo(() => resolveStageVisual(config), [config]);
  const proposal = useMemo(
    () => generateProposalDraft(input, deconstructed, config, feasibility),
    [input, deconstructed, config, feasibility]
  );
  const promptPack = useMemo(
    () => generateVisualPromptPack(input, deconstructed, config),
    [input, deconstructed, config]
  );

  const handleSelectPresetDemo = (demo: PresetDemoCase) => {
    setInput(demo.input);
    const nextDeconstructed = deconstructLocally(demo.input);
    setDeconstructed(nextDeconstructed);
    setConfig(demo.recommendedConfig);
    appendSessionLog('需求解构', `载入「${demo.title}」`, '完成官方 8 项专业转译并匹配默认选配');
  };

  const handleRunDeconstruct = async () => {
    setIsDeconstructing(true);
    try {
      const nextDeconstructed = await deconstructRequirement(input, llmSettings);
      setDeconstructed(nextDeconstructed);
      const nextConfig = recommendInitialConfig(input, nextDeconstructed);
      setConfig(nextConfig);
      appendSessionLog(
        '需求解构',
        '执行自然语言需求智能拆解',
        `输出官方 8 项定制参数；自动匹配最佳版型、面料与设定场景`
      );
    } finally {
      setIsDeconstructing(false);
    }
  };

  const handleUpdateConfig = (
    updater: (prev: ConfigurationState) => ConfigurationState,
    auditNote?: string
  ) => {
    setConfig((prev) => updater(prev));
    if (auditNote) {
      appendSessionLog('资源选配', auditNote, '已同步更新实景舞台、3D面料光泽、可行性校验与AI提示词');
    }
  };

  const handleApplyCasePreset = (caseId: string) => {
    const hc = HISTORICAL_CASES.find((c) => c.id === caseId);
    if (!hc) return;
    setConfig((prev) => ({
      ...prev,
      patternId: hc.patternId,
      fabricId: hc.fabricId,
      craftIds: [...hc.craftIds],
      sceneId: hc.sceneId,
      focusedHotspotId: null,
    }));
    appendSessionLog('资源选配', `复用历史案例「${hc.code}」`, hc.title);
    setActiveTab('configurator');
  };

  const upsertCurrentSessionToLedger = () => {
    const existing = ledgerRecords.find((r) => r.projectName === input.projectName);
    const nextRec = buildLedgerRecordFromSession({
      id: existing?.id,
      projectCode: existing?.projectCode,
      createdAt: existing?.createdAt,
      stylePackId: activeStylePackId,
      input,
      deconstructed,
      config,
      specialistNotes: existing?.specialistNotes ?? '',
      status: existing?.status ?? '待业务专员复核',
      existingLogs: [...(existing?.auditLogs ?? []), ...sessionLogs].slice(-15),
      actionNote: existing ? '同步更新企划方案初稿与视觉包' : '新建台账并完成首轮方案归档',
    });

    setLedgerRecords((prev) => {
      const filtered = prev.filter((r) => r.id !== nextRec.id);
      return [nextRec, ...filtered];
    });
  };

  const handleSaveAndOpenProposal = () => {
    appendSessionLog('方案初稿', '生成方案初稿与视觉提示词包', `方案编号 ${proposal.id}`);
    upsertCurrentSessionToLedger();
    setActiveTab('proposal');
  };

  const handleUpdateLedgerRecord = (
    id: string,
    patch: { status?: LedgerReviewStatus; specialistNotes?: string },
    auditAction: string
  ) => {
    setLedgerRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const now = new Date().toISOString();
        const shouldAppendLog = patch.status !== undefined;
        return {
          ...rec,
          ...patch,
          updatedAt: now,
          auditLogs: shouldAppendLog
            ? [
                ...rec.auditLogs,
                {
                  id: `log-h-${Date.now()}`,
                  timestamp: now,
                  stage: '人工复核',
                  action: auditAction,
                  detail: `当前状态：${patch.status ?? rec.status}`,
                  actor: '定制业务专员（人工）',
                },
              ]
            : rec.auditLogs,
        };
      })
    );
  };

  const handleLoadRecordIntoStudio = (record: LedgerRecord) => {
    setInput(record.requirementInput);
    setDeconstructed(record.deconstructed);
    setConfig(record.config);
    setActiveTab('configurator');
  };

  const handleSaveLlmSettings = (next: LlmSettings) => {
    setLlmSettings(next);
    try {
      window.localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        llmSettings={llmSettings}
        ledgerCount={ledgerRecords.length}
        onOpenLlmModal={() => setShowLlmModal(true)}
        onOpenBoundaryModal={() => setShowBoundaryModal(true)}
      />

      <main className="app-main">
        {activeTab === 'requirements' && (
          <RequirementStudio
            input={input}
            deconstructed={deconstructed}
            isDeconstructing={isDeconstructing}
            onChangeInput={setInput}
            onSelectPresetDemo={handleSelectPresetDemo}
            onRunDeconstruct={handleRunDeconstruct}
            onProceedToConfigurator={() => setActiveTab('configurator')}
          />
        )}

        {activeTab === 'configurator' && (
          <ConfiguratorStudio
            input={input}
            config={config}
            match={match}
            feasibility={feasibility}
            visual={visual}
            promptPack={promptPack}
            onUpdateConfig={handleUpdateConfig}
            onApplyCasePreset={handleApplyCasePreset}
            onSaveAndOpenProposal={handleSaveAndOpenProposal}
          />
        )}

        {activeTab === 'proposal' && (
          <ProposalAndPrompts
            proposal={proposal}
            promptPack={promptPack}
            heroPreviewImage={visual.heroImage}
            craftPreviewImage={visual.craftCloseupImage}
            onSaveToLedger={upsertCurrentSessionToLedger}
            onOpenLedger={() => setActiveTab('ledger')}
          />
        )}

        {activeTab === 'knowledge' && (
          <AssetKnowledgeBase
            activeStylePackId={activeStylePackId}
            onChangeStylePack={setActiveStylePackId}
            onTryPatternInStudio={(patternId) => {
              handleUpdateConfig(
                (prev) => ({ ...prev, patternId, activeView: 'blueprint', focusedHotspotId: null }),
                `从资产库载入版型 ${patternId}`
              );
              setActiveTab('configurator');
            }}
            onTryFabricInStudio={(fabricId) => {
              handleUpdateConfig(
                (prev) => ({ ...prev, fabricId, activeView: 'craft_3d', focusedHotspotId: null }),
                `从资产库载入面料 ${fabricId}`
              );
              setActiveTab('configurator');
            }}
            onTryCraftInStudio={(craftId) => {
              handleUpdateConfig(
                (prev) => ({
                  ...prev,
                  craftIds: prev.craftIds.includes(craftId)
                    ? prev.craftIds
                    : [...prev.craftIds, craftId],
                  focusedHotspotId: null,
                }),
                `从资产库叠加细节 ${craftId}`
              );
              setActiveTab('configurator');
            }}
            onTryCaseInStudio={handleApplyCasePreset}
          />
        )}

        {activeTab === 'ledger' && (
          <BusinessLedger
            records={ledgerRecords}
            onUpdateRecord={handleUpdateLedgerRecord}
            onLoadRecordIntoStudio={handleLoadRecordIntoStudio}
          />
        )}
      </main>

      <LlmConfigModal
        open={showLlmModal}
        settings={llmSettings}
        onSave={handleSaveLlmSettings}
        onClose={() => setShowLlmModal(false)}
      />

      <BoundaryModal open={showBoundaryModal} onClose={() => setShowBoundaryModal(false)} />
    </>
  );
}
