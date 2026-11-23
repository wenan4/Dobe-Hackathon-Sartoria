import { CRAFTS } from '../data/crafts';
import { REQUIREMENT_SCHEMA_VERSION } from '../types/decisions';
import type { ClarificationQuestion, Constraint, ConstraintField, DecisionRequirement, RequirementTurn } from '../types/decisions';
import type { RequirementInput } from '../types/sartoria';

type Choice = readonly [value: string | boolean, label: string, expression: string];

export const requirementFields = {
  businessType: { label: '业务类型', choices: [
    ['corporate_uniform', '团体职业服', '团体职业服|团装|团体定制|团队工装|公司工装|员工制服|会务服'],
    ['private_couture', '个人高定', '个人高定|个人定制|私人定制|个人礼服'],
  ] },
  quantity: { label: '数量', choices: [] },
  scene: { label: '场景', choices: [
    ['indoor_formal', '室内正式', '室内.{0,4}正式|正式.{0,4}室内|正式礼厅|室内会务|室内峰会|室内会议|室内商务|室内接待|室内典礼'],
    ['outdoor_stage', '户外舞台', '(?:户外|室外).{0,4}(?:舞台|演出|表演)'],
    ['indoor_performance', '室内演出', '室内.{0,4}(?:舞台|演出|演奏)|音乐厅|剧院'],
    ['formal_evening', '正式晚宴', '晚宴|晚礼宴|晚会|正式酒会'],
  ] },
  season: { label: '季候', choices: [
    ['spring', '春季', '春季|春天|春款'], ['summer', '夏季', '夏季|夏天|夏款'],
    ['autumn', '秋季', '秋季|秋天|秋款|秋夜'], ['winter', '冬季', '冬季|冬天|冬款'],
    ['all_season', '四季通用', '四季通用|四季可穿|全年|不分季节'],
  ] },
  category: { label: '品类', choices: [
    ['two_piece', '两件式', '两件式|两件套|连衣裙和.{0,3}外套|外套和.{0,3}连衣裙'],
    ['suit', '西装套装', '西服套装|西装套装|西服|西装(?!领)'],
    ['dress', '连衣裙／礼服', '连衣裙|长礼服|晚礼服|长裙'],
    ['jacket', '外套', '外套|夹克|上衣'],
  ] },
  patternStructure: { label: '版型结构', choices: [
    ['h_line', 'H 型直身', '[hHＨ]\\s?[型形]|直身版型|直身结构'],
    ['two_piece', '两件式', '两件式|两件套|连衣裙和.{0,3}外套|外套和.{0,3}连衣裙'],
  ] },
  collar: { label: '领型', choices: [
    ['cross_open', '交领开襟', '交领'], ['diagonal', '斜襟', '斜襟'], ['stand', '立领', '立领'], ['lapel', '翻领', '翻领|驳领|西装领'],
  ] },
  fabric: { label: '面料', choices: [
    ['blend', '混纺', '混纺'], ['silk', '真丝', '真丝(?!混纺)|桑蚕丝(?!混纺)|纯蚕丝'],
    ['wool', '羊毛', '羊毛(?!混纺)|精纺毛料'], ['polyester', '涤纶', '涤纶(?!混纺)|聚酯纤维(?!混纺)'],
    ['acetate', '醋酸', '醋酸(?!混纺)'], ['velvet', '丝绒', '丝绒|天鹅绒'],
  ] },
  color: { label: '色系', choices: [
    ['navy', '藏青', '藏青(?:色)?|深海军蓝|海军蓝|深蓝(?:色)?'],
    ['obsidian', '墨黑', '墨黑|黑色|纯黑|纯墨色'], ['ivory', '象牙白', '象牙白|米白(?:色)?|乳白(?:色)?'],
    ['crimson', '绯红', '绯红|深红(?:色)?|酒红(?:色)?|正红(?:色)?'],
    ['stone_gray', '暖灰／深灰', '石板灰|石灰色|暖灰(?:色)?|深灰(?:色)?|炭灰(?:色)?|灰色'],
    ['pine_green', '松绿', '松墨绿|松绿(?:色)?|墨绿(?:色)?|深绿(?:色)?'],
    ['champagne', '香槟', '香槟(?:金|色)'], ['mist_blue', '雾蓝', '雾蓝(?:色)?|浅蓝(?:色)?'],
    ['ivory_rose', '象牙玫瑰', '象牙玫瑰|米白.{0,3}(?:亮粉|玫瑰粉)'],
    ['earth_brown', '大地棕', '大地棕|棕色|咖啡色|土棕'], ['neutral_silk', '丝本色', '丝本色|真丝原色'],
  ] },
  motif: { label: '装饰纹样', choices: [
    ['subtle_jacquard', '含蓄暗纹', '暗纹|暗花|低调提花'], ['plain', '素面', '素面|纯色无纹|无纹样|无花纹'],
  ] },
  lengthRatio: { label: '长度比例', choices: [
    ['mid_hip', '及臀中', '臀中|及臀|到臀部'], ['ankle', '及踝', '及踝|到脚踝|齐脚踝'],
    ['floor', '及地', '及地|拖地|曳地|落地长'],
  ] },
  easeAllowance: { label: '松弛余量', choices: [
    ['arm_mobility', '肩臂活动余量', '不要压肩|不压肩|避免压肩|不卡(?:手臂|胳膊|臂)|抬(?:臂|手)(?:时)?(?:、坐奏都要方便|.{0,4}(?:不卡|方便|自然|顺畅|自如|不受限|不紧绷))|肩臂(?:活动)?余量|袖笼放量|坐奏.{0,3}方便'],
  ] },
  closure: { label: '开合细节', choices: [
    ['no_visible_buttons', '无外露纽扣', '无外露(?:的)?(?:纽扣|扣子|扣)|不(?:要|用|许)(?:看见|露出|外露)(?:纽扣|扣子|扣)|隐藏纽扣|隐门襟'],
    ['visible_buttons', '外露纽扣', '外露(?:的)?(?:纽扣|扣子|扣)|明扣'],
  ] },
  care: { label: '洗护', choices: [
    ['machine_wash', '可机洗', '机洗|洗衣机(?:洗)?'], ['dry_clean', '干洗', '干洗'], ['hand_wash', '手洗', '手洗'],
  ] },
  wrinkleResistance: { label: '耐皱', choices: [
    [true, '要求耐皱', '耐皱|抗皱|防皱|免熨|不(?:易|容易)皱|不(?:易|容易)起皱|不起皱'],
    [false, '可接受易皱', '易皱|容易起皱|容易皱'],
  ] },
  luster: { label: '光泽', choices: [
    ['high', '高光泽', '更亮(?!的?(?:颜色|色系))|亮(?:一点|一些)(?!的?(?:颜色|色系))|高光泽|光泽更强|光泽更高|丝光明显|亮面'],
    ['medium', '微光泽', '柔光|微光泽|少许光泽|有一点光泽'],
    ['low', '低光泽', '低光泽|哑光|消光'],
  ] },
  style: { label: '风格', choices: [
    ['traditional_uniform', '传统制服', '传统(?:制服|工装)|老式(?:制服|工装)|制服感'],
    ['modern', '现代利落', '现代(?:感|风格|简约|利落)|极简商务'], ['new_chinese', '新中式', '新中式'],
  ] },
  craft: { label: '工艺', choices: CRAFTS.map((craft): Choice => [
    craft.id, craft.shortName, craft.shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  ]) },
} satisfies Record<ConstraintField, { label: string; choices: readonly Choice[] }>;

export const requirementFieldIds = Object.keys(requirementFields) as ConstraintField[];

export function isRequirementValue(field: ConstraintField, value: unknown): value is NonNullable<Constraint['value']> {
  return field === 'quantity'
    ? typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    : requirementFields[field].choices.some(([choice]) => value === choice);
}

export function describeRequirementValue(field: ConstraintField, value: Constraint['value']): string {
  if (value === null) return '待确认';
  if (field === 'quantity') return `${value} 套`;
  return requirementFields[field].choices.find(([choice]) => choice === value)?.[1] ?? String(value);
}

type Observation = Pick<Constraint, 'field' | 'value' | 'op' | 'level' | 'reason' | 'quote'>;
const PREFERENCE = /(?:最好|优先|倾向|偏好|尽量|希望|想要|喜欢|更偏|可考虑|对比)/;
const MANDATORY = /(?:必须|务必|只能|一定要|不可|不能|不接受|严禁|不得|不许|禁止)/;
const NEGATION = /(?:不能|不可|不要|不得|不许|避免|不接受|不考虑|排除|不想要|不想|不喜欢|不希望|不偏好|不用|不选|不准|不宜|不像|不做|不采用|不是|不允许|不支持|别用|别选|别要|别像|拒绝|禁止|忌用|非|无外露|无)\s*(?:(?:再|选|用|是|有|像|偏|出现|做成|采用|做|做得|那种|类似|太|特别|那么|略带|的)\s*)*$/;
const WITHDRAWAL = /(?:撤回|撤销|取消|放弃|去掉|不再要求|不要求|不强求|不用限定|不限制|不必限定|不再限定|无需限定|无需要求|不限|无要求|没有.{0,8}要求|都行|都可以|随意|无所谓|不作要求)/;
const AMBIGUITY = /(?:不确定|不一定|还没决定|未指定|没定|待确认|未定|再说|先不定|待定|看情况|左右|大概|差不多|约(?:为|有)?\s*[\d一二三四五六七八九十]|[\d一二三四五六七八九十]\s*(?:到|至|[-~～])\s*[\d一二三四五六七八九十])/;
const PROTECTED = /(?:不动|保持不变|不变|保留原|维持原|照旧|仍然保留|继续保留|依然保留)/;
const CHANGE = /(?:改成|改为|换成|换为|替换为|调整为|调整成|改用|换用|改做|(?<!修改)改(?=\S))/;
const ALTERNATIVE = /(?:或(?:者)?|二选一|择一)/;
const QUANTITY = /(?<![\d.])([0-9０-９]+|[零〇一二两三四五六七八九十百千万]+)\s*(?:套(?:装)?|件)(?![式套])/g;

function parseQuantity(text: string): number {
  const halfWidth = text.normalize('NFKC');
  if (/^[0-9]+$/.test(halfWidth)) return Number(halfWidth);
  const digits = '零一二三四五六七八九';
  const units: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };
  let total = 0;
  let section = 0;
  let current = 0;
  for (const character of text) {
    if (character === '万') {
      total += (section + current) * 10000;
      section = current = 0;
      continue;
    }
    const unit = units[character];
    if (unit) {
      section += (current || 1) * unit;
      current = 0;
    } else {
      const digit = character === '两' ? 2 : character === '〇' ? 0 : digits.indexOf(character);
      current = current * 10 + digit;
    }
  }
  return total + section + current;
}

function patternsFor(field: ConstraintField, segment: string): [NonNullable<Observation['value']>, number][] {
  if (field === 'quantity') {
    const quantities = [...segment.matchAll(QUANTITY)]
      .filter((match) => !/件\s*(?:内搭|里衬|衬里|打底衫)/.test(segment.slice(match.index, match.index + match[0].length + 4)))
      .map((match): [number, number] => [parseQuantity(match[1]), match.index])
      .filter(([quantity]) => isRequirementValue(field, quantity));
    // A constituent garment count does not supersede the two-piece project's total.
    return /连衣裙和.{0,3}外套|外套和.{0,3}连衣裙/.test(segment) ? [] : quantities;
  }
  const matches: [NonNullable<Observation['value']>, number][] = [];
  const covered = new Set<number>();
  for (const [value, , expression] of requirementFields[field].choices) {
    for (const match of segment.matchAll(new RegExp(expression, 'gi'))) {
      const indexes = Array.from({ length: match[0].length }, (_, index) => match.index + index);
      if (indexes.some((index) => covered.has(index))) continue;
      indexes.forEach((index) => covered.add(index));
      matches.push([value, match.index]);
    }
  }
  return matches;
}

function unresolved(field: ConstraintField, quote: string | null, reason: string): Observation {
  return { field, op: 'eq', value: null, level: 'pending', quote, reason };
}

const WITHDRAWAL_REASON = '原话明确撤回该要求。';

export function isExplicitWithdrawal(constraint: Constraint): boolean {
  return constraint.state === 'unknown' && constraint.reason === WITHDRAWAL_REASON && constraint.quote !== null;
}

const fieldMentions: Partial<Record<ConstraintField, RegExp>> = {
  color: /颜色|色系|色彩|配色/, fabric: /材质|面料/, care: /洗护|养护|水洗/,
  quantity: /数量|套数|件数/, scene: /场合|场景/, season: /季候|季节/,
  luster: /光泽|亮度/, closure: /门襟|纽扣/, motif: /纹样|图案/, easeAllowance: /松量|松弛余量/,
};

function readSegment(segment: string): Observation[] {
  if (PROTECTED.test(segment)) return [];
  const change = CHANGE.exec(segment);
  const offset = change ? change.index + change[0].length : 0;
  const target = segment.slice(offset);
  const observations: Observation[] = [];
  for (const field of requirementFieldIds) {
    const matches = patternsFor(field, target).sort((a, b) => a[1] - b[1]);
    if (WITHDRAWAL.test(target) && (matches.length || fieldMentions[field]?.test(target))) {
      observations.push(unresolved(field, segment, WITHDRAWAL_REASON));
      continue;
    }
    if ((matches.length || fieldMentions[field]?.test(target)) && (AMBIGUITY.test(target) ||
      field === 'quantity' && /至少|至多|不超过|不少于|超过|以上|以下|[套件]起|[套件]左右/.test(target))) {
      observations.push(unresolved(field, segment, '原话给出的范围或取值尚不确定。'));
      continue;
    }
    const fieldObservations = matches.map(([value, index], matchIndex): Observation => {
      const scope = target.slice(0, index).split(/(?:但是|但|却|并且|而且|同时|改要|可以考虑)/).at(-1) ?? '';
      const previous = matches[matchIndex - 1];
      const prevObservation = observations.at(-1);
      const coordinatedExclusion = previous && /(?:或(?:者)?|和|及|与)/.test(target.slice(previous[1], index)) &&
        prevObservation?.field === field && prevObservation.op === 'neq';
      const doubleCareNegative = field === 'care' && /(?:不要|拒绝|不接受|不能用)[^，,；;]{0,8}(?:不能|不可|不支持)\s*$/.test(scope);
      const op = !doubleCareNegative && (NEGATION.test(scope) || coordinatedExclusion) ? 'neq' : 'eq';
      const preferred = PREFERENCE.test(scope) && !MANDATORY.test(scope);
      const categoryOrder = field === 'category' && /(?:想|希望)要?定制/.test(scope);
      const level = (preferred && !categoryOrder) || (!MANDATORY.test(scope) && !change && field === 'luster' && /更亮|亮一点|亮一些/.test(target))
        ? 'preference' : 'hard';
      const observation: Observation = { field, value, op, level, reason: null, quote: segment };
      observations.push(observation);
      return observation;
    });
    if (fieldObservations.length > 1 && ALTERNATIVE.test(target) && fieldObservations.some(({ op }) => op === 'eq')) {
      observations.splice(-fieldObservations.length, fieldObservations.length, unresolved(field, segment, '原话列出多个备选，需要确认取值。'));
    }
  }
  return observations;
}

export function constraintsConflict(left: Constraint, right: Constraint): boolean {
  return left.field === right.field && left.level === 'hard' && right.level === 'hard' && (
    left.op === 'eq' && right.op === 'eq' && left.value !== right.value ||
    left.op !== right.op && left.value === right.value
  );
}

export function extractRevisionConstraints(turn: RequirementTurn): Constraint[] {
  const segments = turn.text.split(/(?:[，,；;。！？!?\n]+|但是|但(?=也|要|不能|不要|必须|可以|希望|不需要)|另外|并且|而且|同时)/)
    .map((segment) => segment.trim()).filter(Boolean);
  const constraints = segments.flatMap(readSegment).map((observation, index): Constraint => ({
    ...observation,
    id: `${turn.id}:${observation.field}:${index + 1}`,
    state: observation.level === 'pending' ? 'unknown' : 'explicit',
    sourceTurnId: turn.id,
    verifiedBy: null,
  }));
  return requirementFieldIds.flatMap((field) => {
    const items = constraints.filter((constraint) => constraint.field === field);
    const conflicts = items.some((left, index) => items.slice(index + 1).some((right) => constraintsConflict(left, right)));
    if (conflicts) return [{
      ...items[0], value: null, op: 'eq', level: 'pending', state: 'unknown',
      quote: turn.text.trim(), reason: '同一轮原话包含互相冲突的要求，需要人工确认。',
    } satisfies Constraint];
    if (items.some(({ state }) => state === 'unknown')) return items.filter(({ state }) => state === 'unknown').slice(-1);
    return items.filter((item, index) => !items.slice(index + 1).some((other) =>
      other.op === item.op && other.value === item.value && (other.level === item.level || other.level === 'hard')))
      .filter((item) => item.level === 'hard' || !items.some((other) =>
        other.op === item.op && other.value === item.value && other.level === 'hard'));
  });
}

const sceneContext: Partial<Record<string, string>> = {
  'scene-bund-protocol': 'indoor_formal',
  'scene-lujiazui-summit': 'indoor_formal',
  'scene-outdoor-stage': 'outdoor_stage',
  'scene-bund-banquet': 'formal_evening',
};

const officialSixSuggestions: Partial<Record<ConstraintField, NonNullable<Constraint['value']>>> = {
  patternStructure: 'h_line', collar: 'cross_open', fabric: 'silk', motif: 'subtle_jacquard',
  lengthRatio: 'mid_hip', closure: 'no_visible_buttons',
};

const questions: Partial<Record<ConstraintField, string>> = {
  care: '是否必须机洗，还是可以接受其他洗护方式？',
  scene: '主要在什么场合穿着？例如室内正式会务或户外演出。',
  quantity: '预计需要多少套？',
  category: '想定制外套、套装，还是礼服？',
  color: '有哪些指定或排除的色系？',
};

export function buildClarificationQuestions(constraints: Constraint[]): ClarificationQuestion[] {
  const outstanding = constraints.filter(({ state, sourceTurnId }) => state === 'unknown' && sourceTurnId !== null);
  const fields = new Set<ConstraintField>(outstanding.map(({ field }) => field));
  const group = constraints.some((item) => item.field === 'businessType' && item.op === 'eq' && item.value === 'corporate_uniform');
  const priorities = group ? ['care', 'scene', 'quantity'] as const : ['category'] as const;
  for (const field of priorities) {
    if (!constraints.some((item) => item.field === field && (item.state === 'explicit' || item.state === 'confirmed'))) fields.add(field);
  }
  return [...fields].slice(0, 2).map((field) => ({ field, question: questions[field] ?? `请确认${requirementFields[field].label}的具体要求。` }));
}

function formAndPresetSuggestions(input: RequirementInput): Partial<Record<ConstraintField, NonNullable<Constraint['value']>>> {
  const groupSize = input.groupSize.matchAll(QUANTITY).next().value?.[1];
  const formQuantity = groupSize ? parseQuantity(groupSize) : 0;
  return {
    businessType: input.businessType, season: input.season, scene: sceneContext[input.targetSceneId],
    quantity: input.presetDemoId && formQuantity ? formQuantity : undefined,
    ...(input.presetDemoId === 'official-case-6' ? officialSixSuggestions : {}),
  };
}

export function buildLocalDecisionRequirement(input: RequirementInput): DecisionRequirement {
  const firstTurn = { id: 'brief-1', text: input.rawNarrative };
  const observations = extractRevisionConstraints(firstTurn);
  const suggestions = formAndPresetSuggestions(input);
  const constraints = requirementFieldIds.flatMap((field): Constraint[] => {
    const stated = observations.filter((constraint) => constraint.field === field);
    if (stated.length) return stated;
    const value = suggestions[field] ?? null;
    const fromPreset = input.presetDemoId === 'official-case-6' && field in officialSixSuggestions;
    return [{
      id: `initial:${field}`, field, op: 'eq', value, level: value === null ? 'pending' : 'preference',
      state: value === null ? 'unknown' : 'suggested', sourceTurnId: null, quote: null, verifiedBy: null,
      reason: value === null ? '原话未说明或暂无可归一化的取值。' :
        fromPreset ? '按官方案例六设计参考给出的建议。' : '沿用项目表单的场景信息。',
    }];
  });
  return { schemaVersion: REQUIREMENT_SCHEMA_VERSION, mode: 'local_rules', input, turns: [firstTurn], constraints, questions: buildClarificationQuestions(constraints) };
}
