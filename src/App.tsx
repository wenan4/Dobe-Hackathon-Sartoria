import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoundaryModal } from './components/BoundaryModal';
import { LlmConfigModal } from './components/LlmConfigModal';
import {
  TopNav,
  type CompletedSteps,
  type FlowStepTab,
  type WorkspaceTab,
} from './components/TopNav';
import { HISTORICAL_CASES } from './data/cases';
import { CRAFTS } from './data/crafts';
import { FABRICS } from './data/fabrics';
import { PATTERNS } from './data/patterns';
import { PRESET_DEMO_CASES } from './data/presetDemos';
import { SCENES } from './data/scenes';
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
import { LandingHome } from './pages/LandingHome';
import { OnlineDocsPage } from './pages/OnlineDocsPage';
import { ProposalAndPrompts } from './pages/ProposalAndPrompts';
import { RequirementStudio, type DeconstructStatus } from './pages/RequirementStudio';
import { VideoShowcase } from './pages/VideoShowcase';
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
import { buildPathname, parsePathname, type AppRoute, type PortalSection } from './utils/router';

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

function summarizeConfigDiff(prev: ConfigurationState, next: ConfigurationState): string | undefined {
  const diffs: string[] = [];
  if (prev.patternId !== next.patternId) {
    const p1 = PATTERNS.find((p) => p.id === prev.patternId)?.code ?? prev.patternId;
    const p2 = PATTERNS.find((p) => p.id === next.patternId)?.code ?? next.patternId;
    diffs.push(`版型：${p1} → ${p2}`);
  }
  if (prev.fabricId !== next.fabricId) {
    const f1 = FABRICS.find((f) => f.id === prev.fabricId)?.shortName ?? prev.fabricId;
    const f2 = FABRICS.find((f) => f.id === next.fabricId)?.shortName ?? next.fabricId;
    diffs.push(`面料：${f1} → ${f2}`);
  }
  if (prev.sceneId !== next.sceneId) {
    const s1 = SCENES.find((s) => s.id === prev.sceneId)?.shortName ?? prev.sceneId;
    const s2 = SCENES.find((s) => s.id === next.sceneId)?.shortName ?? next.sceneId;
    diffs.push(`场景：${s1} → ${s2}`);
  }
  const prevC = [...prev.craftIds].sort().join(',');
  const nextC = [...next.craftIds].sort().join(',');
  if (prevC !== nextC) {
    const added = next.craftIds.filter((id) => !prev.craftIds.includes(id));
    const removed = prev.craftIds.filter((id) => !next.craftIds.includes(id));
    if (added.length > 0) {
      const names = added.map((id) => CRAFTS.find((c) => c.id === id)?.shortName ?? id).join('、');
      diffs.push(`新增工艺：${names}`);
    }
    if (removed.length > 0) {
      const names = removed.map((id) => CRAFTS.find((c) => c.id === id)?.shortName ?? id).join('、');
      diffs.push(`移除工艺：${names}`);
    }
  }
  return diffs.length > 0 ? diffs.join('；') : undefined;
}

function resolveInitialConfigForInput(
  nextInput: RequirementInput,
  nextDeconstructed: DeconstructedRequirement
): ConfigurationState {
  if (nextInput.presetDemoId) {
    const preset = PRESET_DEMO_CASES.find((d) => d.id === nextInput.presetDemoId);
    if (preset && preset.input.rawNarrative === nextInput.rawNarrative) {
      return preset.recommendedConfig;
    }
  }
  return recommendInitialConfig(nextInput, nextDeconstructed);
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function App() {
  const initialDemo = PRESET_DEMO_CASES[0];

  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined'
      ? parsePathname(window.location.pathname)
      : { section: 'home', demoTab: 'requirements' }
  );

  const startedBeyondStep1 =
    route.section === 'demo' &&
    (route.demoTab === 'configurator' || route.demoTab === 'proposal' || route.demoTab === 'ledger');

  const [lastFlowTab, setLastFlowTab] = useState<FlowStepTab>('requirements');
  const [activeStylePackId, setActiveStylePackId] = useState<StylePackId>('shanghai-haipai');
  const [input, setInput] = useState<RequirementInput>(initialDemo.input);
  const [deconstructed, setDeconstructed] = useState<DeconstructedRequirement>(() =>
    deconstructLocally(initialDemo.input)
  );
  const [deconstructStatus, setDeconstructStatus] = useState<DeconstructStatus>(
    startedBeyondStep1 ? 'ready' : 'idle'
  );
  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [deconstructRunId, setDeconstructRunId] = useState<number>(0);

  const [config, setConfig] = useState<ConfigurationState>(initialDemo.recommendedConfig);
  const [recommendedPatternId, setRecommendedPatternId] = useState<string>(
    initialDemo.recommendedConfig.patternId
  );
  const [completedSteps, setCompletedSteps] = useState<CompletedSteps>({
    requirements: startedBeyondStep1,
    configurator: route.section === 'demo' && (route.demoTab === 'proposal' || route.demoTab === 'ledger'),
    proposal: route.section === 'demo' && route.demoTab === 'ledger',
    ledger: false,
  });

  const [sessionLogs, setSessionLogs] = useState<AuditLogEntry[]>([]);
  const [ledgerRecords, setLedgerRecords] = useState<LedgerRecord[]>(() => loadLedgerRecords());
  const [lastArchivedRecordId, setLastArchivedRecordId] = useState<string | null>(null);
  const [llmSettings, setLlmSettings] = useState<LlmSettings>(() => loadLlmSettings());
  const [showLlmModal, setShowLlmModal] = useState(false);
  const [showBoundaryModal, setShowBoundaryModal] = useState(false);

  const deconstructTokenRef = useRef(0);

  const activeSection = route.section;
  const activeTab = route.demoTab;

  const syncIfNeededBeforeLeavingStep1 = useCallback(
    (targetTab: WorkspaceTab) => {
      if (
        (targetTab === 'configurator' || targetTab === 'proposal') &&
        (deconstructStatus === 'idle' || deconstructStatus === 'stale')
      ) {
        const nextDeconstructed = deconstructLocally(input);
        const nextConfig = resolveInitialConfigForInput(input, nextDeconstructed);
        setDeconstructed(nextDeconstructed);
        setConfig(nextConfig);
        setRecommendedPatternId(nextConfig.patternId);
        setDeconstructStatus('ready');
        setDeconstructRunId((n) => n + 1);
        setCompletedSteps((prev) => ({
          ...prev,
          requirements: true,
          configurator: targetTab === 'proposal' ? true : prev.configurator,
        }));
      }
    },
    [deconstructStatus, input]
  );

  const navigate = useCallback(
    (section: PortalSection, demoTab?: WorkspaceTab) => {
      setRoute((prev) => {
        const resolvedTab = demoTab ?? prev.demoTab;
        if (section === 'demo') {
          if (resolvedTab !== 'knowledge') {
            setLastFlowTab(resolvedTab);
          }
          syncIfNeededBeforeLeavingStep1(resolvedTab);
        }
        const next: AppRoute = {
          section,
          demoTab: resolvedTab,
        };
        if (typeof window !== 'undefined') {
          const nextPath = buildPathname(next);
          if (window.location.pathname !== nextPath) {
            window.history.pushState(null, '', nextPath);
          }
        }
        return next;
      });
    },
    [syncIfNeededBeforeLeavingStep1]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname.toLowerCase() === '/vedio') {
      window.history.replaceState(null, '', '/video');
    }
    const handlePop = () => {
      setRoute(parsePathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    saveLedgerRecords(ledgerRecords);
  }, [ledgerRecords]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeSection, activeTab]);

  const appendSessionLog = (
    stage: AuditLogEntry['stage'],
    action: string,
    detail: string,
    actor: AuditLogEntry['actor'] = 'Sartoria AI 助手',
    diffSummary?: string
  ) => {
    setSessionLogs((prev) => [
      ...prev.slice(-18),
      {
        id: `slog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        stage,
        action,
        detail,
        diffSummary,
        actor,
      },
    ]);
  };

  const match = useMemo(() => evaluateMatch(input, deconstructed, config), [input, deconstructed, config]);
  const feasibility = useMemo(
    () => evaluateFeasibility(input, config, deconstructed),
    [input, config, deconstructed]
  );
  const visual = useMemo(() => resolveStageVisual(config), [config]);
  const proposal = useMemo(
    () => generateProposalDraft(input, deconstructed, config, feasibility, match),
    [input, deconstructed, config, feasibility, match]
  );
  const promptPack = useMemo(
    () => generateVisualPromptPack(input, deconstructed, config),
    [input, deconstructed, config]
  );

  const handleChangeInput = (next: RequirementInput) => {
    setInput(next);
    if (deconstructStatus === 'ready') {
      setDeconstructStatus('stale');
    }
  };

  const handleSelectPresetDemo = (demo: PresetDemoCase) => {
    deconstructTokenRef.current += 1;
    setInput(demo.input);
    setDeconstructStatus('idle');
    setAnalysisStage(0);
    setCompletedSteps({
      requirements: false,
      configurator: false,
      proposal: false,
      ledger: false,
    });
    setLastArchivedRecordId(null);
    setSessionLogs([]);
  };

  const handleLaunchPresetById = (presetId: string) => {
    const demo = PRESET_DEMO_CASES.find((d) => d.id === presetId);
    if (demo) {
      handleSelectPresetDemo(demo);
    }
    navigate('demo', 'requirements');
  };

  const handleRunDeconstruct = async () => {
    if (!input.rawNarrative.trim()) return;
    const token = ++deconstructTokenRef.current;

    setDeconstructStatus('analyzing');
    setAnalysisStage(1);

    const enginePromise = deconstructRequirement(input, llmSettings);

    await waitMs(220);
    if (deconstructTokenRef.current !== token) return;
    setAnalysisStage(2);

    await waitMs(240);
    if (deconstructTokenRef.current !== token) return;
    setAnalysisStage(3);

    const [nextDeconstructed] = await Promise.all([enginePromise, waitMs(240)]);
    if (deconstructTokenRef.current !== token) return;

    const nextConfig = resolveInitialConfigForInput(input, nextDeconstructed);
    const diffSummary =
      deconstructRunId > 0 ? summarizeConfigDiff(config, nextConfig) : undefined;

    setDeconstructed(nextDeconstructed);
    setConfig(nextConfig);
    setRecommendedPatternId(nextConfig.patternId);
    setDeconstructRunId((n) => n + 1);
    setDeconstructStatus('ready');
    setCompletedSteps((prev) => ({ ...prev, requirements: true }));

    appendSessionLog(
      '需求解构',
      '完成自然语言需求智能拆解',
      `输出 8 项专业参数与 6 维审美标签（${nextDeconstructed.colorSpecifiedByUser ? '已识别色彩倾向' : '未指定颜色·留待人工核色'}）`,
      'Sartoria AI 助手',
      diffSummary
    );
  };

  const handleUpdateConfig = (
    updater: (prev: ConfigurationState) => ConfigurationState,
    auditNote?: string
  ) => {
    setConfig((prev) => {
      const next = updater(prev);
      if (auditNote) {
        const diffSummary = summarizeConfigDiff(prev, next);
        appendSessionLog(
          '资源选配',
          auditNote,
          '已同步更新实景舞台、3D面料、可行性校验与三镜头提示词包',
          '定制业务专员（人工）',
          diffSummary
        );
      }
      return next;
    });
  };

  const handleApplyCasePreset = (caseId: string) => {
    const hc = HISTORICAL_CASES.find((c) => c.id === caseId);
    if (!hc) return;
    handleUpdateConfig(
      (prev) => ({
        ...prev,
        patternId: hc.patternId,
        fabricId: hc.fabricId,
        craftIds: [...hc.craftIds],
        sceneId: hc.sceneId,
        focusedHotspotId: null,
      }),
      `复用历史案例「${hc.code}」`
    );
    navigate('demo', 'configurator');
  };

  const upsertCurrentSessionToLedger = (): string => {
    const existing = ledgerRecords.find((r) => r.projectName === input.projectName);
    const configDiff = existing ? summarizeConfigDiff(existing.config, config) : undefined;
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
      existingLogs: [...(existing?.auditLogs ?? []), ...sessionLogs].slice(-20),
      actionNote: existing ? '同步更新方案初稿与视觉需求包' : '新建台账并完成首轮方案归档',
      actionDiff: configDiff,
    });

    setLedgerRecords((prev) => {
      const filtered = prev.filter((r) => r.id !== nextRec.id);
      return [nextRec, ...filtered];
    });
    setLastArchivedRecordId(nextRec.id);
    setCompletedSteps((prev) => ({
      ...prev,
      requirements: true,
      configurator: true,
      proposal: true,
      ledger: true,
    }));
    return nextRec.id;
  };

  const handleSaveAndOpenProposal = () => {
    appendSessionLog('方案初稿', '生成方案初稿与三镜头视觉需求包', `方案编号 ${proposal.id}`);
    setCompletedSteps((prev) => ({ ...prev, requirements: true, configurator: true }));
    navigate('demo', 'proposal');
  };

  const handleArchiveAndOpenLedger = () => {
    upsertCurrentSessionToLedger();
    navigate('demo', 'ledger');
  };

  const handleUpdateLedgerRecord = (
    id: string,
    patch: {
      projectName?: string;
      clientName?: string;
      status?: LedgerReviewStatus;
      specialistNotes?: string;
    },
    auditAction: string,
    diffSummary?: string
  ) => {
    setLedgerRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const now = new Date().toISOString();
        return {
          ...rec,
          ...patch,
          updatedAt: now,
          auditLogs: [
            ...rec.auditLogs,
            {
              id: `log-h-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              timestamp: now,
              stage: '人工复核',
              action: auditAction,
              detail: `当前状态：${patch.status ?? rec.status}`,
              diffSummary,
              actor: '定制业务专员（人工）',
            },
          ],
        };
      })
    );
  };

  const handleLoadRecordIntoStudio = (record: LedgerRecord) => {
    setInput(record.requirementInput);
    setDeconstructed(record.deconstructed);
    setConfig(record.config);
    setRecommendedPatternId(record.config.patternId);
    setDeconstructStatus('ready');
    setDeconstructRunId((n) => n + 1);
    setCompletedSteps({
      requirements: true,
      configurator: false,
      proposal: false,
      ledger: false,
    });
    setSessionLogs([
      {
        id: `slog-reload-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: '资源选配',
        action: `从台账回载项目「${record.projectCode}」`,
        detail: '继续调整静态模拟资源并同步追踪变更轨迹',
        actor: '定制业务专员（人工）',
      },
    ]);
    navigate('demo', 'configurator');
  };

  const handleStartNewRequirement = () => {
    handleSelectPresetDemo(PRESET_DEMO_CASES[0]);
    navigate('demo', 'requirements');
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
        activeSection={activeSection}
        activeTab={activeTab}
        completedSteps={completedSteps}
        onNavigate={navigate}
        llmSettings={llmSettings}
        ledgerCount={ledgerRecords.length}
        onOpenLlmModal={() => setShowLlmModal(true)}
        onOpenBoundaryModal={() => setShowBoundaryModal(true)}
      />

      <main className="app-main">
        {activeSection === 'home' && (
          <LandingHome
            onNavigate={navigate}
            onLaunchPresetDemo={handleLaunchPresetById}
          />
        )}

        {activeSection === 'video' && <VideoShowcase onNavigate={navigate} />}

        {activeSection === 'docs' && <OnlineDocsPage onNavigate={navigate} />}

        {activeSection === 'demo' && activeTab === 'requirements' && (
          <RequirementStudio
            input={input}
            deconstructed={deconstructed}
            status={deconstructStatus}
            analysisStage={analysisStage}
            runId={deconstructRunId}
            onChangeInput={handleChangeInput}
            onSelectPresetDemo={handleSelectPresetDemo}
            onRunDeconstruct={handleRunDeconstruct}
            onProceedToConfigurator={() => navigate('demo', 'configurator')}
          />
        )}

        {activeSection === 'demo' && activeTab === 'configurator' && (
          <ConfiguratorStudio
            input={input}
            deconstructed={deconstructed}
            config={config}
            recommendedPatternId={recommendedPatternId}
            match={match}
            feasibility={feasibility}
            visual={visual}
            promptPack={promptPack}
            onUpdateConfig={handleUpdateConfig}
            onApplyCasePreset={handleApplyCasePreset}
            onBackToRequirements={() => navigate('demo', 'requirements')}
            onSaveAndOpenProposal={handleSaveAndOpenProposal}
          />
        )}

        {activeSection === 'demo' && activeTab === 'proposal' && (
          <ProposalAndPrompts
            proposal={proposal}
            promptPack={promptPack}
            heroPreviewImage={visual.heroImage}
            craftPreviewImage={visual.craftCloseupImage}
            isArchived={completedSteps.ledger}
            onBackToConfigurator={() => navigate('demo', 'configurator')}
            onSaveToLedger={upsertCurrentSessionToLedger}
            onArchiveAndOpenLedger={handleArchiveAndOpenLedger}
          />
        )}

        {activeSection === 'demo' && activeTab === 'knowledge' && (
          <AssetKnowledgeBase
            activeStylePackId={activeStylePackId}
            onChangeStylePack={setActiveStylePackId}
            onBackToFlow={() => navigate('demo', lastFlowTab)}
            onTryPatternInStudio={(patternId) => {
              handleUpdateConfig(
                (prev) => ({ ...prev, patternId, activeView: 'blueprint', focusedHotspotId: null }),
                `从资产库载入版型 ${patternId}`
              );
              navigate('demo', 'configurator');
            }}
            onTryFabricInStudio={(fabricId) => {
              handleUpdateConfig(
                (prev) => ({ ...prev, fabricId, activeView: 'craft_3d', focusedHotspotId: null }),
                `从资产库载入面料 ${fabricId}`
              );
              navigate('demo', 'configurator');
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
              navigate('demo', 'configurator');
            }}
            onTryCaseInStudio={handleApplyCasePreset}
          />
        )}

        {activeSection === 'demo' && activeTab === 'ledger' && (
          <BusinessLedger
            records={ledgerRecords}
            highlightedRecordId={lastArchivedRecordId}
            onUpdateRecord={handleUpdateLedgerRecord}
            onLoadRecordIntoStudio={handleLoadRecordIntoStudio}
            onStartNewRequirement={handleStartNewRequirement}
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
