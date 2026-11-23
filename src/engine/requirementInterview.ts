import { CRAFTS } from '../data/crafts';
import { REQUIREMENT_SCHEMA_VERSION } from '../types/decisions';
import type { ClarificationQuestion, Constraint, ConstraintField, DecisionRequirement, RequirementTurn } from '../types/decisions';
import type { RequirementInput } from '../types/sartoria';

type Choice = readonly [value: string | boolean, label: string, expression: string];

const craftAliases: Partial<Record<string, string>> = {
  'crf-haipai-pipa-button': '手工(?:琵琶)?盘扣|琵琶盘扣|盘扣',
  'crf-suzhou-magnolia-embroidery': '暗纹玉兰苏绣|(?:白)?玉兰(?:刺绣|苏绣)',
  'crf-hidden-mandarin-placket': '暗门襟立领|暗门襟工艺',
};

export const requirementFields = {
  businessType: { label: '业务类型', choices: [
    ['corporate_uniform', '团体职业服', '团装|团服|团定|团体(?:定制|款|套装|工装|工作服|职业[服装])|团队(?:工装|制服|统一着装|工作服|职业[服装])|(?:公司|企业|单位|员工|职工|门店|店里|柜台)(?:的)?(?:工装|制服|工作服|职业[服装])|会务服|集体定制|(?:批量|统一)(?:定做|订做|定制)|工服团单|(?:给|为)(?:整个|我们)?(?:公司|企业|单位|部门|团队|员工|职工|会务组)(?:的?(?:员工|同事|成员|职员))?(?=.{0,12}(?:定做|订做|做|定制|配|准备|订))|(?:给|为).{0,8}(?:员工|同事|职工|成员)(?=.{0,12}(?:每人|各一套|各做|各发|人手|一人一套))'],
    ['private_couture', '个人高定', '个人高定|个人定制|私人定制|个人礼服|私人高定|私人订制|私定|私订|个人款|单人定[制做]|只给我自己|我一个人穿|我自己穿|(?:只)?给自己(?:做|订|定做|定制|准备)|(?:给)?我个人(?:定[制做]|订[做制]?|做|量身)'],
  ] },
  quantity: { label: '数量', choices: [] },
  scene: { label: '场景', choices: [
    ['formal_evening', '正式晚宴', '(?:室内(?:的)?(?:正式)?)?晚宴|晚礼宴|晚会|慈善宴会|正式酒会'],
    ['indoor_performance', '室内演出', '室内.{0,6}(?:舞台|演出|演奏|表演)|音乐厅|剧院'],
    ['indoor_formal', '室内正式', '室内.{0,7}(?:正式|会务|峰会|会议|商务|接待|典礼|论坛)|(?:正式|会务|论坛|会展|接待).{0,7}室内|正式礼厅|会议中心|礼宾接待|会议接待|商务接待'],
    ['outdoor_stage', '户外舞台', '(?:户外|室外|露天).{0,7}(?:舞台|演出|演奏|表演)|(?:舞台|演出|演奏|表演).{0,4}(?:在|设在)(?:户外|室外|露天)'],
  ] },
  season: { label: '季候', choices: [
    ['spring', '春季', '春季|春天|春款|春日'], ['summer', '夏季', '夏季|夏天|夏款|盛夏|仲夏'],
    ['autumn', '秋季', '秋季|秋天|秋款|秋夜|秋日|深秋|入秋|秋装'], ['winter', '冬季', '冬季|冬天|冬款|寒冬|过冬'],
    ['all_season', '四季通用', '四季通用|四季可穿|全年|不分季节'],
  ] },
  category: { label: '品类', choices: [
    ['two_piece', '两件式', '两件式|两件套|二件式|二件套|两件装|外套(?:搭|配|和|加|与).{0,5}(?:连衣裙|长裙)|(?:连衣裙|长裙)(?:搭|配|和|加|与).{0,5}外套'],
    ['suit', '西装套装', '西服套装|西装套装|西服|西装(?!领)|成套西装|(?:商务|通勤|礼宾|职业|正装)套装|男士西礼服'],
    ['dress', '连衣裙／礼服', '连衣裙|连衣礼服|长款?礼服|晚礼服|长裙|礼服裙|礼裙|女士礼服|(?<=一条)礼服'],
    ['jacket', '外套', '外套|夹克|上衣|短褂|罩衫'],
  ] },
  patternStructure: { label: '版型结构', choices: [
    ['h_line', 'H 型直身', '[hHＨ]\\s?[型形]|直身版型|直身结构|直筒版型|直身廓形'],
    ['two_piece', '两件式', '两件式|两件套|二件式|二件套|两件装|上下(?:分成|分为)?两件|外套(?:搭|配|和|加|与).{0,5}(?:连衣裙|长裙)|(?:连衣裙|长裙)(?:搭|配|和|加|与).{0,5}外套'],
  ] },
  collar: { label: '领型', choices: [
    ['cross_open', '交领开襟', '交领'], ['diagonal', '斜襟', '斜襟'], ['stand', '立领', '立领'], ['lapel', '翻领', '翻领|驳领|西装领'],
  ] },
  fabric: { label: '面料', choices: [
    ['blend', '混纺', '(?:棉涤|丝毛|毛丝|涤棉|毛涤)?混纺'], ['silk', '真丝', '纯真丝(?!混纺)|真丝(?!混纺)|桑蚕丝(?!混纺)|纯蚕丝|全蚕丝'],
    ['wool', '羊毛', '纯羊毛(?!混纺)|羊毛(?!混纺)|精纺毛料|全毛(?!衬)|纯毛'], ['polyester', '涤纶', '涤纶(?!混纺)|聚酯(?:纤维)?(?!混纺)'],
    ['acetate', '醋酸', '醋酸(?!混纺)'], ['velvet', '丝绒', '丝绒|天鹅绒'],
  ] },
  color: { label: '色系', choices: [
    ['navy', '藏青', '藏青(?:色)?|藏蓝(?:色)?|深海军蓝|海军(?:深|藏)?蓝|深蓝(?:色)?|午夜蓝'],
    ['obsidian', '墨黑', '墨黑|黑色|炭黑|纯黑|纯墨色|墨色'], ['ivory', '象牙白', '象牙白|月白|米白(?:色)?|乳白(?:色)?'],
    ['crimson', '绯红', '绯红|深红(?:色)?|酒红(?:色)?|正红(?:色)?'],
    ['stone_gray', '暖灰／深灰', '石板灰|石灰色|暖灰(?:色)?|深灰(?:色)?|炭灰(?:色)?|灰色'],
    ['pine_green', '松绿', '松墨绿|松绿(?:色)?|墨绿(?:色)?|深绿(?:色)?'],
    ['champagne', '香槟', '香槟(?:金|色)'], ['mist_blue', '雾蓝', '雾蓝(?:色)?|浅蓝(?:色)?'],
    ['ivory_rose', '象牙玫瑰', '象牙玫瑰|米白.{0,3}(?:亮粉|玫瑰粉)'],
    ['earth_brown', '大地棕', '大地棕|棕色|咖啡色|土棕|墨褐|茶褐|深褐(?:色)?'], ['neutral_silk', '丝本色', '丝本色|真丝原色'],
  ] },
  motif: { label: '装饰纹样', choices: [
    ['subtle_jacquard', '含蓄暗纹', '暗纹|暗花|低调提花'], ['plain', '素面', '素面|纯色无纹|无纹样|无花纹'],
  ] },
  lengthRatio: { label: '长度比例', choices: [
    ['mid_hip', '及臀中', '臀中|及臀|臀部(?:中间|中点)|(?:到|至|齐)臀部'], ['ankle', '及踝', '及踝|(?:到|至|齐|及)脚踝|到踝部'],
    ['floor', '及地', '及地|拖地|曳地|落地长|到地(?:面|板)?|贴地长'],
  ] },
  easeAllowance: { label: '松弛余量', choices: [
    ['arm_mobility', '肩臂活动余量', '(?:不要|不能|别|不|避免)压肩|(?:不要|不能|别|不)勒肩|(?:不要|不能|别|不)卡(?:住)?(?:手臂|胳膊|臂|肩)|(?:不|别)夹(?:腋下|胳膊)|(?:抬|举|举起)(?:胳膊|臂|手)(?:时)?(?:、坐奏都要方便|.{0,6}(?:不卡|方便|自然|顺畅|自如|舒展|伸得开|不受限|不紧绷|不(?:能|要|会)?卡住|有余量))|肩(?:臂|背)(?:活动)?余量|(?:袖笼|袖窿)放量|(?:坐奏|坐着演奏).{0,5}(?:方便|不卡|活动)'],
  ] },
  closure: { label: '开合细节', choices: [
    ['no_visible_buttons', '无外露纽扣', '无外露(?:的)?(?:纽扣|扣子|扣)|不(?:要|用|许)(?:看见|露出|外露)(?:纽扣|扣子|扣)|(?:纽扣|扣子|扣件)(?:不要|不能|不可|不得|不许|禁止)外露|隐藏纽扣|隐门襟|无明扣|无扣式'],
    ['visible_buttons', '外露纽扣', '外露(?:的)?(?:纽扣|扣子|扣)|明扣'],
  ] },
  care: { label: '洗护', choices: [
    ['machine_wash', '可机洗', '机洗|机水洗|洗衣机(?:洗)?|滚筒洗'], ['dry_clean', '干洗', '干洗'], ['hand_wash', '手洗', '手洗|手工水洗'],
  ] },
  wrinkleResistance: { label: '耐皱', choices: [
    [true, '要求耐皱', '耐皱|抗皱|防皱|抗褶皱|免熨|免烫|不(?:易|容易)皱|不(?:易|容易)起(?:褶|皱)|不起(?:皱|褶)|不容易压出折痕'],
    [false, '可接受易皱', '易皱|容易起(?:褶|皱)|容易皱'],
  ] },
  luster: { label: '光泽', choices: [
    ['high', '高光泽', '更亮(?!的?(?:颜色|色系))|亮(?:一点|一些)(?!的?(?:颜色|色系))|太亮|高光泽|光泽更强|光泽更高|丝光明显|高?亮面'],
    ['medium', '微光泽', '柔光|微光泽|少许光泽|有一点光泽'],
    ['low', '低光泽', '低光泽|哑光|消光'],
  ] },
  style: { label: '风格', choices: [
    ['traditional_uniform', '传统制服', '传统(?:制服|工装|工服|工作服)|老式(?:制服|工装|工服)|制服(?:感|味)'],
    ['modern', '现代利落', '现代(?:感|风格|简约|利落)|极简商务'], ['new_chinese', '新中式', '新中式'],
  ] },
  craft: { label: '工艺', choices: CRAFTS.map((craft): Choice => [
    craft.id, craft.shortName, [craft.name, craft.shortName].map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .concat(craftAliases[craft.id] ?? []).join('|'),
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

type Observation = Pick<Constraint, 'field' | 'value' | 'op' | 'level' | 'reason' | 'quote' | 'blocking' | 'withdraws'>;
interface FieldMatch {
  value: NonNullable<Observation['value']>;
  start: number;
  end: number;
}
const PREFERENCE = /(?:最好|优先|倾向|偏好|尽量|希望|想要|喜欢|更偏|可考虑|对比|更想|请优先|有条件的话)/;
const MANDATORY = /(?:必须|务必|只能|仅限|(?<!未|没|不)指定|非要|(?<!不)一定要|不可|不能|不接受|严禁|绝不|不得|不许|禁止|硬性|必选|都得|都要|只准|切忌|谢绝)/;
const NEGATIVE_HEAD = '不能|不可|不要|不得|不许|避免|避开|远离|不接受|不考虑|排除|不想要|不想|不喜欢|不希望|不偏好|不用|不选|不准|不宜|不像|不做|不采用|不是|不在|不使用|不允许|不支持|别用|别选|别要|别像|别|拒绝|禁止|严禁|禁用|禁|忌用|切忌|谢绝|杜绝|不能有|无外露|无|非(?!要)|绝不';
const NEGATION = new RegExp(`(?:${NEGATIVE_HEAD})(?:\\s|再|给|要|订购|订|选|用|使用|采用|是|有|含有|含|带|拿|把|放进|送去|叫人|像|做成|做|那种|类似|太|特别|那么|任何|一样|略带|的)*$`);
const EXCLUSION_LIST = new RegExp(`(?:${NEGATIVE_HEAD})[^、/／，,；;。]{1,14}(?:、|/|／|和|或(?:者)?|及|与)\\s*(?:也|同样)?$`);
const FORBIDDEN_AFTER = /^(?:(?:都|也)?(?:不要|不做|不行|不可以|不能用|不考虑|不接受|不采用|不选|不一样|区别开|禁用|被排除|排除|别用|不准用|一律不用)|(?:一律|都|也)禁)/;
const WITHDRAWAL = /(?:撤回|撤销|取消|放弃|去掉|撤掉|不再要求|不要求|不需要|不强求|不强制|不硬性要求|不是必须|并非必须|不必|不用限定|不限制|不再限定|无需|不限|无要求|没有.{0,8}要求|不作要求)/;
const AMBIGUITY = /(?:不确定|不一定|还没决定|未指定|没定|待确认|未定|再说|先不定|待定|待选|没拍板|先留白|随意|都行|都可以|无所谓|看情况|左右|大概|差不多|约(?:为|有)?\s*[\d一二三四五六七八九十]|[\d一二三四五六七八九十]\s*(?:到|至|[-~～])\s*[\d一二三四五六七八九十])/;
const PROTECTED = /(?:不动|保持不变|保持原样|不变|保持原来|按原来|照原来|保留原|维持原|照旧|维持现状|仍然保留|继续保留|依然保留)/;
const CHANGE = /(?:改成|改为|换成|换为|替换为|调整为|调整成|调整到|追加至|加到|增至|增加到|减至|减到|缩减到|提高到|降到|改用|换用|改做|(?<!修改)改(?=\S))/;
const ALTERNATIVE = /(?:或(?:者|是)?|二选一|择一|任选)/;
const QUANTITY = /(?<![第\d０-９.零〇一二两三四五六七八九十百千万])([0-9０-９]+|[零〇一二两三四五六七八九十百千万]+)\s*(?:套(?:装)?|件|身|份|条(?=裙|礼裙|长裙|连衣(?:裙|礼服)|礼服))(?![式套])/g;
const SINGLE_GARMENT = /(?:做|订|定做|订制|定制)\s*([件条])(?=外套|夹克|上衣|连衣(?:裙|礼服)|礼服|长裙|西服)/;
const PERSON_COUNT = /([0-9０-９]+|[零〇一二两三四五六七八九十百千万]+)\s*(?:个人|人|名|位)(?=.{0,20}(?:每人|一人一套|人手|各一套|各做|各发|各定制))/;
const LABELED_QUANTITY = /(?:套数|件数|订购数量|定制数量|数量)\s*(?:合计|共计|是|为|共|[:：=])?\s*([0-9０-９]+|[零〇一二两三四五六七八九十百千万]+)(?!\s*(?:套|件|身|份|条|[\d０-９零〇一二两三四五六七八九十百千万]))/;

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

function patternsFor(field: ConstraintField, segment: string): FieldMatch[] {
  if (field === 'quantity') {
    const crew = PERSON_COUNT.exec(segment);
    if (crew && isRequirementValue(field, parseQuantity(crew[1]))) {
      return [{ value: parseQuantity(crew[1]), start: crew.index, end: crew.index + crew[0].length }];
    }
    const labeled = LABELED_QUANTITY.exec(segment);
    if (labeled && isRequirementValue(field, parseQuantity(labeled[1]))) {
      return [{ value: parseQuantity(labeled[1]), start: labeled.index, end: labeled.index + labeled[0].length }];
    }
    const quantities = [...segment.matchAll(QUANTITY)]
      .filter((match) => !/件\s*(?:内搭|里衬|衬里|打底衫)/.test(segment.slice(match.index, match.index + match[0].length + 4)))
      .map((match): FieldMatch => ({ value: parseQuantity(match[1]), start: match.index, end: match.index + match[0].length }))
      .filter(({ value }) => isRequirementValue(field, value));
    const single = SINGLE_GARMENT.exec(segment);
    if (!quantities.length && single) quantities.push({
      value: 1, start: single.index, end: single.index + single[0].length,
    });
    // A count of pieces within an outfit does not establish the order quantity.
    const twoPiece = [ ...patternsFor('category', segment), ...patternsFor('patternStructure', segment) ]
      .some(({ value }) => value === 'two_piece');
    return twoPiece ? quantities.filter(({ end }) => !/件$/.test(segment.slice(0, end))) : quantities;
  }
  const matches: FieldMatch[] = [];
  const covered = new Set<number>();
  for (const [value, , expression] of requirementFields[field].choices) {
    for (const match of segment.matchAll(new RegExp(expression, 'gi'))) {
      const indexes = Array.from({ length: match[0].length }, (_, index) => match.index + index);
      if (indexes.some((index) => covered.has(index))) continue;
      indexes.forEach((index) => covered.add(index));
      matches.push({ value, start: match.index, end: match.index + match[0].length });
    }
  }
  return matches;
}

function unresolved(field: ConstraintField, quote: string, reason: string, blocking = false): Observation {
  return { field, op: 'eq', value: null, level: 'pending', quote, reason, ...(blocking ? { blocking: true } : {}) };
}

const WITHDRAWAL_REASON = '原话明确撤回该要求。';

export function isExplicitWithdrawal(constraint: Constraint): boolean {
  return constraint.state === 'unknown' && constraint.reason === WITHDRAWAL_REASON && constraint.quote !== null;
}

function predicateFor(field: ConstraintField, value: FieldMatch['value'], excluded: boolean): NonNullable<Constraint['withdraws']> {
  if (field === 'closure' && excluded) {
    return { op: 'eq', value: value === 'visible_buttons' ? 'no_visible_buttons' : 'visible_buttons' };
  }
  return { op: excluded ? 'neq' : 'eq', value };
}

const fieldMentions: Partial<Record<ConstraintField, RegExp>> = {
  color: /颜色|色系|色彩|配色|主色/, fabric: /材质|面料|纯棉|亚麻|锦纶/, care: /洗护|养护|水洗/,
  quantity: /数量|套数|件数/, scene: /场合|场景/, season: /季候|季节/, category: /成衣品类|服装品类/,
  luster: /光泽|亮度/, closure: /门襟|纽扣/, motif: /纹样|图案/, easeAllowance: /松量|松弛余量|袖笼|袖窿/,
  lengthRatio: /衣长|裙长|下摆长度|长度比例/, collar: /领型/, patternStructure: /版型结构|廓形/,
  businessType: /业务类型|定制类型/, craft: /工艺|盘扣|刺绣|珠片|亮片/,
};

function readSegment(segment: string): Observation[] {
  const untouched = /(?:其余|其他|其它|剩下(?:的)?).*$/.exec(segment);
  const clause = untouched && PROTECTED.test(untouched[0]) ? segment.slice(0, untouched.index).trim() : segment;
  if (!clause || PROTECTED.test(clause)) return [];
  const change = CHANGE.exec(clause);
  const changeLead = change ? clause.slice(0, change.index) : '';
  const negativeChange = /(?:不要|不能|不得|不许)(?:再)?(?:把|将|从).{0,12}$/.test(changeLead);
  const offset = change ? change.index + change[0].length : 0;
  const target = clause.slice(offset);
  const observations: Observation[] = [];
  for (const field of requirementFieldIds) {
    const matches = patternsFor(field, target).sort((a, b) => a.start - b.start);
    const mentioned = fieldMentions[field]?.test(target);
    const mandatory = MANDATORY.test(target);
    if (WITHDRAWAL.test(target) && (matches.length || mentioned)) {
      const observed = unresolved(field, clause, WITHDRAWAL_REASON);
      if (matches.length === 1) {
        const { value, start } = matches[0];
        observed.withdraws = predicateFor(field, value, NEGATION.test(target.slice(0, start)));
      }
      observations.push(observed);
      continue;
    }
    const boundedQuantity = field === 'quantity' && /至少|至多|不超过|不少于|超过|以上|以下|[套件身]起/.test(target);
    if ((matches.length || mentioned) && (AMBIGUITY.test(target) || boundedQuantity)) {
      const clearlyRequired = mandatory || boundedQuantity;
      observations.push(unresolved(field, clause, '原话给出的范围或取值尚不确定。', clearlyRequired));
      continue;
    }
    if (!matches.length && mentioned && (mandatory || NEGATION.test(target.slice(0, target.search(fieldMentions[field]!))))) {
      observations.push(unresolved(field, clause, '原话包含目录规则暂不能归一化的要求。', true));
      continue;
    }
    const fieldObservations = matches.map(({ value, start, end }, matchIndex): Observation => {
      const scope = target.slice(0, start).split(/(?:但是|但|却|并且|而且|同时|改要|可以考虑)/).at(-1) ?? '';
      const suffix = target.slice(end, matches[matchIndex + 1]?.start ?? target.length).trim();
      const previous = matches[matchIndex - 1];
      const prevObservation = observations.at(-1);
      const coordinatedExclusion = previous && /^(?:、|或(?:者)?|和|及|与|\/|／)\s*(?:也|同样)?$/.test(target.slice(previous.end, start).trim()) &&
        prevObservation?.field === field && prevObservation.op === 'neq' || EXCLUSION_LIST.test(scope);
      const doubleCareNegative = field === 'care' && /(?:不要|拒绝|不接受|不能用)[^，,；;]{0,8}(?:不能|不可|不支持)\s*$/.test(scope);
      const excluded = !doubleCareNegative && (negativeChange || NEGATION.test(scope) || coordinatedExclusion || FORBIDDEN_AFTER.test(suffix));
      const preferred = (PREFERENCE.test(scope) || PREFERENCE.test(changeLead) || /偏(?:向)?\s*$/.test(scope) ||
        /^(?:也可|亦可|即可|为佳|优先|就好|有(?:当然)?更好)/.test(suffix)) && !MANDATORY.test(scope);
      const categoryOrder = field === 'category' && /(?:想|希望)要?定制/.test(scope);
      const level = (preferred && !categoryOrder) || (!MANDATORY.test(scope) && !change && field === 'luster' && /更亮|亮一点|亮一些/.test(target))
        ? 'preference' : 'hard';
      const observation: Observation = { field, ...predicateFor(field, value, excluded), level, reason: null, quote: clause };
      observations.push(observation);
      return observation;
    });
    if (fieldObservations.length > 1 && ALTERNATIVE.test(target) && fieldObservations.some(({ op }) => op === 'eq')) {
      observations.splice(-fieldObservations.length, fieldObservations.length, unresolved(field, clause, '原话列出多个备选，需要确认取值。', mandatory));
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
  const segments = turn.text.split(/(?:[，,；;。！？!?\n]+|但是|但(?=也|要|不能|不要|必须|可以|希望|不需要)|另外|而且|同时|只是|、(?=(?:不要|要用|只要|还要|不能|必须|最好|希望)))/)
    .map((segment) => segment.trim()).filter(Boolean);
  const constraints = segments.flatMap(readSegment).map((observation, index): Constraint => ({
    ...observation,
    id: `${turn.id}:${observation.field}:${index + 1}`,
    state: observation.level === 'pending' ? 'unknown' : 'explicit',
    sourceTurnId: turn.id,
    verifiedBy: null,
  }));
  return requirementFieldIds.flatMap((field) => {
    let items = constraints.filter((constraint) => constraint.field === field);
    if (field === 'quantity' && items.some(({ op, quote }) => op === 'eq' && /^(?:而)?是/.test(quote ?? ''))) {
      items = items.filter(({ op, quote }) => op !== 'neq' || !/(?:不是|并非)(?:要|订|做)?/.test(quote ?? ''));
    }
    const withdrawalIndex = items.findLastIndex(isExplicitWithdrawal);
    if (withdrawalIndex >= 0) {
      const after = items.slice(withdrawalIndex + 1);
      if (!after.some(({ value }) => value !== null)) return [items[withdrawalIndex]];
      items = after;
    }
    const conflicts = items.some((left, index) => items.slice(index + 1).some((right) => constraintsConflict(left, right)));
    if (conflicts) return [...items.filter(({ level }) => level === 'hard'), {
      ...items[0], id: `${turn.id}:${field}:conflict`, value: null, op: 'eq', level: 'pending', state: 'unknown',
      quote: turn.text.trim(), reason: '同一轮原话包含互相冲突的要求，需要人工确认。', blocking: true,
    } satisfies Constraint];
    const pending = items.findLast(({ state }) => state === 'unknown');
    const concrete = items.filter(({ value }) => value !== null);
    const distinct = concrete.filter((item, index) => !concrete.slice(index + 1).some((other) =>
      other.op === item.op && other.value === item.value && (other.level === item.level || other.level === 'hard')))
      .filter((item) => item.level === 'hard' || !concrete.some((other) =>
        other.op === item.op && other.value === item.value && other.level === 'hard'));
    return pending ? [...distinct, pending] : distinct;
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
  const outstanding = constraints.filter((item) => item.state === 'unknown' && item.sourceTurnId !== null && !isExplicitWithdrawal(item))
    .sort((left, right) => Number(Boolean(right.blocking)) - Number(Boolean(left.blocking)));
  const fields = new Set<ConstraintField>(outstanding.map(({ field }) => field));
  const group = constraints.some((item) => item.field === 'businessType' && item.op === 'eq' && item.value === 'corporate_uniform');
  const priorities = group ? ['care', 'scene', 'quantity'] as const : ['category'] as const;
  for (const field of priorities) {
    if (!constraints.some((item) => item.field === field && (item.state === 'explicit' || item.state === 'confirmed' || isExplicitWithdrawal(item)))) fields.add(field);
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
