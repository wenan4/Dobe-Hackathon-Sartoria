import { ArrowUpRight, Clock, Download, FileJson, Printer } from 'lucide-react';
import { useState } from 'react';
import { FABRICS } from '../data/fabrics';
import { PATTERNS } from '../data/patterns';
import { SCENES } from '../data/scenes';
import type { LedgerRecord, LedgerReviewStatus } from '../types/sartoria';
import { buildLedgerCsv, downloadTextFile } from '../utils/exporters';

interface BusinessLedgerProps {
  records: LedgerRecord[];
  onUpdateRecord: (
    id: string,
    patch: { status?: LedgerReviewStatus; specialistNotes?: string },
    auditAction: string
  ) => void;
  onLoadRecordIntoStudio: (record: LedgerRecord) => void;
}

const STATUS_OPTIONS: LedgerReviewStatus[] = [
  'AI草稿',
  '待业务专员复核',
  '待版师/报价终审',
  '已归档',
];

export function BusinessLedger({
  records,
  onUpdateRecord,
  onLoadRecordIntoStudio,
}: BusinessLedgerProps) {
  const [selectedId, setSelectedId] = useState<string>(records[0]?.id ?? '');
  const selected = records.find((r) => r.id === selectedId) ?? records[0];

  const avgMatch =
    records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + r.matchScore, 0) / records.length)
      : 0;
  const totalActions = records.reduce((sum, r) => sum + r.auditLogs.length, 0);

  return (
    <div className="page-wrap">
      <div className="page-head no-print">
        <h1 className="page-h1">定制业务台账</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn-outline" onClick={() => window.print()}>
            <Printer size={14} />
            <span>打印</span>
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              downloadTextFile(
                'Sartoria-AI-台账档案.json',
                JSON.stringify(records, null, 2),
                'application/json;charset=utf-8'
              )
            }
          >
            <FileJson size={14} />
            <span>JSON</span>
          </button>
          <button
            type="button"
            className="btn-black"
            onClick={() =>
              downloadTextFile(
                'Sartoria-AI-定制业务专题台账.csv',
                buildLedgerCsv(records),
                'text/csv;charset=utf-8'
              )
            }
          >
            <Download size={14} />
            <span>导出 CSV 台账</span>
          </button>
        </div>
      </div>

      {/* Minimal 4-KPI Strip */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>归档项目</div>
          <div className="kpi-num">{records.length}</div>
        </div>
        <div className="kpi-card">
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>平均资产契合度</div>
          <div className="kpi-num">{avgMatch}%</div>
        </div>
        <div className="kpi-card">
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>全流程留痕</div>
          <div className="kpi-num">{totalActions}</div>
        </div>
        <div className="kpi-card">
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>合规状态</div>
          <div className="kpi-num" style={{ fontSize: 20, paddingTop: 6, color: 'var(--pass)' }}>
            100% 人工终审
          </div>
        </div>
      </div>

      <div className="ledger-split">
        <section className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="clean-table">
              <thead>
                <tr>
                  <th>项目</th>
                  <th>选配资产</th>
                  <th>契合度</th>
                  <th>复核状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const pat = PATTERNS.find((p) => p.id === rec.config.patternId);
                  const fab = FABRICS.find((f) => f.id === rec.config.fabricId);
                  const scene = SCENES.find((s) => s.id === rec.config.sceneId);
                  const isSel = selected?.id === rec.id;

                  return (
                    <tr
                      key={rec.id}
                      className={`table-row ${isSel ? 'selected' : ''}`}
                      onClick={() => setSelectedId(rec.id)}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.projectName}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>
                          {rec.projectCode} · {rec.clientName}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                        <div>{pat?.code ?? rec.config.patternId}</div>
                        <div style={{ color: 'var(--ink-muted)' }}>
                          {fab?.shortName} · {scene?.shortName}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{rec.matchScore}%</td>
                      <td>
                        <span className="tag-minimal">{rec.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <aside className="surface-card" aria-label="台账详情">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  {selected.projectCode}
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{selected.projectName}</h2>
              </div>
              <button
                type="button"
                className="btn-outline no-print"
                style={{ padding: '6px 11px', fontSize: 12 }}
                onClick={() => onLoadRecordIntoStudio(selected)}
              >
                <span>回选配室</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 5 }}>
                  人工流转状态（不含自动报价/下单）
                </label>
                <select
                  className="clean-select"
                  value={selected.status}
                  onChange={(e) =>
                    onUpdateRecord(
                      selected.id,
                      { status: e.target.value as LedgerReviewStatus },
                      `更新流转状态为「${e.target.value}」`
                    )
                  }
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 5 }}>
                  专员复盘备注
                </label>
                <textarea
                  className="clean-textarea"
                  style={{ minHeight: 84 }}
                  value={selected.specialistNotes}
                  onChange={(e) =>
                    onUpdateRecord(selected.id, { specialistNotes: e.target.value }, '更新专员备注')
                  }
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--ink-muted)',
                    marginBottom: 10,
                  }}
                >
                  <Clock size={13} />
                  <span>动作留痕（{selected.auditLogs.length}）</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    maxHeight: 240,
                    overflowY: 'auto',
                  }}
                >
                  {selected.auditLogs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <div
                        key={log.id}
                        style={{
                          borderLeft: '2px solid var(--border-medium)',
                          paddingLeft: 10,
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <strong>{log.action}</strong>
                          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                            {new Date(log.timestamp).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div style={{ color: 'var(--ink-muted)', fontSize: 11.5, marginTop: 2 }}>
                          {log.detail}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
