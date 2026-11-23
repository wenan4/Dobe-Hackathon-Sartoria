import { ArrowLeft, ArrowUpRight, ChevronDown, Download, Search } from 'lucide-react';
import { useState } from 'react';
import { ASSET_SOURCE_LABELS, DECISION_CATALOG, SIMULATED_CARE_LABELS } from '../data/decisionCatalog';
import { FABRICS } from '../data/fabrics';
import { STYLE_PACKS } from '../data/stylePacks';
import type { AssetSource } from '../types/decisions';
import type { StylePackId } from '../types/sartoria';
import { buildAssetCatalogCsv, downloadTextFile } from '../utils/exporters';

type AssetTab = 'patterns' | 'fabrics' | 'crafts' | 'cases';

const activeFabricIds = new Set(DECISION_CATALOG.fabrics.map(({ asset }) => asset.id));
const visualFabrics = FABRICS.filter((fabric) => !activeFabricIds.has(fabric.id));
const catalogCount = Object.values(DECISION_CATALOG).reduce((sum, items) => sum + items.length, 0);

function AssetProvenance({ source, references = [] }: { source: AssetSource; references?: readonly AssetSource[] }) {
  return (
    <details className="disclosure" style={{ marginTop: 4, paddingTop: 8 }}>
      <summary>
        <span>模拟记录 · {ASSET_SOURCE_LABELS[source.kind]}</span>
        <ChevronDown size={13} />
      </summary>
      <div style={{ fontSize: 12.5, color: 'var(--ink-secondary)', marginTop: 8, overflowWrap: 'anywhere' }}>
        <div>{source.reference}</div>
        {references.map((reference) => {
          const link = reference.reference.match(/^(.*?)\s+(https:\/\/\S+)$/);
          return (
            <div key={reference.reference} style={{ marginTop: 4 }}>
              {ASSET_SOURCE_LABELS[reference.kind]} · {link
                ? <a href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a> : reference.reference}
            </div>
          );
        })}
      </div>
    </details>
  );
}

interface AssetKnowledgeBaseProps {
  activeStylePackId: StylePackId;
  onChangeStylePack: (id: StylePackId) => void;
  onBackToFlow: () => void;
  onTryPatternInStudio: (patternId: string) => void;
  onTryFabricInStudio: (fabricId: string) => void;
  onTryCraftInStudio: (craftId: string) => void;
  onTryCaseInStudio: (caseId: string) => void;
}

export function AssetKnowledgeBase({
  activeStylePackId,
  onChangeStylePack,
  onBackToFlow,
  onTryPatternInStudio,
  onTryFabricInStudio,
  onTryCraftInStudio,
  onTryCaseInStudio,
}: AssetKnowledgeBaseProps) {
  const [assetTab, setAssetTab] = useState<AssetTab>('patterns');
  const [query, setQuery] = useState('');
  const [packFilter, setPackFilter] = useState<'all' | StylePackId>('all');

  const q = query.trim().toLowerCase();
  function visible(asset: { id: string; code: string; stylePackId: StylePackId; styleTags: string[] }, ...terms: string[]) {
    return (packFilter === 'all' || asset.stylePackId === packFilter)
      && [asset.id, asset.code, ...asset.styleTags, ...terms].join(' ').toLowerCase().includes(q);
  }
  const filteredPatterns = DECISION_CATALOG.patterns.filter(({ asset, source }) =>
    visible(asset, asset.name, asset.shortSpec, asset.silhouette, ASSET_SOURCE_LABELS[source.kind], source.reference));
  const filteredFabrics = DECISION_CATALOG.fabrics.filter(({ asset, profile, source }) =>
    visible(asset, asset.name, asset.composition, asset.weave, asset.careAndMoqNote, ASSET_SOURCE_LABELS[source.kind], source.reference,
      ...(profile.publicReferences ?? []).map((reference) => `${ASSET_SOURCE_LABELS[reference.kind]} ${reference.reference}`)));
  const filteredCrafts = DECISION_CATALOG.crafts.filter(({ asset, source }) =>
    visible(asset, asset.name, asset.heritageLevel, asset.placement, ASSET_SOURCE_LABELS[source.kind], source.reference));
  const filteredCases = DECISION_CATALOG.cases.filter(({ asset, source }) =>
    visible(asset, asset.title, asset.clientProfile, ASSET_SOURCE_LABELS[source.kind], source.reference));
  const filteredVisualFabrics = visualFabrics.filter((asset) => visible(asset, asset.name, asset.composition, asset.weave));
  const searchCount = {
    patterns: filteredPatterns.length, fabrics: filteredFabrics.length + filteredVisualFabrics.length,
    crafts: filteredCrafts.length, cases: filteredCases.length,
  }[assetTab];

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 className="page-h1">定制资产库</h1>
          <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{catalogCount} 条模拟目录记录</span>
          <button type="button" className="btn-text" onClick={onBackToFlow}>
            <ArrowLeft size={14} />
            <span>返回当前流程</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="clean-select"
            style={{ width: 200, padding: '8px 12px', fontSize: 13 }}
            value={activeStylePackId}
            onChange={(e) => {
              const id = e.target.value as StylePackId;
              onChangeStylePack(id);
              setPackFilter(id === 'shanghai-haipai' ? 'all' : id);
            }}
            aria-label="企业风格包切换"
          >
            {STYLE_PACKS.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              downloadTextFile(
                'Sartoria-AI-定制资源分类清单.csv',
                buildAssetCatalogCsv(),
                'text/csv;charset=utf-8'
              )
            }
          >
            <Download size={14} />
            <span>导出清单</span>
          </button>
        </div>
      </div>

      {searchCount === 0 && <p role="status">当前分类没有符合条件的资产。</p>}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 22,
        }}
      >
        <div className="segmented segmented-solid">
          {(
            [
              { id: 'patterns', label: `版型 (${DECISION_CATALOG.patterns.length})` },
              { id: 'fabrics', label: `面料 (${DECISION_CATALOG.fabrics.length})` },
              { id: 'crafts', label: `工艺 (${DECISION_CATALOG.crafts.length})` },
              { id: 'cases', label: `案例 (${DECISION_CATALOG.cases.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`seg-btn ${assetTab === t.id ? 'active' : ''}`}
              onClick={() => setAssetTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            color="#76767c"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="clean-input"
            style={{ paddingLeft: 34, width: 240, borderRadius: 999, paddingTop: 8, paddingBottom: 8 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索编号、资产或来源…"
            aria-label="搜索定制资产"
          />
        </div>
      </div>

      {assetTab === 'patterns' && (
        <div className="clean-grid">
          {filteredPatterns.map(({ asset: pat, profile, source }) => (
            <div key={pat.id} className="asset-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-muted)' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{pat.code}</span>
                <span>{pat.category}</span>
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 600 }}>{pat.name}</h3>
              <div style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{pat.shortSpec}</div>

              <details className="disclosure" style={{ marginTop: 4, paddingTop: 8 }}>
                <summary>
                  <span>版型参数</span>
                  <ChevronDown size={13} />
                </summary>
                <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.6 }}>
                  <div>结构：{pat.silhouette}</div>
                  <div>领型：{pat.collarType}</div>
                  <div>余量：{pat.easeAllowance}</div>
                  <div>模拟套数：{profile.quantity.join('–')} 套</div>
                </div>
              </details>
              <AssetProvenance source={source} />

              <button
                type="button"
                className="btn-outline"
                style={{ marginTop: 'auto', width: '100%' }}
                onClick={() => onTryPatternInStudio(pat.id)}
              >
                <span>在选配室试用</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {assetTab === 'fabrics' && (
        <div className="clean-grid">
          {filteredFabrics.map(({ asset: fab, profile, source }) => (
            <div key={fab.id} className="asset-card">
              <div
                style={{
                  height: 64,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${fab.pbr.baseColor}, ${fab.pbr.accentColor} 60%, ${fab.pbr.sheenColor})`,
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-muted)' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{fab.code}</span>
                <span>
                  {fab.gsm}g/m² · {fab.drape}
                </span>
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 600 }}>{fab.name}</h3>
              <div style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{fab.composition}</div>

              <details className="disclosure" style={{ marginTop: 4, paddingTop: 8 }}>
                <summary>
                  <span>护理说明</span>
                  <ChevronDown size={13} />
                </summary>
                <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.55 }}>
                  模拟洗护：{profile.care ? SIMULATED_CARE_LABELS[profile.care] : '待核'} · 耐皱：{profile.wrinkleResistance === undefined ? '待核' : profile.wrinkleResistance ? '耐皱' : '易皱'}
                  <br />
                  {fab.careAndMoqNote}
                </p>
              </details>
              <AssetProvenance source={source} references={profile.publicReferences} />

              <button
                type="button"
                className="btn-outline"
                style={{ marginTop: 'auto', width: '100%' }}
                onClick={() => onTryFabricInStudio(fab.id)}
              >
                <span>在 3D 面料室查看</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {assetTab === 'fabrics' && filteredVisualFabrics.length > 0 && (
        <details className="disclosure" style={{ marginTop: 18, paddingTop: 10 }}>
          <summary>
            <span>旧版视觉参考（{filteredVisualFabrics.length}）</span>
            <ChevronDown size={13} />
          </summary>
          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '8px 0 12px' }}>
            历史配色展示。补录决策属性后可纳入组合匹配。
          </p>
          <div className="clean-grid">
            {filteredVisualFabrics.map((fabric) => (
              <div key={fabric.id} className="asset-card">
                <div style={{ height: 44, borderRadius: 8, background: `linear-gradient(135deg, ${fabric.pbr.baseColor}, ${fabric.pbr.sheenColor})` }} />
                <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{fabric.code}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{fabric.name}</h3>
              </div>
            ))}
          </div>
        </details>
      )}

      {assetTab === 'crafts' && (
        <div className="clean-grid">
          {filteredCrafts.map(({ asset: craft, source }) => (
            <div key={craft.id} className="asset-card">
              <img
                src={craft.closeupImage}
                alt={craft.name}
                style={{ width: '100%', height: 136, objectFit: 'cover', borderRadius: 10 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-muted)' }}>
                <span>{craft.code} · {craft.heritageLevel}</span>
                <span>+{craft.extraLeadDays} 工作日</span>
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 600 }}>{craft.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
                {craft.highlightCopy}
              </p>
              <AssetProvenance source={source} />
              <button
                type="button"
                className="btn-outline"
                style={{ marginTop: 'auto', width: '100%' }}
                onClick={() => onTryCraftInStudio(craft.id)}
              >
                <span>叠加到方案</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {assetTab === 'cases' && (
        <div className="clean-grid">
          {filteredCases.map(({ asset: hc, source }) => (
            <div key={hc.id} className="asset-card">
              <img
                src={hc.heroImage}
                alt={hc.title}
                style={{ width: '100%', height: 156, objectFit: 'cover', borderRadius: 10 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-muted)' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{hc.code}</span>
                <span>{hc.referenceCycle}</span>
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 600 }}>{hc.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
                {hc.reviewSummary}
              </p>
              <AssetProvenance source={source} />
              <button
                type="button"
                className="btn-black"
                style={{ marginTop: 'auto', width: '100%' }}
                onClick={() => onTryCaseInStudio(hc.id)}
              >
                <span>复用该案例</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
