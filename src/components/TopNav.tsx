import { Cpu, ShieldCheck } from 'lucide-react';
import type { LlmSettings } from '../types/sartoria';

export type WorkspaceTab = 'requirements' | 'configurator' | 'proposal' | 'knowledge' | 'ledger';

interface TopNavProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  llmSettings: LlmSettings;
  ledgerCount: number;
  onOpenLlmModal: () => void;
  onOpenBoundaryModal: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'requirements', label: '需求拆解' },
  { id: 'configurator', label: '场景选配' },
  { id: 'proposal', label: '方案与提示词' },
  { id: 'knowledge', label: '资产库' },
  { id: 'ledger', label: '业务台账' },
];

export function TopNav({
  activeTab,
  onSelectTab,
  llmSettings,
  ledgerCount,
  onOpenLlmModal,
  onOpenBoundaryModal,
}: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="brand-wordmark">
        <span className="brand-name">SARTORIA</span>
        <span className="brand-dot">AI · 海派定制</span>
      </div>

      <nav className="nav-links" aria-label="主导航">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
          >
            <span>{item.label}</span>
            {item.id === 'ledger' && <span className="nav-count">{ledgerCount}</span>}
          </button>
        ))}
      </nav>

      <div className="nav-utilities">
        <button type="button" className="util-btn" onClick={onOpenLlmModal}>
          <Cpu size={14} strokeWidth={1.6} />
          <span>{llmSettings.enabled && llmSettings.apiKey ? 'LLM 模式' : '本地引擎'}</span>
        </button>
        <button type="button" className="util-btn" onClick={onOpenBoundaryModal}>
          <ShieldCheck size={14} strokeWidth={1.6} />
          <span>能力边界</span>
        </button>
      </div>
    </header>
  );
}
