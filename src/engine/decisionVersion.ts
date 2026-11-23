import { FABRICS } from '../data/fabrics';
import type {
  CandidateCombination,
  Constraint,
  ConstraintField,
  DecisionRequirement,
  MatchResult,
  Revision,
  Version,
} from '../types/decisions';
import type { DeconstructedRequirement, OfficialSpecItem, RequirementInput } from '../types/sartoria';
import { deconstructLocally } from './deconstructEngine';
import { evaluateFeasibility } from './matchingEngine';
import { generateVisualPromptPack } from './promptEngine';
import { generateProposalDraft } from './proposalEngine';
import { describeRequirementValue, requirementFields } from './requirementInterview';

function statement(requirement: DecisionRequirement, field: ConstraintField): Constraint | undefined {
  if (requirement.constraints.some((constraint) => constraint.field === field && constraint.blocking)) return undefined;
  const known = requirement.constraints.filter((constraint) => constraint.field === field &&
    constraint.op === 'eq' && constraint.value !== null && constraint.level !== 'pending');
  return known.find((constraint) => constraint.state === 'confirmed') ??
    known.find((constraint) => constraint.state === 'explicit') ?? known[0];
}

export function decisionInput(requirement: DecisionRequirement, candidate?: CandidateCombination | null): RequirementInput {
  const { input } = requirement;
  const business = statement(requirement, 'businessType')?.value;
  const quantity = statement(requirement, 'quantity')?.value;
  const season = statement(requirement, 'season')?.value;
  return {
    ...input,
    businessType: business === 'corporate_uniform' || business === 'private_couture' ? business : input.businessType,
    groupSize: typeof quantity === 'number' ? `${quantity} 套` : input.groupSize,
    season: season === 'spring' || season === 'summer' || season === 'autumn' || season === 'winter' || season === 'all_season'
      ? season : input.season,
    targetSceneId: candidate?.config.sceneId ?? input.targetSceneId,
  };
}

export function decisionPresentation(
  requirement: DecisionRequirement,
  presentation = deconstructLocally(decisionInput(requirement)),
): DeconstructedRequirement {
  const color = statement(requirement, 'color');
  const colorSpecifiedByUser = color?.state === 'explicit' || color?.state === 'confirmed';
  const officialSpecs = presentation.officialSpecs.map((spec): OfficialSpecItem => {
    const value = statement(requirement, spec.key);
    if (spec.key === 'color' && !colorSpecifiedByUser) {
      return { ...spec, value: '色彩待客户确认', provenance: 'needs_human_verification', sourceNote: '当前需求没有经确认的正向色彩条件。' };
    }
    if (!value) return spec;
    const label = describeRequirementValue(spec.key, value.value);
    return {
      ...spec,
      value: value.level === 'preference' ? `${label}（偏好）` : label,
      provenance: value.state === 'suggested' ? 'system_suggested' : 'user_explicit',
      sourceNote: value.state === 'confirmed'
        ? `定制业务专员已确认${value.quote ? ` · 原话「${value.quote}」` : ''}`
        : value.quote ? `原话「${value.quote}」` : value.reason ?? undefined,
    };
  });
  const originalBuckets = presentation.threeBuckets;
  const sourcedConstraints = requirement.constraints.filter(({ state }) => state === 'confirmed' || state === 'explicit');
  return {
    ...presentation,
    colorSpecifiedByUser,
    officialSpecs,
    threeBuckets: {
      ...originalBuckets,
      userExplicit: sourcedConstraints.map(({ field, op, value, level }) =>
        `${requirementFields[field].label}：${op === 'neq' ? '排除 ' : ''}${describeRequirementValue(field, value)}${level === 'preference' ? '（偏好）' : ''}`),
    },
  };
}

export function buildDecisionVersion({ projectId, previous, requirement, match, candidate, revision, now = new Date().toISOString() }: {
  projectId: string;
  previous: Version | null;
  requirement: DecisionRequirement;
  match: MatchResult;
  candidate: CandidateCombination | null;
  revision: Revision | null;
  now?: string;
}): Version {
  const number = (previous?.number ?? 0) + 1;
  const id = `${projectId}:v${number}`;
  const approved = candidate?.status === 'eligible' ? candidate : null;
  const version: Version = {
    id, projectId, number, parentVersionId: previous?.id ?? null, createdAt: now,
    requirement, match, candidate: approved, proposal: null, promptPack: null, revision,
  };
  if (approved) {
    const input = decisionInput(requirement, approved);
    const deconstructed = decisionPresentation(requirement);
    const { config } = approved;
    const feasibility = evaluateFeasibility(input, config, deconstructed);
    const proposal = generateProposalDraft(input, deconstructed, config, feasibility, {
      similarCaseIds: approved.referenceCaseIds,
      fabricRationale: {
        styleFit: approved.comparison.style,
        comfortFit: approved.comparison.comfort,
        bodyFit: approved.comparison.fit,
      },
    });
    proposal.id = id;
    proposal.generatedAt = now;
    proposal.dataSourceStatement = '版型、面料、工艺和案例来自模拟静态目录。来源与逐字段证据随交接包保存，实际洗护、量体及制作由人工复核。';
    const prompts = generateVisualPromptPack(input, deconstructed, config);
    const fabric = FABRICS.find((asset) => asset.id === config.fabricId);
    if (fabric) prompts.deliveryBrief.push(`材质参考：${fabric.code} · ${fabric.composition} · ${fabric.luster}。`);
    prompts.generatedAt = now;
    version.proposal = proposal;
    version.promptPack = prompts;
  }
  return structuredClone(version);
}
