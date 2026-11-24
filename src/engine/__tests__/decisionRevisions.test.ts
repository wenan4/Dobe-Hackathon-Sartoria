import { describe, expect, it } from 'vitest';
import { CONFERENCE_BRIEF, CONFERENCE_FEEDBACK } from '../../data/decisionFixtures';
import type { RevisionOption, Version } from '../../types/decisions';
import { buildDecisionExport, buildDecisionMarkdown } from '../../utils/decisionHandoff';
import { buildLedgerCsv } from '../../utils/exporters';
import { matchDecision } from '../decisionMatching';
import { appendDecisionVersion, emptyDecisionHistory, previewDecisionRevision, recordDecisionRevision, refreshDecisionRequirement } from '../decisionRevisions';
import { buildDecisionVersion, decisionPresentation } from '../decisionVersion';
import { buildLedgerRecordFromSession } from '../ledgerStore';
import { buildLocalDecisionRequirement } from '../requirementInterview';
import { resolveStageVisual } from '../visualResolver';

function startConference(): Version {
  const requirement = buildLocalDecisionRequirement(CONFERENCE_BRIEF);
  const match = matchDecision(requirement);
  return buildDecisionVersion({
    projectId: 'conference-test', previous: null, requirement, match,
    candidate: match.recommended, revision: null,
  });
}

function revise(base: Version, feedback: string, option: RevisionOption) {
  const preview = previewDecisionRevision(base, feedback)!;
  const branch = preview.branches.find((entry) => entry.option === option)!;
  const revision = recordDecisionRevision(preview, branch, base.createdAt);
  const version = buildDecisionVersion({
    projectId: base.projectId, previous: base, requirement: branch.requirement,
    match: branch.match, candidate: branch.candidate, revision,
  });
  return { preview, branch, revision, version };
}

describe('decision preview and version snapshots', () => {
  it('retains an eligible manual alternative when only the batch size changes', () => {
    const initial = startConference();
    const base = { ...initial, candidate: initial.match.alternative };
    expect(base.candidate).not.toBeNull();
    const updated = revise(base, '数量改为四十八套。', 'accept');
    expect(updated.version.candidate?.id).toBe(base.candidate?.id);
    expect(updated.branch.impacts.map(({ area }) => area)).not.toContain('fabric');
  });

  it('exports the selected lapel and concealed placket in the visual brief', () => {
    const input = { ...CONFERENCE_BRIEF, rawNarrative: '团体职业服三十套，室内正式接待，必须暖灰、平驳领，不能有明扣。' };
    const requirement = buildLocalDecisionRequirement(input);
    const match = matchDecision(requirement);
    expect(match.recommended?.config.patternId).toBe('pat-haipai-suit-ensemble-lapel');
    const version = buildDecisionVersion({
      projectId: 'lapel-brief', previous: null, requirement, match, candidate: match.recommended, revision: null,
    });
    const prompt = version.promptPack!.shots[0].prompts.flux_sd;
    expect(prompt).toContain('notched lapels');
    expect(prompt).toContain('concealed front fastening');
    expect(resolveStageVisual(version.candidate!.config).isExactPhotographicVariant).toBe(false);
  });

  it('keeps confirmed facts and their original quotes across repeat interviews', () => {
    const base = startConference();
    const revised = revise(base, '数量改为四十八套。', 'accept').version.requirement;
    expect(refreshDecisionRequirement(revised.input, revised)).toEqual(revised);
    const input = { ...revised.input, rawNarrative: '客户现在必须订七十五套。' };
    const refreshed = refreshDecisionRequirement(input, revised);
    const quantity = refreshed.constraints.filter((item) => item.field === 'quantity');
    expect(quantity).toEqual(expect.arrayContaining([
      expect.objectContaining({ state: 'confirmed', value: 48 }),
      expect.objectContaining({ value: 75, quote: '客户现在必须订七十五套' }),
      expect.objectContaining({ blocking: true }),
    ]));
    expect(matchDecision(refreshed).recommended).toBeNull();
    for (const item of quantity.filter((entry) => entry.quote)) {
      expect(refreshed.turns.find((turn) => turn.id === item.sourceTurnId)?.text).toContain(item.quote);
    }
  });

  it('keeps combinations out of recommendations while a hard quote needs clarification', () => {
    const requirement = buildLocalDecisionRequirement(CONFERENCE_BRIEF);
    const known = matchDecision(requirement);
    expect(known.status).toBe('matched');
    const blocked = matchDecision({
      ...requirement,
      constraints: requirement.constraints.map((item) => item.field === 'color'
        ? { ...item, level: 'pending', state: 'unknown', value: null, blocking: true } : item),
    });
    expect(blocked.status).toBe('no_match');
    expect(blocked.recommended).toBeNull();
    expect(blocked.review[0]?.evidence.some((item) => item.field === 'color' && item.outcome === 'unknown')).toBe(true);
  });

  it('holds a mixed feedback turn when a required change still needs clarification', () => {
    const before = startConference();
    const preview = previewDecisionRevision(before, '数量调整到五十套，裙长必须过膝。')!;
    expect(preview.conflicts.some((item) => item.field === 'lengthRatio')).toBe(true);
    expect(preview.branches.filter((branch) => branch.canConfirm).map((branch) => branch.option)).toEqual(['defer']);
    expect(before.requirement.constraints.find((item) => item.field === 'quantity')?.value).toBe(60);
  });

  it('applies two revisions while retaining untouched hard constraints and frozen visuals', () => {
    const v1 = startConference();
    const hard = v1.requirement.constraints.filter((constraint) => constraint.level === 'hard');
    const first = revise(v1, CONFERENCE_FEEDBACK, 'keep');
    expect(first.preview.conflicts.some((entry) => entry.field === 'fabric')).toBe(true);
    expect(first.branch.canConfirm).toBe(true);
    expect(first.version.candidate?.config.fabricId).toBe('fab-demo-navy-lustrous-blend');
    expect(first.version.candidate?.config.patternId).toBe(v1.candidate?.config.patternId);
    expect(first.version.candidate?.config.sceneId).toBe(v1.candidate?.config.sceneId);
    expect(first.version.requirement.constraints).toEqual(expect.arrayContaining(hard));
    expect(first.version.promptPack?.shots[1].prompts.jimeng_cn).not.toBe(v1.promptPack?.shots[1].prompts.jimeng_cn);
    expect(first.branch.impacts.map(({ area }) => area)).toEqual(expect.arrayContaining(['fabric', 'craft', 'care', 'visual']));

    const second = revise(first.version, '希望光泽改为哑光，机洗不动', 'keep');
    expect(second.branch.canConfirm).toBe(true);
    expect(second.version).toMatchObject({ id: 'conference-test:v3', parentVersionId: first.version.id });
    expect(second.version.requirement.constraints).toEqual(expect.arrayContaining(hard));
    expect(v1.candidate?.config.fabricId).toBe('fab-demo-navy-washable-twill');
  });

  it('allows unresolved requirements to be archived without inventing a proposal', () => {
    const v1 = startConference();
    const direct = previewDecisionRevision(v1, '洗护必须改为干洗，不允许机洗。')!;
    expect(direct.conflicts.some((entry) => entry.field === 'care')).toBe(true);
    const kept = direct.branches.find((entry) => entry.option === 'keep');
    expect(kept?.canConfirm).toBe(true);
    expect(kept?.candidate?.id).toBe(v1.candidate?.id);
    expect(kept?.requirement.constraints)
      .toEqual(expect.arrayContaining(v1.requirement.constraints.filter((constraint) => constraint.field === 'care')));
    const held = revise(v1, '必须用真丝，机洗不动。', 'keep');
    expect(held.branch.canConfirm).toBe(true);
    expect(held.version).toMatchObject({ candidate: null, proposal: null, promptPack: null, match: { status: 'no_match' } });
    expect(held.version.match.recommended).toBeNull();
    const record = buildLedgerRecordFromSession({
      id: held.version.projectId, stylePackId: 'shanghai-haipai', input: held.version.requirement.input,
      deconstructed: decisionPresentation(held.version.requirement), config: null, decisionVersion: held.version,
    });
    expect(record).toMatchObject({ config: null, proposal: null, promptPack: null });
    expect(buildLedgerCsv([record])).toContain('暂无合格组合');
    const reopened = JSON.parse(JSON.stringify(held.version)) as Version;
    expect(buildDecisionExport(reopened, v1)).toEqual(buildDecisionExport(held.version, v1));
    expect(buildDecisionMarkdown(reopened, v1)).toContain('暂无满足硬条件的组合');
    expect(v1.requirement.turns).toHaveLength(1);
  });

  it('preserves history and draft when a stale or duplicate write is attempted', () => {
    const v1 = startConference();
    const first = revise(v1, CONFERENCE_FEEDBACK, 'keep');
    const history = appendDecisionVersion(emptyDecisionHistory(), v1);
    const withDraft = { ...history, feedbackDraft: CONFERENCE_FEEDBACK };
    const rejected = revise(v1, CONFERENCE_FEEDBACK, 'defer');
    expect(rejected.revision.humanDecision).toBe('rejected');
    expect(withDraft.versions).toEqual([v1]);
    expect(withDraft.feedbackDraft).toBe(CONFERENCE_FEEDBACK);
    const v2 = appendDecisionVersion(withDraft, first.version);
    expect(v2.feedbackDraft).toBe('');
    expect(v2.versions).toEqual([v1, first.version]);
    expect(appendDecisionVersion(v2, first.version)).toBe(v2);
    expect(appendDecisionVersion(v2, { ...first.version, projectId: 'another-project', parentVersionId: first.version.id, number: 3 })).toBe(v2);
  });

  it('withdraws only the named exclusion after explicit confirmation', () => {
    const input = { ...CONFERENCE_BRIEF, rawNarrative: `${CONFERENCE_BRIEF.rawNarrative}禁止使用羊毛或醋酸。` };
    const requirement = buildLocalDecisionRequirement(input);
    const match = matchDecision(requirement);
    const v1 = buildDecisionVersion({
      projectId: 'specific-withdrawal', previous: null, requirement, match, candidate: match.recommended, revision: null,
    });
    const { preview, branch, version } = revise(v1, '撤回不要羊毛的要求，面料先待选。', 'accept');
    expect(preview.conflicts).toEqual([]);
    expect(branch.canConfirm).toBe(true);
    const exclusions = (entry: Version) => entry.requirement.constraints
      .filter((item) => item.field === 'fabric' && item.level === 'hard' && item.op === 'neq')
      .map((item) => item.value);
    expect(exclusions(v1)).toEqual(['wool', 'acetate']);
    expect(exclusions(version)).toEqual(['acetate']);
  });
});
