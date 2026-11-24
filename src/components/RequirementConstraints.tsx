import { useState } from 'react';
import { constraintPredicatesConflict, describeRequirementValue, isRequirementValue, requirementFields } from '../engine/requirementInterview';
import type { Constraint, DecisionRequirement } from '../types/decisions';
import './RequirementConstraints.css';

const sourceLabels: Record<Constraint['state'], string> = {
  explicit: '用户原话', suggested: '系统建议', unknown: '待确认', confirmed: '人工确认',
};

const groups = [
  { level: 'hard', label: '必须满足', tone: 'dot-pass' },
  { level: 'preference', label: '偏好与建议', tone: 'dot-info' },
  { level: 'pending', label: '待确认', tone: 'dot-caution' },
] as const;

interface ConstraintEditorProps {
  item: Constraint;
  onSave: (item: Constraint) => void;
  onCancel: () => void;
}

function ConstraintEditor({ item, onSave, onCancel }: ConstraintEditorProps) {
  const [level, setLevel] = useState<Constraint['level']>(item.level === 'pending' ? 'hard' : item.level);
  const [op, setOp] = useState(item.op);
  const [selected, setSelected] = useState(item.value === null ? '' : String(item.value));
  const { label, choices } = requirementFields[item.field];
  const value = item.field === 'quantity' ? Number(selected) : choices.find(([choice]) => String(choice) === selected)?.[0];
  const canSave = level === 'pending' || isRequirementValue(item.field, value);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    const concreteValue = level === 'pending' ? null : value ?? null;
    const concreteOp = level === 'pending' ? 'eq' : op;
    const keepSource = item.value === concreteValue && item.op === concreteOp && item.level === level;
    onSave({
      ...item, value: concreteValue, op: concreteOp, level,
      state: level === 'pending' ? 'unknown' : 'confirmed',
      blocking: level === 'pending' && (item.level === 'hard' || item.blocking) ? true : undefined,
      sourceTurnId: keepSource ? item.sourceTurnId : null,
      quote: keepSource ? item.quote : null,
      verifiedBy: level === 'pending' ? null : '业务顾问',
      reason: level === 'pending' ? '业务顾问将该字段设为待确认。' : null,
      withdraws: undefined,
    });
  }

  return (
    <form className="constraint-editor" aria-label={`编辑${label}`} onSubmit={submit}>
      <label>
        约束级别
        <select className="clean-select" aria-label="约束级别" value={level} onChange={(event) => setLevel(event.target.value as Constraint['level'])}>
          {groups.map((group) => <option key={group.level} value={group.level}>{group.label}</option>)}
        </select>
      </label>
      {level !== 'pending' && (
        <>
          <label>
            取值方式
            <select className="clean-select" aria-label="取值方式" value={op} onChange={(event) => setOp(event.target.value as Constraint['op'])}>
              <option value="eq">指定</option>
              <option value="neq">排除</option>
            </select>
          </label>
          <label>
            {label}
            {item.field === 'quantity' ? (
              <input className="clean-input" aria-label={label} type="number" min="1" step="1" value={selected} onChange={(event) => setSelected(event.target.value)} />
            ) : (
              <select className="clean-select" aria-label={label} value={selected} onChange={(event) => setSelected(event.target.value)}>
                <option value="">选择{label}</option>
                {choices.map(([choice, choiceLabel]) => <option key={String(choice)} value={String(choice)}>{choiceLabel}</option>)}
              </select>
            )}
          </label>
        </>
      )}
      <div className="constraint-actions">
        <button type="submit" className="btn-black" disabled={!canSave}>{level === 'pending' ? '标为待确认' : '确认并保存'}</button>
        <button type="button" className="btn-outline" onClick={onCancel}>取消</button>
      </div>
    </form>
  );
}

interface RequirementConstraintsProps {
  requirement: DecisionRequirement;
  onEdit?: (constraints: Constraint[]) => void;
}

export function RequirementConstraints({ requirement, onEdit }: RequirementConstraintsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { constraints, questions, turns } = requirement;

  function save(item: Constraint) {
    if (!onEdit) return;
    onEdit(constraints.flatMap((constraint) => {
      if (constraint.id === item.id) return [item];
      if (constraint.field === item.field && (
        item.state === 'unknown' || constraint.state === 'unknown' ||
        constraintPredicatesConflict(constraint, item) ||
        constraint.value === item.value
      )) return [];
      return [constraint];
    }));
    setEditingId(null);
  }

  return (
    <section className="surface-card constraint-panel" aria-labelledby="requirement-constraints-heading">
      <header className="constraint-header">
        <h2 id="requirement-constraints-heading">需求约束</h2>
        <span className="meta-badge">{requirement.mode === 'local_rules' ? '本地规则 · 人工确认' : '结构化来源已校验'}</span>
      </header>
      {questions.length > 0 && (
        <div className="constraint-questions">
          <h3>优先追问</h3>
          <ul>{questions.map(({ field, question }) => <li key={field}>{question}</li>)}</ul>
        </div>
      )}
      <div className="constraint-groups">
        {groups.map(({ level, label, tone }) => {
          const items = constraints.filter((item) => item.level === level);
          return (
            <section key={level} className="constraint-group" aria-label={label}>
              <h3><span className={`status-dot ${tone}`} />{label}</h3>
              {items.length === 0 && <p className="constraint-note">暂无</p>}
              {items.map((item) => {
                const fieldLabel = requirementFields[item.field].label;
                const quoteTurn = item.quote && turns.find((turn) => turn.id === item.sourceTurnId);
                return (
                  <article key={item.id} className="constraint-item">
                    <div className="constraint-item-head">
                      <span>{fieldLabel}</span>
                      {onEdit && editingId !== item.id && (
                        <button type="button" className="btn-outline" aria-label={`编辑${fieldLabel}`} onClick={() => setEditingId(item.id)}>编辑</button>
                      )}
                    </div>
                    <p className="constraint-value">{item.op === 'neq' ? '排除 · ' : ''}{describeRequirementValue(item.field, item.value)}</p>
                    <p className="constraint-note">{sourceLabels[item.state]}{item.reason && ` · ${item.reason}`}</p>
                    {quoteTurn && (
                      <details className="constraint-quote">
                        <summary>查看原话</summary>
                        <blockquote>「{item.quote}」</blockquote>
                        {quoteTurn.text.trim() !== item.quote && <p>原始记录：{quoteTurn.text}</p>}
                      </details>
                    )}
                    {editingId === item.id && onEdit && <ConstraintEditor key={item.id} item={item} onSave={save} onCancel={() => setEditingId(null)} />}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </section>
  );
}
