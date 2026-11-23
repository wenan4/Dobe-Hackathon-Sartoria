import { X } from 'lucide-react';
import { AGENT_BOUNDARY_MATRIX } from '../data/boundaryList';

interface BoundaryModalProps {
  open: boolean;
  onClose: () => void;
}

export function BoundaryModal({ open, onClose }: BoundaryModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="boundary-title">
      <div className="modal-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 id="boundary-title" style={{ fontSize: 19, fontWeight: 600 }}>
            《Agent 能力边界清单》与合规说明
          </h2>
          <button type="button" className="util-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div className="feas-bar feas-pass">
            <span className="status-dot dot-pass" />
            <span>100% 静态模拟数据，不对接任何生产系统或真实业务 API。</span>
          </div>
          <div className="feas-bar feas-caution">
            <span className="status-dot dot-caution" />
            <span>仅输出企划草稿，终审、报价、定版与下单全由人工完成。</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="clean-table">
            <thead>
              <tr>
                <th style={{ width: '16%' }}>业务环节</th>
                <th style={{ width: '32%' }}>Agent 辅助范围</th>
                <th style={{ width: '32%' }}>严禁越界事项</th>
                <th style={{ width: '20%' }}>人工责任岗</th>
              </tr>
            </thead>
            <tbody>
              {AGENT_BOUNDARY_MATRIX.map((row) => (
                <tr key={row.domain}>
                  <td style={{ fontWeight: 600 }}>{row.domain}</td>
                  <td style={{ color: 'var(--ink-secondary)' }}>{row.agentCanDo}</td>
                  <td style={{ color: 'var(--risk)' }}>{row.agentMustNotDo}</td>
                  <td style={{ color: 'var(--ink-muted)' }}>{row.humanOwner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn-black" onClick={onClose}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
