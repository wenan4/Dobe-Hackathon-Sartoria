import { describe, expect, it } from 'vitest';
import { extractRevisionConstraints } from '../requirementInterview';

describe('garment requirements from colloquial brief wording', () => {
  it('computes a total from a named roster and each wearer’s allocation across adjacent clauses', () => {
    const text = '前台换西服。名单有十七名职员，人均领两身西装。';
    expect(extractRevisionConstraints({ id: 'uniforms', text })).toMatchObject([
      { field: 'businessType', value: 'corporate_uniform', level: 'hard' },
      { field: 'quantity', value: 34, quote: '名单有十七名职员，人均领两身西装', sourceTurnId: 'uniforms' },
      { field: 'category', value: 'suit', level: 'hard' },
    ]);
  });

  it('uses a personnel role to identify a per-person allocation', () => {
    const text = '采购确认27名员工，每位员工统一配两套。';
    expect(extractRevisionConstraints({ id: 'employees', text })).toMatchObject([
      { field: 'businessType', value: 'corporate_uniform', level: 'hard' },
      { field: 'quantity', value: 54, quote: '采购确认27名员工，每位员工统一配两套', sourceTurnId: 'employees' },
    ]);
  });

  it.each([
    '有同事要换装，每人领一身西装。',
    '名单未定，每位员工统一配两套。',
    '报名的有三十位。每人配一套西服。',
    '有二十到二十五位，每人配一身西装。',
    '到岗十名职员，每人至少两套制服。',
    '接待班有十八名职工，每人领一到两身西装。',
    '已经到了十八位临时职员，每位职员可领两套制服。',
    '同事人手做件外套。',
  ])('withholds a total unless a headcount and allocation both identify it: %s', (text) => {
    expect(extractRevisionConstraints({ id: 'unconfirmed-order-size', text })
      .some(({ field, value }) => field === 'quantity' && value !== null)).toBe(false);
  });

  it('keeps a stated order total alongside allocation wording', () => {
    const constraints = extractRevisionConstraints({ id: 'explicit-total', text: '补十九身西服，人手领一身。' });
    expect(constraints.filter(({ field }) => field === 'quantity')).toMatchObject([{ value: 19, level: 'hard' }]);
  });

  it('asks for confirmation when the headcount and allocation conflict with an explicit order total', () => {
    const text = '确认十名职员每人配两套西服合计十八套。';
    const result = extractRevisionConstraints({ id: 'inconsistent-totals', text });
    expect(result.filter(({ field }) => field === 'quantity')).toMatchObject([
      { value: 20, level: 'hard' },
      { value: 18, level: 'hard' },
      { value: null, blocking: true },
    ]);
  });

  it('reads split-wear design, hem height and sleeve mobility as properties of one outfit', () => {
    const text = '搭在院里的露天台子上表演，给自己订一套。夹克跟半身裙需能分开搭配，下摆就停在脚踝处，肩袖别扯住手臂。';
    expect(extractRevisionConstraints({ id: 'stage-fit', text })).toMatchObject([
      { field: 'businessType', value: 'private_couture' },
      { field: 'quantity', value: 1 },
      { field: 'scene', value: 'outdoor_stage' },
      { field: 'category', value: 'two_piece' },
      { field: 'patternStructure', value: 'two_piece' },
      { field: 'lengthRatio', value: 'ankle' },
      { field: 'easeAllowance', value: 'arm_mobility', op: 'eq' },
    ]);
  });

  it('keeps garment care directions separate from instructions to make independent pieces', () => {
    const result = extractRevisionConstraints({ id: 'laundry', text: '上衣和半身裙要分开洗。' });
    expect(result.some(({ field, value }) => (field === 'category' || field === 'patternStructure') && value === 'two_piece')).toBe(false);
  });

  it('recognizes a self order and a straight cut with modern Chinese styling', () => {
    const text = '给本人做件中式改良夹克，从肩线向下笔直垂落。去室内授奖仪式时穿。';
    const result = extractRevisionConstraints({ id: 'ceremony', text });
    expect(result).toMatchObject([
      { field: 'businessType', value: 'private_couture', level: 'hard' },
      { field: 'quantity', value: 1, level: 'hard' },
      { field: 'scene', value: 'indoor_formal', level: 'hard' },
      { field: 'category', value: 'jacket', level: 'hard' },
      { field: 'patternStructure', value: 'h_line', level: 'hard' },
      { field: 'style', value: 'new_chinese', level: 'hard' },
    ]);
  });

  it('reads style directions apart from the clothing buyer and identifies an indoor recital', () => {
    const text = '公司给会务岗统一订十六套西装。选轻商务风格，别做成礼宾制服。穿去做室内小提琴合奏的接待。';
    expect(extractRevisionConstraints({ id: 'recital', text })).toMatchObject([
      { field: 'businessType', value: 'corporate_uniform' },
      { field: 'quantity', value: 16 },
      { field: 'scene', value: 'indoor_performance' },
      { field: 'category', value: 'suit' },
      { field: 'style', value: 'modern', op: 'eq' },
      { field: 'style', value: 'traditional_uniform', op: 'neq' },
    ]);
  });
});
