import { X } from 'lucide-react';
import { useState } from 'react';
import type { LlmSettings } from '../types/sartoria';

interface LlmConfigModalProps {
  open: boolean;
  settings: LlmSettings;
  onSave: (next: LlmSettings) => void;
  onClose: () => void;
}

export function LlmConfigModal({ open, settings, onSave, onClose }: LlmConfigModalProps) {
  const [draft, setDraft] = useState<LlmSettings>(settings);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="llm-title">
      <div className="modal-panel" style={{ maxWidth: 480 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h2 id="llm-title" style={{ fontSize: 18, fontWeight: 600 }}>
            AI 推理引擎设置
          </h2>
          <button type="button" className="util-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginBottom: 16 }}>
          默认使用零 Key 本地语义引擎，离线即可秒级精准拆解；如需联网接入大模型实时增强，可开启下方开关（密钥仅存当前浏览器本地）。
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: 12,
            background: 'var(--bg-canvas)',
            marginBottom: 16,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          <span>启用 OpenAI 兼容 LLM 接口</span>
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: '#111111' }}
          />
        </label>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            opacity: draft.enabled ? 1 : 0.45,
            pointerEvents: draft.enabled ? 'auto' : 'none',
          }}
        >
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 5 }}>
              API Base URL
            </label>
            <input
              className="clean-input"
              value={draft.baseUrl}
              onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
              placeholder="https://api.deepseek.com/v1"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 5 }}>
              Model
            </label>
            <input
              className="clean-input"
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              placeholder="deepseek-chat"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 5 }}>
              API Key
            </label>
            <input
              type="password"
              className="clean-input"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder="sk-..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button type="button" className="btn-outline" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn-black"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
