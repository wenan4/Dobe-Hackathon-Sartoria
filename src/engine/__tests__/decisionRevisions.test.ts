import { describe, expect, it } from 'vitest';
import { CONFERENCE_BRIEF, CONFERENCE_FEEDBACK } from '../../data/decisionFixtures';
import type { RevisionOption, Version } from '../../types/decisions';
import { matchDecision } from '../decisionMatching';
import { appendDecisionVersion, emptyDecisionHistory, previewDecisionRevision, recordDecisionRevision } from '../decisionRevisions';
import { buildDecisionVersion } from '../decisionVersion';
import { buildLocalDecisionRequirement } from '../requirementInterview';

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

  it('requires human selection for hard conflicts and declines impossible acceptance', () => {
    const v1 = startConference();
    const direct = previewDecisionRevision(v1, '洗护必须改为干洗，不允许机洗。')!;
    expect(direct.conflicts.some((entry) => entry.field === 'care')).toBe(true);
    expect(direct.branches.find((entry) => entry.option === 'keep')?.requirement.constraints)
      .toEqual(expect.arrayContaining(v1.requirement.constraints.filter((constraint) => constraint.field === 'care')));
    const impossible = previewDecisionRevision(v1, '必须用真丝，机洗不动。')!;
    expect(impossible.branches.filter((entry) => entry.option !== 'defer').every((entry) => !entry.canConfirm)).toBe(true);
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
});
