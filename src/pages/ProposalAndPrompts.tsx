import { Archive, Check, ChevronDown, Copy, Download, Printer } from 'lucide-react';
import { useState } from 'react';
import type { ProposalDraft, PromptToolFormat, VisualPromptPack } from '../types/sartoria';
import { buildPromptPackMarkdown, downloadTextFile } from '../utils/exporters';

interface ProposalAndPromptsProps {
  proposal: ProposalDraft;
  promptPack: VisualPromptPack;
  heroPreviewImage: string;
  craftPreviewImage: string;
  onSaveToLedger: () => void;
  onOpenLedger: () => void;
}

const FORMAT_LABELS: Record<PromptToolFormat, string> = {
  midjourney: 'Midjourney',
  flux_sd: 'Flux / SD',
  jimeng_cn: '即梦中文',
};

export function ProposalAndPrompts({
  proposal,
  promptPack,
  heroPreviewImage,
  craftPreviewImage,
  onSaveToLedger,
  onOpenLedger,
}: ProposalAndPromptsProps) {
  const [toolFormat, setToolFormat] = useState<PromptToolFormat>('midjourney');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="page-wrap">
      <div className="page-head no-print">
        <h1 className="page-h1">方案初稿与视觉提示词</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn-outline" onClick={() => window.print()}>
            <Printer size={14} />
            <span>打印 / PDF</span>
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              onSaveToLedger();
              setSavedToast(true);
              window.setTimeout(() => setSavedToast(false), 2000);
            }}
          >
            <Archive size={14} />
            <span>{savedToast ? '已归档 ✓' : '写入台账'}</span>
          </button>
          <button type="button" className="btn-black" onClick={onOpenLedger}>
            查看业务台账
          </button>
        </div>
      </div>

      <div className="proposal-grid">
        {/* Left: Clean Editorial Proposal Sheet */}
        <article className="dossier-sheet" aria-label="海派定制整体方案初稿">
          <div className="dossier-top">
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 21, fontWeight: 600 }}>
                {proposal.projectName}
              </h2>
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 4 }}>
                {proposal.clientName} · {proposal.id}
              </div>
            </div>
            <span className="tag-minimal" style={{ fontWeight: 500 }}>
              AI 辅助初稿 · 人工终审
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.35fr 1fr',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <img
              src={heroPreviewImage}
              alt="方案场景意向"
              style={{ width: '100%', height: 192, objectFit: 'cover', borderRadius: 10 }}
            />
            <img
              src={craftPreviewImage}
              alt="工艺细节意向"
              style={{ width: '100%', height: 192, objectFit: 'cover', borderRadius: 10 }}
            />
          </div>

          {/* Official 8-Field Structured Tailoring Sheet */}
          <section className="dossier-sec">
            <h3 className="dossier-sec-h3">专业定制参数转化清单</h3>
            <div className="spec-8-grid">
              {proposal.officialSpecs.map((spec) => (
                <div key={spec.key} className="spec-cell" style={{ padding: '11px 13px' }}>
                  <span className="spec-label">【{spec.label}】</span>
                  <span className="spec-value" style={{ fontSize: 12.5 }}>
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="dossier-sec">
            <h3 className="dossier-sec-h3">核心设计亮点</h3>
            <ul
              style={{
                margin: '0 0 12px 18px',
                padding: 0,
                fontSize: 13,
                color: 'var(--ink-secondary)',
                lineHeight: 1.75,
              }}
            >
              {proposal.designHighlights.map((hl) => (
                <li key={hl}>{hl}</li>
              ))}
            </ul>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{proposal.estimatedLeadTimeNote}</div>
          </section>

          {/* Progressive Disclosure: Full Feasibility & Human Review Checklist */}
          <details className="disclosure" open>
            <summary>
              <span>可行性提示与人工终审清单</span>
              <ChevronDown size={14} />
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {proposal.feasibilityNotices.map((n) => (
                <div key={n.id} className={`feas-bar feas-${n.level}`}>
                  <span className={`status-dot dot-${n.level}`} />
                  <span>
                    <strong>{n.title}：</strong>
                    {n.detail}
                  </span>
                </div>
              ))}
              <ol
                style={{
                  margin: '8px 0 0 18px',
                  padding: 0,
                  fontSize: 12.5,
                  color: 'var(--ink-secondary)',
                  lineHeight: 1.7,
                }}
              >
                {proposal.humanReviewChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          </details>

          <div
            style={{
              marginTop: 22,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--bg-canvas)',
              fontSize: 12,
              color: 'var(--ink-muted)',
              lineHeight: 1.6,
            }}
          >
            {proposal.boundaryDisclaimer}
          </div>
        </article>

        {/* Right: Clean 3-Shot AI Visual Prompt Pack */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="surface-card" style={{ padding: '18px 20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div className="segmented segmented-solid no-print">
                {(Object.keys(FORMAT_LABELS) as PromptToolFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={`seg-btn ${toolFormat === fmt ? 'active' : ''}`}
                    onClick={() => setToolFormat(fmt)}
                  >
                    {FORMAT_LABELS[fmt]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn-outline no-print"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() =>
                  downloadTextFile(
                    `${proposal.projectName}-视觉提示词包.md`,
                    buildPromptPackMarkdown(promptPack),
                    'text/markdown;charset=utf-8'
                  )
                }
              >
                <Download size={13} />
                <span>导出 Markdown</span>
              </button>
            </div>
          </div>

          {promptPack.shots.map((shot) => {
            const activePrompt = shot.prompts[toolFormat];
            const copyKey = `${shot.shotType}-${toolFormat}`;
            return (
              <div key={shot.shotType} className="surface-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{shot.shotTitle}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                      {shot.aspectRatio} · {shot.lightingSpec}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-outline no-print"
                    style={{ padding: '5px 11px', fontSize: 12 }}
                    onClick={() => handleCopy(copyKey, activePrompt)}
                  >
                    {copiedId === copyKey ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === copyKey ? '已复制' : '复制'}</span>
                  </button>
                </div>

                <div className="prompt-box">{activePrompt}</div>

                <details className="disclosure" style={{ marginTop: 10, paddingTop: 8 }}>
                  <summary>
                    <span>镜头参数与负向提示词</span>
                    <ChevronDown size={13} />
                  </summary>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 6, lineHeight: 1.55 }}>
                    <div>镜头：{shot.cameraSpec}</div>
                    <div style={{ marginTop: 3 }}>Negative：{shot.negativePrompt}</div>
                  </div>
                </details>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
