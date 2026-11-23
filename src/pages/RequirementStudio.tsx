import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { RadarChartSVG } from '../components/RadarChartSVG';
import { PRESET_DEMO_CASES } from '../data/presetDemos';
import { SCENES } from '../data/scenes';
import type {
  DeconstructedRequirement,
  PresetDemoCase,
  RequirementInput,
} from '../types/sartoria';

interface RequirementStudioProps {
  input: RequirementInput;
  deconstructed: DeconstructedRequirement;
  isDeconstructing: boolean;
  onChangeInput: (next: RequirementInput) => void;
  onSelectPresetDemo: (demo: PresetDemoCase) => void;
  onRunDeconstruct: () => void;
  onProceedToConfigurator: () => void;
}

export function RequirementStudio({
  input,
  deconstructed,
  isDeconstructing,
  onChangeInput,
  onSelectPresetDemo,
  onRunDeconstruct,
  onProceedToConfigurator,
}: RequirementStudioProps) {
  const [outputTab, setOutputTab] = useState<'official8' | 'radar6'>('official8');

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-h1">定制需求拆解</h1>
        <button type="button" className="btn-black" onClick={onProceedToConfigurator}>
          <span>进入场景选配</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Quick Case Selector Pills — Official 4 Cases + Corporate & Evening */}
      <div className="case-chip-row" role="group" aria-label="快速体验案例">
        {PRESET_DEMO_CASES.map((demo) => (
          <button
            key={demo.id}
            type="button"
            className={`case-pill ${input.presetDemoId === demo.id ? 'active' : ''}`}
            onClick={() => onSelectPresetDemo(demo)}
          >
            {demo.shortLabel}
          </button>
        ))}
      </div>

      <div className="deconstruct-grid">
        {/* Left: Ultra-clean Natural Language Input */}
        <section className="surface-card" aria-label="客户需求录入">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>客户原始需求</h2>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>支持自然语言直接输入</span>
          </div>

          <textarea
            id="req-narrative"
            className="clean-textarea"
            style={{ minHeight: 156, fontSize: 14 }}
            value={input.rawNarrative}
            onChange={(e) =>
              onChangeInput({ ...input, rawNarrative: e.target.value, presetDemoId: undefined })
            }
            placeholder="例如：想要定制一件中式正式外套，脖子短领子不能太高，有肚腩希望宽松舒服一些..."
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              {deconstructed.engineUsed === 'llm_api' ? 'LLM 增强模式' : '本地领域语义实时解析'}
            </span>
            <button
              type="button"
              className="btn-black"
              disabled={isDeconstructing || !input.rawNarrative.trim()}
              onClick={onRunDeconstruct}
            >
              <Sparkles size={14} />
              <span>{isDeconstructing ? '拆解中…' : '智能拆解需求'}</span>
            </button>
          </div>

          {/* Progressive Disclosure: Optional Context & Project Fields */}
          <details className="disclosure">
            <summary>
              <span>补充项目信息与场景（可选）</span>
              <ChevronDown size={14} />
            </summary>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--ink-muted)', display: 'block', marginBottom: 4 }}>
                    项目名称
                  </label>
                  <input
                    className="clean-input"
                    value={input.projectName}
                    onChange={(e) =>
                      onChangeInput({ ...input, projectName: e.target.value, presetDemoId: undefined })
                    }
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--ink-muted)', display: 'block', marginBottom: 4 }}>
                    客户称呼
                  </label>
                  <input
                    className="clean-input"
                    value={input.clientName}
                    onChange={(e) =>
                      onChangeInput({ ...input, clientName: e.target.value, presetDemoId: undefined })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--ink-muted)', display: 'block', marginBottom: 4 }}>
                    业务类型
                  </label>
                  <select
                    className="clean-select"
                    value={input.businessType}
                    onChange={(e) =>
                      onChangeInput({
                        ...input,
                        businessType: e.target.value as RequirementInput['businessType'],
                        presetDemoId: undefined,
                      })
                    }
                  >
                    <option value="private_couture">个人高级定制</option>
                    <option value="corporate_uniform">团体职业服</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--ink-muted)', display: 'block', marginBottom: 4 }}>
                    主穿季候
                  </label>
                  <select
                    className="clean-select"
                    value={input.season}
                    onChange={(e) =>
                      onChangeInput({
                        ...input,
                        season: e.target.value as RequirementInput['season'],
                        presetDemoId: undefined,
                      })
                    }
                  >
                    <option value="spring">春季</option>
                    <option value="summer">夏季</option>
                    <option value="autumn">秋季</option>
                    <option value="winter">冬季</option>
                    <option value="all_season">四季通用</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--ink-muted)', display: 'block', marginBottom: 4 }}>
                    穿搭场景
                  </label>
                  <select
                    className="clean-select"
                    value={input.targetSceneId}
                    onChange={(e) =>
                      onChangeInput({ ...input, targetSceneId: e.target.value })
                    }
                  >
                    {SCENES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </details>
        </section>

        {/* Right: Clean Structured Translation Card (Official 8-Spec + 6-Dimension Toggle) */}
        <section className="surface-card" aria-label="专业语言转化结果">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>专业语言转化</h2>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                {deconstructed.aestheticArchetype}
              </div>
            </div>

            <div className="segmented segmented-solid" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={outputTab === 'official8'}
                className={`seg-btn ${outputTab === 'official8' ? 'active' : ''}`}
                onClick={() => setOutputTab('official8')}
              >
                8 项专业拆解
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={outputTab === 'radar6'}
                className={`seg-btn ${outputTab === 'radar6' ? 'active' : ''}`}
                onClick={() => setOutputTab('radar6')}
              >
                6 维情绪雷达
              </button>
            </div>
          </div>

          {outputTab === 'official8' ? (
            <>
              <div className="spec-8-grid">
                {deconstructed.officialSpecs.map((item) => (
                  <div key={item.key} className="spec-cell">
                    <div className="spec-cell-head">
                      <span className="spec-label">【{item.label}】</span>
                      {item.ergonomicCue && <span className="spec-cue">{item.ergonomicCue}</span>}
                    </div>
                    <div className="spec-value">{item.value}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 18,
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {deconstructed.emotionTags.slice(0, 4).map((tag) => (
                    <span key={tag} className="tag-minimal">
                      {tag}
                    </span>
                  ))}
                </div>
                <button type="button" className="btn-outline" onClick={onProceedToConfigurator}>
                  <span>带入选配预览</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <RadarChartSVG dimensions={deconstructed.dimensions} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{deconstructed.aestheticArchetype}</div>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
                    {deconstructed.targetAudienceInsight}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {deconstructed.emotionTags.map((tag) => (
                      <span key={tag} className="tag-minimal">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="spec-8-grid">
                {deconstructed.dimensions.map((d) => (
                  <div key={d.key} className="spec-cell">
                    <div className="spec-cell-head">
                      <span className="spec-label">{d.label}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                        {d.score}
                      </span>
                    </div>
                    <div className="spec-value" style={{ fontSize: 12.5 }}>
                      {d.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
