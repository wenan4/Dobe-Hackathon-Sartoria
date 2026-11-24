import type {
  CandidateCombination,
  Constraint,
  ConstraintChange,
  ConstraintField,
  DecisionHistory,
  DecisionRequirement,
  MatchResult,
  RequirementTurn,
  Revision,
  RevisionImpact,
  RevisionOption,
  Version,
} from '../types/decisions';
import type { RequirementInput } from '../types/sartoria';
import { evaluateDecisionConfiguration, matchDecision } from './decisionMatching';
import {
  buildClarificationQuestions, buildLocalDecisionRequirement, constraintPredicatesConflict as conflictsWith,
  extractRevisionConstraints, isExplicitWithdrawal,
} from './requirementInterview';

export interface RevisionConflict {
  field: ConstraintField;
  detail: string;
}

export interface RevisionBranch {
  option: RevisionOption;
  requirement: DecisionRequirement;
  match: MatchResult;
  candidate: CandidateCombination | null;
  changes: ConstraintChange[];
  impacts: RevisionImpact[];
  canConfirm: boolean;
}

export interface RevisionPreview {
  id: string;
  baseVersionId: string;
  turn: RequirementTurn;
  requestedPatch: ConstraintChange[];
  conflicts: RevisionConflict[];
  branches: RevisionBranch[];
}

export function emptyDecisionHistory(): DecisionHistory {
  return { versions: [], rejectedRevisions: [], feedbackDraft: '' };
}

export function findConstraintChanges(previous: Constraint[], next: Constraint[]): ConstraintChange[] {
  const fields = new Set([...previous, ...next].map((constraint) => constraint.field));
  return [...fields].flatMap((field) => {
    const before = previous.filter((constraint) => constraint.field === field);
    const after = next.filter((constraint) => constraint.field === field);
    const removed = before.filter((item) => !after.some((entry) => sameMeaning(item, entry)));
    const added = after.filter((item) => !before.some((entry) => sameMeaning(item, entry)));
    return Array.from({ length: Math.max(removed.length, added.length) }, (_, index) => ({
      field,
      previous: removed[index] ?? null,
      next: added[index] ?? null,
    }));
  });
}

function sameMeaning(a: Constraint, b: Constraint): boolean {
  return a.field === b.field && a.op === b.op && a.value === b.value && a.level === b.level && a.state === b.state;
}

function targetsWithdrawal(withdrawal: Constraint, existing: Constraint): boolean {
  const target = withdrawal.withdraws;
  return withdrawal.field === existing.field && existing.value !== null &&
    (!target || target.op === existing.op && target.value === existing.value);
}

export function refreshDecisionRequirement(input: RequirementInput, previous?: DecisionRequirement): DecisionRequirement {
  const fresh = buildLocalDecisionRequirement(input);
  if (!previous) return fresh;
  if (previous.input.rawNarrative === input.rawNarrative) {
    // A repeat interview may refresh form defaults, but the accepted multi-turn contract is authoritative.
    const formFields: [keyof RequirementInput, ConstraintField][] = [
      ['businessType', 'businessType'], ['season', 'season'], ['groupSize', 'quantity'], ['targetSceneId', 'scene'],
    ];
    const refresh = new Set(formFields.filter(([key, field]) => input[key] !== previous.input[key] &&
      !previous.constraints.some((item) => item.field === field && (item.sourceTurnId || item.verifiedBy))
    ).map(([, field]) => field));
    if (!refresh.size) return { ...previous, input };
    const constraints = [...previous.constraints.filter((item) => !refresh.has(item.field)),
      ...fresh.constraints.filter((item) => refresh.has(item.field))];
    return { ...fresh, turns: previous.turns, constraints, questions: buildClarificationQuestions(constraints) };
  }
  const confirmed = previous.constraints.filter((item) => item.state === 'confirmed');
  if (!confirmed.length) return fresh;
  const turn = { id: crypto.randomUUID(), text: input.rawNarrative };
  const constraints = [...confirmed];
  for (const item of fresh.constraints) {
    const manual = confirmed.filter((prior) => prior.field === item.field);
    if (manual.length && (item.state === 'suggested' || item.value === null && !item.blocking ||
        manual.some((prior) => prior.op === item.op && prior.value === item.value))) continue;
    const next = item.sourceTurnId ? { ...item, id: `${turn.id}:${item.id}`, sourceTurnId: turn.id } : item;
    constraints.push(next);
    if (manual.some((prior) => conflictsWith(prior, next))) {
      constraints.push({ ...next, id: `${next.id}:review`, value: null, state: 'unknown', level: 'pending',
        reason: '新简报与已人工确认的条件有分歧，请复核。', blocking: true });
    }
  }
  return { ...fresh, turns: [...previous.turns, turn], constraints, questions: buildClarificationQuestions(constraints) };
}

function applyPatch(constraints: Constraint[], requested: Constraint[], verifiedBy: string): Constraint[] {
  return requested.reduce((current, next) => {
    if (isExplicitWithdrawal(next)) {
      if (!current.some((item) => targetsWithdrawal(next, item))) return current;
      return [...current.filter((item) => !targetsWithdrawal(next, item) &&
        (next.field !== item.field || item.value !== null)), next];
    }
    const unchanged = current.some((item) => item.state !== 'suggested' && item.field === next.field && item.op === next.op &&
      item.value === next.value && (item.level === next.level || item.level === 'hard'));
    if (unchanged) return current;
    const retained = current.filter((item) => {
      if (item.field !== next.field) return true;
      if (next.value === null || item.value === null) return false;
      return !conflictsWith(item, next) && (item.op !== next.op || item.value !== next.value);
    });
    return [...retained, next.value === null
      ? next
      : { ...next, state: 'confirmed' as const, verifiedBy }];
  }, constraints);
}

function previewImpacts(base: CandidateCombination | null, next: CandidateCombination | null, changes: ConstraintChange[]): RevisionImpact[] {
  const impacts: RevisionImpact[] = [];
  if (changes.length > 0) impacts.push({ area: 'requirements', detail: `${changes.length} 项需求条件发生变化，其余条件沿用原版本。` });
  if (!next) return [...impacts, { area: 'requirements', detail: '当前目录没有通过硬筛的组合，需复核冲突或补充证据。' }];
  if (!base || base.config.patternId !== next.config.patternId) {
    impacts.push({ area: 'pattern', detail: '更新版型依据，版师需重新复核结构和活动余量。' });
  }
  const fabricChanged = !base || base.config.fabricId !== next.config.fabricId;
  const craftChanged = !base || base.config.craftIds.join('|') !== next.config.craftIds.join('|');
  if (fabricChanged) impacts.push({ area: 'fabric', detail: '面料变化，重新核对体感、光泽与织法证据。' });
  if (craftChanged || fabricChanged) {
    impacts.push({ area: 'craft', detail: craftChanged ? '根据新面料重选兼容工艺。' : '已用新面料复核现有工艺的兼容性。' });
    impacts.push({ area: 'care', detail: '复核面料和工艺的静态洗护字段，正式洗护仍须实物测试。' });
  }
  if (!base || base.id !== next.id) impacts.push({ area: 'visual', detail: '三镜头提示词同步更新受影响的结构、材质或工艺表述。' });
  return impacts;
}

function chooseCandidate(base: Version, requirement: DecisionRequirement, match: MatchResult, changes: ConstraintChange[]): CandidateCombination | null {
  if (!base.candidate || !match.recommended) return match.recommended;
  if (changes.length === 0) return base.candidate;
  const original = base.candidate.config;
  if (!changes.some(({ previous, next }) => previous?.level === 'preference' || next?.level === 'preference')) {
    const retained = evaluateDecisionConfiguration(requirement, original);
    if (retained.status === 'eligible') return retained;
  }
  const recommended = match.recommended.config;
  const preservePattern = !changes.some(({ field }) => ['category', 'patternStructure', 'collar', 'easeAllowance', 'closure', 'lengthRatio', 'businessType'].includes(field));
  const preserveScene = !changes.some(({ field }) => field === 'scene' || field === 'businessType');
  const combined = evaluateDecisionConfiguration(requirement, {
    ...recommended,
    patternId: preservePattern ? original.patternId : recommended.patternId,
    sceneId: preserveScene ? original.sceneId : recommended.sceneId,
  });
  return combined.status === 'eligible' ? combined : match.recommended;
}

export function previewDecisionRevision(base: Version, text: string): RevisionPreview | null {
  const draft = text.trim();
  if (!draft) return null;
  const id = `${base.id}:rev-${crypto.randomUUID()}`;
  const turn: RequirementTurn = { id, text: draft };
  const constraints = base.requirement.constraints;
  const observations = extractRevisionConstraints(turn);
  const requested = observations.filter((next) => {
    if (next.value === null) return isExplicitWithdrawal(next) || next.blocking ||
      !observations.some((item) => item.field === next.field && item.value !== null);
    return !constraints.some((item) => item.field === next.field && item.op === next.op &&
      item.value === next.value && (item.state === 'confirmed' || item.state === 'explicit') &&
      (item.level === next.level || item.level === 'hard'));
  });
  const requestedPatch = requested.map((next) => ({
    field: next.field,
    previous: constraints.find((item) => isExplicitWithdrawal(next) ? targetsWithdrawal(next, item)
      : item.field === next.field && (conflictsWith(item, next) || item.op === next.op && item.value === next.value)) ??
      constraints.find((item) => item.field === next.field && item.value === null) ?? null,
    next,
  }));
  const blocked = new Set<ConstraintField>();
  const contradictory = new Set<ConstraintField>();
  const conflicts: RevisionConflict[] = [];
  for (const next of requested) {
    if (next.value === null && !isExplicitWithdrawal(next)) {
      contradictory.add(next.field);
      continue;
    }
    const withdrawal = isExplicitWithdrawal(next);
    const existing = constraints.find((item) => item.level === 'hard' &&
      (withdrawal ? targetsWithdrawal(next, item) : conflictsWith(item, next)));
    if (existing) {
      blocked.add(next.field);
      if (!withdrawal) conflicts.push({ field: next.field,
        detail: `现有硬条件「${existing.quote ?? String(existing.value)}」与反馈「${next.quote ?? turn.text}」需要业务员裁决。` });
    }
    if (requested.some((item) => conflictsWith(item, next))) contradictory.add(next.field);
  }
  for (const field of contradictory) conflicts.push({ field, detail: '反馈中的条件存在冲突或表述不确定，请先澄清。' });

  const buildBranch = (option: RevisionOption, accepted: Constraint[]): RevisionBranch => {
    const next = applyPatch(constraints, accepted, '定制业务专员');
    const changes = findConstraintChanges(constraints, next);
    const requirement = {
      ...base.requirement,
      turns: [...base.requirement.turns, turn],
      constraints: next,
      questions: buildClarificationQuestions(next),
    };
    const match = changes.length > 0 ? matchDecision(requirement) : base.match;
    const candidate = chooseCandidate(base, requirement, match, changes);
    const recordsRetention = option === 'keep' && blocked.size > 0 && changes.length === 0;
    const impacts = previewImpacts(base.candidate, candidate, changes);
    if (recordsRetention) impacts.push({ area: 'requirements', detail: candidate
      ? '记录本次反馈，沿用原硬条件和已通过筛选的组合。' : '沿用原硬条件，保留待核状态。' });
    return {
      option, requirement, match, candidate, changes,
      impacts,
      canConfirm: option === 'defer' || (!requested.some((item) => item.blocking) && (changes.length > 0 || recordsRetention)),
    };
  };

  const agreed = requested.filter((item) => !contradictory.has(item.field));
  const keep = buildBranch('keep', agreed.filter((item) => !blocked.has(item.field)));
  const accept = buildBranch('accept', agreed);
  for (const preferredFabric of agreed.filter((item) => item.field === 'fabric' && item.level === 'preference')) {
    const hardTest: DecisionRequirement = {
      ...keep.requirement,
      constraints: keep.requirement.constraints.map((item) => item.id === preferredFabric.id
        ? { ...item, level: 'hard' }
        : item),
    };
    if (matchDecision(hardTest).status === 'no_match') {
      const care = constraints.find((item) => item.field === 'care' && item.level === 'hard');
      conflicts.push({
        field: 'fabric',
        detail: `目前无组合同时满足材质偏好「${preferredFabric.quote ?? String(preferredFabric.value)}」及现有硬条件${care ? `（含${care.quote ?? String(care.value)}）` : ''}。可以继续用通过硬筛的替代面料，或挂起反馈等待实物核验。`,
      });
    }
  }

  return {
    id, baseVersionId: base.id, turn, requestedPatch, conflicts,
    branches: [keep, ...(blocked.size > 0 ? [accept] : []), buildBranch('defer', [])],
  };
}

export function recordDecisionRevision(preview: RevisionPreview, branch: RevisionBranch, savedAt: string): Revision {
  return {
    id: preview.id, baseVersionId: preview.baseVersionId, turn: preview.turn,
    requestedPatch: preview.requestedPatch, impacts: branch.option === 'defer' ? [] : branch.impacts,
    selectedOption: branch.option, humanDecision: branch.option === 'defer' ? 'rejected' : 'confirmed', savedAt,
  };
}

export function appendDecisionVersion(history: DecisionHistory, version: Version): DecisionHistory {
  const latest = history.versions.at(-1);
  if ((latest?.id ?? null) !== version.parentVersionId ||
      (latest && latest.projectId !== version.projectId) ||
      version.number !== (latest?.number ?? 0) + 1 ||
      (version.revision && history.versions.some((entry) => entry.revision?.id === version.revision?.id))) {
    return history;
  }
  return { ...history, versions: [...history.versions, version], feedbackDraft: '' };
}
