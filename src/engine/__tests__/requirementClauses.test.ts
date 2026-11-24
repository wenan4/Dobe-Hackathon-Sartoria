import { describe, expect, it } from 'vitest';
import { splitRequirementClauses } from '../requirementClauses';

describe('punctuation and spoken clause boundaries', () => {
  it('separates chat clauses while preserving original quotes, spaced quantities and measurements', () => {
    const raw = '  首批定 ４０　套 颜色要藏青，版型选 H 型。袖长增加 2 cm。';
    const clauses = splitRequirementClauses(raw);
    expect(clauses.map(({ text }) => text)).toEqual(['首批定 ４０　套', '颜色要藏青', '版型选 H 型', '袖长增加 2 cm']);
    for (const clause of clauses) expect(raw.slice(clause.start, clause.end)).toBe(clause.text);
  });

  it('keeps negative intent and a trailing stance with the value they qualify', () => {
    const raw = '场馆不允许 露天舞台；醋酸面料 也明确排除 布面必须哑光';
    expect(splitRequirementClauses(raw).map(({ text }) => text))
      .toEqual(['场馆不允许 露天舞台', '醋酸面料 也明确排除', '布面必须哑光']);
  });

  it('separates consecutive postposed exclusions while keeping a spaced silhouette description intact', () => {
    expect(splitRequirementClauses('羊毛一律不用 醋酸面料也排除 驳领是客户签字定的').map(({ text }) => text))
      .toEqual(['羊毛一律不用', '醋酸面料也排除', '驳领是客户签字定的']);
    expect(splitRequirementClauses('外形要像字母 H 一样直').map(({ text }) => text)).toEqual(['外形要像字母 H 一样直']);
  });
});
