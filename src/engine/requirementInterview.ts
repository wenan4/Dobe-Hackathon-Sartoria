import { CRAFTS } from '../data/crafts';
import { FABRICS } from '../data/fabrics';
import { SCENES, sceneFits } from '../data/scenes';
import { splitRequirementClauses } from './requirementClauses';
import { GARMENT_AFTER_CLASSIFIER, matchOrderQuantities, matchPerPersonQuantity, parseFormQuantity } from './requirementQuantity';
import { REQUIREMENT_SCHEMA_VERSION } from '../types/decisions';
import type { ClarificationQuestion, Constraint, ConstraintField, DecisionRequirement, RequirementTurn } from '../types/decisions';
import type { RequirementInput } from '../types/sartoria';

type Choice = readonly [value: string | boolean, label: string, expression: string];

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const catalogColors: readonly Choice[] = FABRICS.filter(({ colorName }) => colorName && !/^未(?:指定|确定)/.test(colorName))
  .toSorted((left, right) => right.colorName.length - left.colorName.length)
  .map((fabric) => [fabric.colorFamily, fabric.colorName, escapePattern(fabric.colorName)]);

const craftAliases: Partial<Record<string, string>> = {
  'crf-haipai-pipa-button': '手工(?:琵琶)?盘扣|琵琶盘扣|盘扣',
  'crf-suzhou-magnolia-embroidery': '暗纹玉兰苏绣|(?:白)?玉兰(?:刺绣|苏绣)',
  'crf-hidden-mandarin-placket': '暗门襟(?:无痕|改良|低){0,3}立领|暗门襟工艺',
  'crf-full-canvas-guiba': '全毛衬(?:手工)?归拔',
  'crf-contrast-piping-cuff': '(?<=袖口[^，,；;。！？!?]{0,8})撞色滚边',
};

const GARMENT_COMPONENT_PAIR = '(?:上装|上衣|上身|外套|夹克)(?:和|跟|与|同|加|配|搭|及|、)(?:裙子|下裙|半身裙|长裙|下装|裤子|长裤)';
const TWO_PIECE_COMPOSITION = [
  `(?:分成|分为|由)${GARMENT_COMPONENT_PAIR}(?:(?:这)?(?:两|二|2|２)件)?`,
  `(?:${GARMENT_COMPONENT_PAIR}|上下(?:装|身|两件)?)(?:必须|需要|应当|分别|各自|做成|可以|得|要|需|都|是|为|能|\\s)*(?:(?:两|二|2|２)件(?:独立|分开的?)(?:单品)?|各自独立|独立(?:成件|制作|成衣|做)?|分穿|分开(?:穿(?:着)?|搭配|制作|做成|做为|裁剪|做|裁)?(?:各自的)?(?:(?:两|二|2|２)件)?)(?!洗|包装|清洗|寄|发货|运输)`,
].join('|');
const TWO_PIECE_OUTFIT = `两件式|两件套|二件式|二件套|两件装|${TWO_PIECE_COMPOSITION}|外套(?:搭|配|和|加|与).{0,5}(?:连衣裙|长裙)|(?:连衣裙|长裙)(?:搭|配|和|加|与).{0,5}外套`;
const WORKWEAR = '工作服|员工服|职业[服装]|工装';
const ORGANIZATION = '公司|企业|单位|部门|门店|店里|柜台|前台|会务组';
const ORGANIZATION_ROLE = '员工|同事|职工|成员|职员';
const CORPORATE_ORDER = [
  '团装|团服|团定|团购|团订|团体(?:定制|订做|订购|订制|采购|下单|款|套装|工装|工作服|职业[服装])',
  '团队(?:工装|制服|统一着装|工作服|职业[服装])|会务服|集体定制|(?:批量|统一)(?:定做|订做|定制)',
  `(?:${ORGANIZATION}|${ORGANIZATION_ROLE})(?:的)?(?:${WORKWEAR}|制服)|(?:统一|集体)(?:${WORKWEAR})`,
  `(?:${ORGANIZATION}|团队)(?=[^，,；;。！？!?]{0,14}(?:统一|集体|批量|集中)(?:采购|订|订购|订做|定制|做|配发|换|下单))`,
  '(?:门店|柜台|前台)(?=(?:(?:这|本)次|这回|这批)?(?:要|准备)?(?:更换|换|补做|补订|补|配发|配|订购|采购|订|定制)[^，,；;。！？!?]{0,10}(?:西服|西装|职业套装|工装|工作服|制服))',
  `(?:${ORGANIZATION_ROLE})(?=[^，,；;。！？!?]{0,6}(?:每人|人均|人手|各自|各人|各配|各发|一人(?:一|领|配|发))[^，,；;。！？!?]{0,8}(?:套|身|件|西装|工作服))`,
  `每(?:一)?(?:个|位|名)(?:${ORGANIZATION_ROLE})(?=(?:都|统一|要|得|分别)*(?:领|配|发|订|做)[^，,；;。！？!?]{0,8}(?:套|身|件|西装|工作服))`,
  `(?:员工|同事|职工|团队)(?:要|均|统一)?穿的.{0,4}(?:${WORKWEAR})|(?:工服|发出?|开|接|下|签)团单|团单(?:采购|下单)`,
  `(?:给|为)(?:整个|我们)?(?:${ORGANIZATION}|团队|员工|职工)(?:的?(?:${ORGANIZATION_ROLE}))?(?=.{0,12}(?:定做|订做|做|定制|配|准备|订))`,
  `(?:给|为).{0,8}(?:${ORGANIZATION_ROLE})(?=.{0,12}(?:每人|各一套|各做|各发|人手|一人一套))|员工服|工作服`,
].join('|');
const PRIVATE_ORDER = [
  '(?:个人|私人|单人)(?:(?:量身|量体|高级)?[定订][制做]|高定)|个人礼服|私定|私订|个人款',
  '只给我自己|我一个人(?:穿|定[制做]|订[做制])|我(?:自己|本人)穿',
  '(?:只)?给(?:我)?(?:自己|本人)(?:做|订[做制]?|定做|定制|准备|量体)|(?:给)?我个人(?:定[制做]|订[做制]?|做|量身)',
  `(?:我(?:来|想|要)?|单独)(?:做|订[做制]?|定[做制])(?=\\s*[一1１]\\s*(?:件|条)${GARMENT_AFTER_CLASSIFIER})`,
].join('|');

export const requirementFields = {
  businessType: { label: '业务类型', choices: [
    ['corporate_uniform', '团体职业服', CORPORATE_ORDER],
    ['private_couture', '个人高定', PRIVATE_ORDER],
  ] },
  quantity: { label: '数量', choices: [] },
  scene: { label: '场景', choices: [
    ...SCENES.map(({ id, name }): Choice => [id, name, escapePattern(name)]),
    ['formal_evening', '正式晚宴', '(?:室内(?:的)?(?:正式)?)?晚宴|晚礼宴|晚会|慈善宴会|正式酒会|(?:晚上|晚间|夜间)[^，,；;。！？!?]{0,12}(?:答谢|庆功)宴'],
    ['indoor_performance', '室内演出', '室内.{0,8}(?:舞台|演出|演奏|表演|演唱|独奏|独唱|合奏)|音乐厅|(?<!露天|户外|室外)剧院|(?<!露天|户外|室外)剧场(?:内|里面|里)?(?:的)?(?:演出|表演|演奏)|室内剧场'],
    ['indoor_formal', '室内正式', '(?:室内|展厅|馆内|会议厅|报告厅).{0,7}(?:正式|会务|峰会|会议|商务|接待|迎宾|典礼|颁奖礼|授奖仪式|论坛)|(?:正式|会务|论坛|会展|接待|颁奖|授奖).{0,7}(?:室内|展厅|馆内)|正式礼厅|会议中心|(?:礼宾接待|会议接待|商务接待)(?!(?:的)?(?:小组|组|队|班|部|科|团队|职工|员工|人员))'],
    ['outdoor_stage', '户外舞台', '(?:户外|室外|露天).{0,7}(?:舞台|台子|演出|演奏|表演|剧场|剧院)|(?:舞台|演出|演奏|表演).{0,4}(?:在|设在)(?:户外|室外|露天)'],
  ] },
  season: { label: '季候', choices: [
    ['spring', '春季', '春季|春天|春款|春日'], ['summer', '夏季', '夏季|夏天|夏款|盛夏|仲夏'],
    ['autumn', '秋季', '秋季|秋天|秋款|秋夜|秋日|深秋|入秋|秋装'], ['winter', '冬季', '冬季|冬天|冬款|寒冬|过冬'],
    ['all_season', '四季通用', '四季通用|四季可穿|全年|不分季节'],
  ] },
  category: { label: '品类', choices: [
    ['two_piece', '两件式', TWO_PIECE_OUTFIT],
    ['suit', '西装套装', '西服套装|西装套装|西服|西装(?!领)|成套西装|(?:商务|通勤|礼宾|职业|正装)套装|男士西礼服'],
    ['dress', '连衣裙／礼服', '连衣裙|连衣礼服|连身礼服|长款?礼服|晚礼服|长裙|礼服裙|礼裙|女(?:士|式|款|装)礼服|(?<=一条)礼服|(?<=(?:做|订|定制)\\s*[0-9０-９一二两三四五六七八九十百]+\\s*条[^，,；;。！？!?]{0,12})裙子'],
    ['jacket', '外套', '外套|夹克|上衣|短褂|罩衫'],
  ] },
  patternStructure: { label: '版型结构', choices: [
    ['h_line', 'H 型直身', '(?:直身|直筒)?[hHＨ]\\s*[型形版线]|(?:字母\\s*)?[hHＨ]\\s*(?:一样|那样)(?:的)?(?:直|笔直)|直身版型|直身结构|直筒版型|直身廓形|从(?:腋下|肩部|肩线|肩头)(?:起|开始)?(?:一直|往|向)?下(?:来)?(?:就|要|得)?(?:笔直|直直|直线|垂直)(?:往下|向下)?(?:落|垂|下)'],
    ['two_piece', '两件式', `上下(?:分成|分为)?两件|${TWO_PIECE_OUTFIT}`],
  ] },
  collar: { label: '领型', choices: [
    ['cross_open', '交领开襟', '交领'], ['diagonal', '斜襟', '斜襟'],
    ['stand', '立领', '立领|竖领|领(?:子|口|型)(?:得|要|必须|应该|就|会)?(?:竖|立)(?:起|起来|着)'],
    ['lapel', '翻领', '(?:(?:西装|西服)(?:的)?)?(?:窄|宽|尖|平){0,2}(?:翻领|驳领)|西装领|西服领|外翻领|(?<=领(?:口|型|子)[^，,；;。！？!?]{0,10})(?:向|往)外翻'],
  ] },
  fabric: { label: '面料', choices: [
    ['blend', '混纺', '(?:棉涤|丝毛|毛丝|涤棉|毛涤)?混纺'], ['silk', '真丝', '纯真丝(?!混纺)|真丝(?!混纺)|桑蚕丝(?!混纺)|纯蚕丝|全蚕丝'],
    ['wool', '羊毛', '纯羊毛(?!混纺)|羊毛(?!混纺)|精纺毛料|全毛(?!衬)|纯毛'], ['polyester', '涤纶', '涤纶(?!混纺)|聚酯(?:纤维)?(?!混纺)'],
    ['acetate', '醋酸', '醋酸(?!混纺)'], ['velvet', '丝绒', '丝绒|天鹅绒'],
  ] },
  color: { label: '色系', choices: [
    ['ivory_rose', '象牙玫瑰', '象牙玫瑰|米白(?:撞|拼|拼接|搭|搭配|配|加|与)(?:亮粉|玫瑰粉)'],
    ['navy', '藏青', '藏青(?:色)?|藏蓝(?:色)?|深海军蓝|海军(?:深|藏)?蓝|深蓝(?:色)?|午夜蓝'],
    ['obsidian', '墨黑', '墨黑|黑色|炭黑|纯黑|纯墨色|墨色'], ['ivory', '象牙白', '象牙白|月白|米白(?:色)?|乳白(?:色)?'],
    ['crimson', '绯红', '绯红|绛红(?:色)?|枣红(?:色)?|深红(?:色)?|酒红(?:色)?|正红(?:色)?'],
    ['stone_gray', '暖灰／深灰', '石板灰|石灰色|暖灰(?:色)?|深灰(?:色)?|炭灰(?:色)?|灰色'],
    ['pine_green', '松绿', '松墨绿|松绿(?:色)?|墨绿(?:色)?|深绿(?:色)?'],
    ['champagne', '香槟', '香槟(?:金|色)'], ['mist_blue', '雾蓝', '雾蓝(?:色)?|浅蓝(?:色)?'],
    ['earth_brown', '大地棕', '大地棕|棕色|咖啡色|土棕|墨褐|茶褐|深褐(?:色)?'], ['neutral_silk', '丝本色', '丝本色|真丝原色'],
  ] },
  motif: { label: '装饰纹样', choices: [
    ['subtle_jacquard', '含蓄暗纹', '(?:织(?:进去|出来|入|造|成|进布面|在布面上)(?:的|去的)?(?:同色|低调|细小)?|同色织(?:的|成的)?)?(?:暗纹|暗花)|低调提花'],
    ['plain', '素面', '素面|纯色(?:且|并且)?无(?:花(?:纹)?|纹(?:样)?|图案)|无纹样|无花纹|无图案'],
  ] },
  lengthRatio: { label: '长度比例', choices: [
    ['mid_hip', '及臀中', '臀中|及臀|臀部(?:正中|中间|中段|中点)|(?:到|至|齐)臀部'],
    ['ankle', '及踝', '及踝|(?:到|至|齐|及)脚踝|到踝部|(?:留|停|落|垂|收)在脚踝'],
    ['floor', '及地', '及地|拖地|曳地|拂地|擦地|落地长|(?:拖|垂|落)(?:到|至)地(?:面|板|上)?|到地(?:面|板)|到地(?=$|\\s|即可|就行)|贴地(?:长)?|贴着地面|裙(?:摆|边|脚)齐地'],
  ] },
  easeAllowance: { label: '松弛余量', choices: [
    ['arm_mobility', '肩臂活动余量', [
      '(?:不要|不能|别|不|避免)压肩|(?:不要|不能|别|不)勒肩|(?:不要|不能|别|不)卡(?:住)?(?:手臂|胳膊|臂|肩)|(?:不|别)夹(?:腋下|胳膊)',
      '(?:抬|举|举起)(?:胳膊|臂|手)(?:时)?(?:、坐奏都要方便|.{0,8}(?:不卡|方便|自然|顺畅|自如|舒展|伸得开|不受限|不紧绷|不(?:能|要|会|可)?(?:被(?:衣服|成衣|袖子|袖口|肩袖))?(?:卡住|扯住|拉住|勒住|牵扯)|有余量|留(?:足|够|出)(?:活动)?余量))',
      '(?:袖子|袖管|胳膊|手臂|双臂).{0,6}(?:抬|举)得(?:起(?:来)?|开|高|动)|肩(?:臂|背)(?:活动)?余量',
      '(?:袖子|袖管|袖口|肩袖)(?:都|千万|绝对|一定)?(?:别|不要|不能|不许|不得)(?:拽住|扯住|牵扯|拉住|卡住|勒住)(?:我|肩(?:膀)?|手臂|胳膊)?',
      '(?:袖笼|袖窿)(?:部位|位置)?(?:需要|必须|应该|宜|要|得)?(?:放量|留(?:足|够|出|有)?(?:活动)?(?:余|松)量|预留(?:活动)?(?:余|松)量)|(?:坐奏|坐着演奏).{0,5}(?:方便|不卡|活动)',
    ].join('|')],
  ] },
  closure: { label: '开合细节', choices: [
    ['no_visible_buttons', '无外露纽扣', '无外露(?:的)?(?:纽扣|扣子|扣)|不(?:要|用|许)(?:看见|露出|外露)(?:纽扣|扣子|扣)|(?:纽扣|扣子|扣件)(?:也|仍然?|还是|始终|一律)?(?:都)?(?:不要|不能|不可|不得|不许|禁止)(?:外露|露(?:出|在外)?)|隐藏纽扣|隐门襟|暗扣|隐扣|无明扣|无扣式'],
    ['visible_buttons', '外露纽扣', '外露(?:的)?(?:纽扣|扣子|扣)|明扣'],
  ] },
  care: { label: '洗护', choices: [
    ['machine_wash', '可机洗', '机洗|机水洗|洗衣机(?:洗)?|滚筒洗'], ['dry_clean', '干洗', '(?:专业(?:的)?|送店)?干洗'], ['hand_wash', '手洗', '手洗|手工水洗'],
  ] },
  wrinkleResistance: { label: '耐皱', choices: [
    [true, '要求耐皱', '耐皱|抗皱|防皱|抗褶皱|免熨|免烫|不(?:易|容易)皱|不(?:易|容易)起(?:褶|皱)|不起(?:皱|褶)|不容易压出折痕'],
    [false, '可接受易皱', '易皱|容易起(?:褶|皱)|容易皱'],
  ] },
  luster: { label: '光泽', choices: [
    ['high', '高光泽', '更亮(?!的?(?:颜色|色系))|亮(?:一点|一些)(?!的?(?:颜色|色系))|太亮|高光泽|高反光|光泽更强|光泽更高|丝光明显|高?亮面|一(?:照|打光|开灯)就(?:很|特别)?(?:晃|刺)眼|(?:晃|刺)眼的?反光|反光(?:很|太|特别)?(?:晃|刺)眼'],
    ['medium', '微光泽', '柔(?:和|润)(?:的)?微光|柔光|微光泽|微亮|微光|少许光泽|有一点光泽'],
    ['low', '低光泽', '低光泽|哑光|消光|低反光|少(?:一)?点反光'],
  ] },
  style: { label: '风格', choices: [
    ['traditional_uniform', '传统制服', '(?:传统|老式)(?:(?:单位|企业|机关|公司|制式|职业|礼宾)(?:的)?)?(?:制服|团装|工装|工服|工作服)|礼宾制服|制服(?:感|味)'],
    ['modern', '现代利落', '现代(?:感|风格|简约|极简|利落|商务|款|造型|(?=$|\\s|一点|一些))|(?:简约|极简|轻)商务|极简(?:风格|风|造型)'],
    ['new_chinese', '新中式', '新中式|改良中式|中式改良'],
  ] },
  craft: { label: '工艺', choices: CRAFTS.map((craft): Choice => [
    craft.id, craft.shortName, [craft.name, craft.shortName, craft.code, craft.id].map(escapePattern)
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
const PREFERENCE = /(?:最好|优先|倾向|偏好|偏爱|尽量|希望|想要|喜欢|中意|更偏|可考虑|对比|更想|建议|提议|有条件的话)/;
const TRAILING_ACTOR = /^(?:(?:我(?:们)?|客户|买方|采购|后勤|行政|设计师|版师)(?:个人|本人|这边)?|个人|本人|这边)\s*/;
const PREFERENCE_AFTER = /^(?:(?:即可|为佳|优先|就好|更好|有(?:当然)?更好)|(?:比较|相对|较|挺|更|蛮|也|还|很|特别|最|倒是)*\s*(不(?:太|那么|怎么)?)?(?:喜欢|偏好|偏爱|中意|看好|倾向))/;
const PERMITTED_BEFORE = /(?:可以|可|允许)(?:采用|选用|用|做成|选|做|使用|考虑)\s*$/;
const PERMITTED_AFTER = /^(?:(?:(?:也|亦|都|同样)\s*)?(?:可以|可|允许)(?:采用|选用|使用|用|选|接受)|(?:(?:也|亦|都)可(?:以)?|可以)$)/;
const MANDATORY = /(?:必须|务必|只能|仅限|(?<!未|没|不)指定|非要|(?<!不)一定要|不可|不能|不允许|不接受|严禁|绝不|不得|不许|禁止|硬性|必选|都得|都要|只准|切忌|谢绝)/;
const NEGATIVE_HEAD = '不能|不可|不要|不得|不许|避免|避开|远离|不接受|不考虑|排除|不想要|不想|不(?:太|那么|怎么)?(?:喜欢|偏好|偏爱|中意)|不希望|不用|不选|不穿|不准|不宜|不像|不做|不采用|不是|不在|不使用|不允许|不支持|别用|别选|别要|别像|别|拒绝|禁止|严禁|禁用|禁|忌用|切忌|谢绝|杜绝|不能有|无外露|无|非(?!要)|绝不';
const NEGATION = new RegExp(`(?:${NEGATIVE_HEAD})(?:\\s|再|给|要|订购|订|挑|选|用|使用|采用|穿|是|有|含有|含|带去|拿去|拿来|拿|把|放进|送去|送到|叫人|弄得|弄成|像|做成|做|那种|类似|太|特别|那么|任何|一样|略带|的)*$`);
const COORDINATOR = /^(?:、|和|或(?:者|是)?|及|与|\/|／)\s*(?:也|同样)?$/;
const FORBIDDEN_AFTER = /^(?:(?:则|都|也|一律|一定|明确|坚决|绝对|完全|仍然?|还|始终|严格|暂且|照样|同样|请)\s*)*(?:不要|不得|不许|不做|不用|不行|不可以|不能用|不允许|不考虑|不接受|不采用|不选|不一样|区别开|禁用|禁止|(?:被)?排除(?:在外)?|排掉|剔除|别(?:再)?(?:拿来|拿|替进来|替换|替|用|选|要|做|加|上|放|考虑)|不准用|禁)/;
const WITHDRAWAL = /(?:撤回|撤销|取消|放弃|去掉|撤掉|不再要求|不要求|不需要|不强求|不强制|不硬性要求|不是必须|并非必须|不必|不用限定|不限制|不再限定|无需|不限|无要求|没有.{0,8}要求|不作要求)/;
const UNAPPROVED_WITHDRAWAL = /(?:(?:尚未|还没(?:有)?|未曾|未经|没有|还未|未)(?:被|能)?(?:获准|得到批准|批准|同意|授权|许可|允许)?|先别|暂不|不能|别)(?:直接|自行|正式|先)?(?:撤回|撤销|取消|作废|去掉|撤掉)/;
const AMBIGUITY = /(?:不确定|未确定|还没确定|不一定|还没决定|未指定|没定|待确认|未定|再说|先不定|待定|待选|没拍板|先(?:留白|留空|空着)|先别(?:填|定|选|决定)|暂不(?:定|选|决定)|随意|都行|都可以|无所谓|看情况|左右|大概|差不多|约(?:为|有)?\s*[\d一二三四五六七八九十]|[\d一二三四五六七八九十]\s*(?:到|至|[-~～])\s*[\d一二三四五六七八九十])/;
const AWAITING_REVIEW = /(?:等.{0,14}(?:再定|再拍|再选|再填|确认|决定|审批|批复|回复|建议|回我|看完|看过|点头|拍板|签(?:字|完)?$)|(?:尚未|还没|仍未)(?:拍板|批|签|点头)|还在(?:核|审|确认)|还(?:得|要|需).{0,14}(?:点头|签字确认|批准|拍板)|(?:得|还要|还需)(?:先|再)?问|(?:看|摸|试|比)(?:完|过|了).{0,9}再(?:定|选|拍|确认|填|决定))/;
const REFERENCE_ONLY = /(?:(?:只|仅)(?:是|供|作|当作|用作|作为)?\s*(?:(?:比例|轮廓|搭配|剪裁)(?:的)?\s*)?(?:参考|对照|示意|备选|候选)|(?:可以|先)(?:放|摆|列)(?:在|入|作|为)?(?:备选|候选)|(?:可作(?:为)?|留作)(?:备选|候选|参考)|不(?:算|作为)正式要求)/;
const PROTECTED = /(?:不动|保持不变|保持原样|不变|保持原来|按原来|照原来|按已(?:经)?确认|按此前确认|沿用已(?:经)?确认|照前一版|保留原|维持原|照旧|维持现状|仍然保留|继续保留|依然保留|(?:还是|仍然?|继续|维持|沿用)(?:用|采用|按|照)?原(?:计划|方案|单)|(?:按|照)原(?:计划|方案|单)|(?:维持|保留|沿用)(?:原)?(?:订单|工单|合同)(?:里|中|上)?的|(?:保留|沿用|维持|还是要)(?:刚|此前|之前|已(?:经)?)(?:签(?:过字)?|确认|定)(?:下|了)?的)/;
const EXPLICIT_CONTINUATION = /(?:照旧|按原来|照原来)(?:\s|继续)*(?:用|采用|选用|走|做|执行)/;
const HISTORICAL_LEAD = /^(?:(?:我(?:们)?|客户|买方|采购|后勤|行政)(?:的)?\s*)?(?:上(?:一)?(?:批|回|次|版|条|套|件)|前一(?:批|回|次|版|件)|旧(?:批次|工单|订单|样衣|样品))/;
const HISTORICAL_ORDER = /(?:去年|前年|上(?:个(?:月|季度|礼拜|星期)|周末?|月|季度)|前(?:一|两)(?:个)?(?:月|周|年)|以前|之前|先前|此前|当时).{0,16}?(?:下(?:了|过)单|下单(?:了|过)|(?:订(?:购|做|制)?|定(?:制|做)?|采购|买|做|签(?:署)?)(?:了|过)|(?:订(?:的|下的)|采购的|签(?:署|下)?的)(?:订单|工单|合同))/;
const HISTORICAL_REPORT = /(?:之前|先前|此前|原先|早先)(?:曾经?|曾)?(?:传(?:闻|言)?|说(?:过)?|提(?:过)?|写(?:过)?|要求(?:过)?)(?:的)?是/;
const LOANED_SAMPLE = /(?:试穿|试过|试了)(?:过|了)?(?:借来的|旧的|旧样|上(?:一)?(?:批|回|次|版))/;
const CURRENT_CONTEXT = /(?:(?:这次|本次|这回|本轮|现在|目前|现已|最终|今年)(?=.{0,18}(?:要|用|改|定|签|确认|敲定|穿|执行|保留|按|走))|(?:仍然?|继续|照常)(?=要求|执行|采用|用|按|做))/;
const REFERENCE_IMAGE = '(?:照片|图片|样图|效果图|参考图|剧照|样照|(?:试衣|试穿|排练|舞台|演出)照)';
const REFERENCE_ARTIFACT = new RegExp(`${REFERENCE_IMAGE}(?:里(?:面)?|中|上(?:面)?|这张|那张)?(?:的[^，,；;。！？!?]{0,16})?$|(?:张|幅|拍的|发来的|发的|给的)[^，,；;。！？!?]{0,18}照$`);
const ADOPTED_REFERENCE = new RegExp(`(?:按|照)(?:着)?(?:这张|那张|该)?${REFERENCE_IMAGE}(?:里(?:面)?|中|上(?:面)?)的.{1,14}(?:做|用|选|定|打版|留料)$`);
const REPORTED_QUESTION = /问(?:了|过)?[^，,；;。！？!?]{0,8}?(?:能不能|可不可以|是否|怎么|能否)/;
const PROPOSED_ACTION = /^(?:添[加上]|加(?:上)?|补(?:上)?|采用|选用|用|做|换成|改(?:成|为))/;
const CANCEL_PROPOSED_CHANGE = /(?:取消|撤销|撤回|收回|不采纳|不批准)(?:刚才|本次|这次|这项|那项|这条).{0,18}(?:改动|改稿|变更|调整|修改|提议|建议|请求)/;
const CHANGE = /(?:改回(?:成|为)?|换回(?:成|为)?|改成|改为|换成|换为|替换为|调整为|调整成|调整到|追加至|加到|增至|增加到|减至|减到|缩减到|提高到|降到|改用|换用|改做|(?<![修更篡])改(?!良|进|善|造|版|动|编|过|写|稿)(?=\S))/;
const ALTERNATIVE = /(?:或(?:者|是)?|二选一|择一|任选)/;
function patternsFor(field: ConstraintField, segment: string): FieldMatch[] {
  if (field === 'quantity') {
    const twoPiece = [...patternsFor('category', segment), ...patternsFor('patternStructure', segment)]
      .some(({ value }) => value === 'two_piece');
    return matchOrderQuantities(segment, twoPiece);
  }
  const matches: FieldMatch[] = [];
  const covered = new Set<number>();
  const choices = field === 'color' ? [...catalogColors, ...requirementFields.color.choices] : requirementFields[field].choices;
  for (const [value, , expression] of choices) {
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
const REFERENCE_REASON = '原话只将该项列为参考或备选，取值尚未指定。';

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
  color: /颜色|色系|色彩|色调|色号|配色|主色|色卡|紫色|粉色|橙色|黄色|红色|宝蓝|靛蓝|天蓝|橄榄绿|荧光绿|芥末黄|柠檬黄|浅紫|紫红|桃粉/,
  fabric: /材质|面料|布料|用料|料子|主料|织物|纤维成分|成分(?:比例)?|纯棉|棉质|亚麻|苎麻|锦纶|聚酰胺|真皮|皮革|莱赛尔|天丝|粘胶/,
  care: /洗护(?:方式|方法)?|养护(?:方式|方法)?|清洗(?:方式|方法)|护理方式|洗标|打理方式|水洗/,
  quantity: /数量|套数|件数/, scene: /场合|场景|场地(?!方|经理|协调|负责|管理|人员|同事)/, season: /季候|季节/, category: /成衣品类|服装品类/,
  luster: /光泽|亮度/, closure: /门襟(?!\s*(?:工艺|刺绣|装饰|纹样|钉缀|图案))|纽扣|扣子|扣合方式/, motif: /纹样|图案/,
  easeAllowance: /松量|松弛余量|袖笼|袖窿|肩臂活动|肩背活动|袖管活动/, lengthRatio: /衣长|裙长|裙脚|裙摆|下摆|长度比例/,
  collar: /领型/, patternStructure: /版型结构|廓形/,
  businessType: /业务类型|定制类型/, craft: /工艺|盘扣|刺绣|珠片|亮片/,
};

type LocatedField = Pick<FieldMatch, 'start' | 'end'> & { field: ConstraintField };

function catalogScopedMatches(field: ConstraintField, matches: FieldMatch[], target: string, craftMatches: FieldMatch[], collarMatches: FieldMatch[]) {
  if (field === 'craft') return matches;
  return matches.filter((match) => {
    if (craftMatches.some(({ start, end }) => start <= match.start && end >= match.end &&
      /(?:工艺|织法|缝法|点缀|缝制).{0,8}$/.test(target.slice(0, start)))) return false;
    if (field === 'category') {
      if (collarMatches.some(({ start, end }) => start <= match.start && end >= match.end)) return false;
      if (match.value === 'two_piece' && (/(?:版型|结构|廓形|剪裁).{0,5}$/.test(target.slice(0, match.start)) ||
        /^(?:的)?(?:结构|构成|版型)/.test(target.slice(match.end)))) return false;
    }
    if (field === 'businessType' && match.value === 'corporate_uniform' && /(?:传统|老式)(?:的)?$/.test(target.slice(0, match.start))) return false;
    if (field === 'fabric' && (/(?:仿|仿制|像|仿若|形似|类似|接近)\s*$/.test(target.slice(0, match.start)) ||
      /^(?:般|一样|似的|手感|质感|效果|光感)/.test(target.slice(match.end)))) return false;
    if (field === 'collar' && match.value === 'diagonal' && !/领(?:子|口|型).{0,7}$/.test(target.slice(0, match.start)) &&
      craftMatches.some(({ start }) => start >= match.end && /^(?:部位|处|上|工艺|位置)?\s*(?:指定|使用|选用|用|缀|缝|做|加)$/.test(target.slice(match.end, start)))) return false;
    return true;
  });
}

function explicitlyRequired(prefix: string, trailing: string, statusScope: string): boolean {
  return MANDATORY.test(statusScope) || NEGATION.test(prefix) || FORBIDDEN_AFTER.test(trailing) ||
    !PREFERENCE.test(statusScope) && /(?:需要|限定|必须|锁定|只能|只用|要用|得用|只接受|非得|固定|最少|至少|至多)/.test(statusScope);
}

function trailingStance(suffix: string, field: ConstraintField): string {
  const label = fieldMentions[field]?.exec(suffix);
  const afterLabel = label?.index === 0 ? suffix.slice(label[0].length).trimStart() : suffix;
  return afterLabel.replace(/^(?:本身|这一(?:项|款|类|种)|这(?:款|类|种))\s*/, '').replace(TRAILING_ACTOR, '');
}

const LEADING_STANCE = new RegExp(`^(?:${NEGATIVE_HEAD}|${MANDATORY.source}|${PREFERENCE.source}|请|只用|可以|可用|要用|得用|改用)`);

function gapBoundary(gap: string, left: LocatedField, right: LocatedField): number {
  const trimmed = gap.trimStart();
  const trailing = trailingStance(trimmed, left.field);
  const predicate = FORBIDDEN_AFTER.exec(trailing) ?? PERMITTED_AFTER.exec(trailing) ?? PREFERENCE_AFTER.exec(trailing);
  const nextLabel = fieldMentions[right.field]?.exec(gap);
  if (predicate) {
    const end = gap.length - trailing.length + predicate[0].length;
    if (LEADING_STANCE.test(gap.slice(end).trimStart()) || (nextLabel?.index ?? -1) >= end) return end;
  }
  return nextLabel?.index ?? 0;
}

function nearbyLanguage(target: string, current: LocatedField, anchors: LocatedField[]) {
  const closestBefore = (start: number) => anchors.findLast(({ end }) => end <= start);
  const closestAfter = (end: number) => anchors.filter(({ start }) => start >= end)
    .sort((left, right) => left.start - right.start)[0];
  let start = current.start;
  let previous = closestBefore(start);
  while (previous && COORDINATOR.test(target.slice(previous.end, start).trim())) {
    start = previous.start;
    previous = closestBefore(start);
  }
  const fromPrevious = target.slice(previous?.end ?? 0, start);
  const prefix = previous ? fromPrevious.slice(gapBoundary(fromPrevious, previous, current)) : fromPrevious;
  // A predicate after a coordinated list can govern each of its members.
  let last = current;
  let following = closestAfter(last.end);
  while (following && COORDINATOR.test(target.slice(last.end, following.start).trim())) {
    last = following;
    following = closestAfter(last.end);
  }
  const towardNext = target.slice(last.end, following?.start ?? target.length);
  const suffix = (following ? towardNext.slice(0, gapBoundary(towardNext, last, following)) : towardNext).trim();
  return { prefix, suffix, trailing: trailingStance(suffix, last.field), statusScope: prefix + target.slice(current.start, current.end) + suffix };
}

function readSegment(segment: string, mode: 'initial' | 'revision' = 'revision'): Observation[] {
  const untouched = /(?:其余|其他|其它|剩下(?:的)?).*$/.exec(segment);
  let clause = untouched && PROTECTED.test(untouched[0]) ? segment.slice(0, untouched.index).trim() : segment;
  const history = HISTORICAL_LEAD.exec(clause) ?? HISTORICAL_REPORT.exec(clause) ?? HISTORICAL_ORDER.exec(clause) ?? LOANED_SAMPLE.exec(clause);
  if (history) {
    const backgroundEnd = history.index + history[0].length;
    const current = CURRENT_CONTEXT.exec(clause.slice(backgroundEnd));
    if (current) clause = clause.slice(backgroundEnd + current.index);
    else {
      const earlier = clause.slice(0, history.index).trimEnd();
      if (!CURRENT_CONTEXT.test(earlier)) return [];
      clause = earlier;
    }
  }
  const protectedStatement = PROTECTED.test(clause) && (mode === 'revision' || !EXPLICIT_CONTINUATION.test(clause));
  const referenceOnly = REFERENCE_ARTIFACT.test(clause) && !ADOPTED_REFERENCE.test(clause);
  if (!clause || protectedStatement || referenceOnly ||
    UNAPPROVED_WITHDRAWAL.test(clause) || CANCEL_PROPOSED_CHANGE.test(clause)) return [];
  const question = REPORTED_QUESTION.exec(clause);
  const directive = question ? clause.slice(question.index + question[0].length).trimStart() : clause;
  if (question && !PROPOSED_ACTION.test(directive)) return [];
  const change = CHANGE.exec(directive);
  const changeLead = change ? directive.slice(0, change.index) : '';
  const proposal = Boolean(question) || PREFERENCE.test(changeLead);
  const negativeChange = /(?:不要|不能|不得|不许|别|不)(?:再)?(?:(?:把|将|从).{0,12})?$/.test(changeLead);
  const offset = change ? change.index + change[0].length : 0;
  const target = directive.slice(offset);
  const craftMatches = patternsFor('craft', target);
  const collarMatches = patternsFor('collar', target);
  const replacedCrafts = change && !negativeChange && !proposal && craftMatches.length
    ? patternsFor('craft', changeLead).filter(({ value }) => !craftMatches.some((next) => next.value === value)) : [];
  const matchesByField = requirementFieldIds.map((field) => ({
    field,
    matches: catalogScopedMatches(field,
      field === 'craft' ? craftMatches : field === 'collar' ? collarMatches : patternsFor(field, target),
      target, craftMatches, collarMatches).sort((left, right) => left.start - right.start),
  }));
  const venueNames = matchesByField.find(({ field }) => field === 'scene')?.matches
    .filter(({ value }) => SCENES.some(({ id }) => id === value)) ?? [];
  for (const found of matchesByField) {
    if (found.field !== 'scene') found.matches = found.matches.filter((item) =>
      !venueNames.some(({ start, end }) => start <= item.start && item.end <= end));
  }
  const recognized = matchesByField.flatMap(({ field, matches }) => matches.map(({ start, end }) => ({ field, start, end })));
  const fields = matchesByField.map(({ field, matches }) => {
    const hint = fieldMentions[field];
    const mention = !matches.length && hint ? [...target.matchAll(new RegExp(hint.source, 'g'))].find((item) =>
      !recognized.some(({ start, end }) => start <= item.index && end >= item.index + item[0].length),
    ) : undefined;
    return { field, matches, mention };
  });
  const anchors = [...recognized, ...fields.flatMap(({ field, mention }): LocatedField[] => mention
    ? [{ field, start: mention.index, end: mention.index + mention[0].length }] : [])]
    .sort((left, right) => left.end - right.end);
  const observations: Observation[] = [];
  for (const { field, matches, mention } of fields) {
    if (field === 'craft') {
      observations.push(...replacedCrafts.map(({ value, start }) => ({
        ...unresolved(field, clause, WITHDRAWAL_REASON),
        withdraws: predicateFor(field, value, NEGATION.test(changeLead.slice(0, start))),
      })));
    }
    if (!matches.length && mention) {
      const { prefix, trailing, statusScope } = nearbyLanguage(target, { field, start: mention.index, end: mention.index + mention[0].length }, anchors);
      if (WITHDRAWAL.test(statusScope)) observations.push(unresolved(field, clause, WITHDRAWAL_REASON));
      else if (AMBIGUITY.test(statusScope) || AWAITING_REVIEW.test(statusScope)) observations.push(unresolved(field, clause, '原话给出的范围或取值尚不确定。', MANDATORY.test(statusScope)));
      else if (explicitlyRequired(prefix, trailing, statusScope)) observations.push(unresolved(field, clause, '原话包含目录规则暂不能归一化的要求。', true));
      continue;
    }
    const fieldObservations = matches.map(({ value, start, end }): Observation => {
      const { prefix, suffix, trailing, statusScope } = nearbyLanguage(target, { field, start, end }, anchors);
      if (REFERENCE_ONLY.test(statusScope)) return unresolved(field, clause, REFERENCE_REASON);
      if (WITHDRAWAL.test(statusScope)) {
        return { ...unresolved(field, clause, WITHDRAWAL_REASON), withdraws: predicateFor(field, value, NEGATION.test(prefix)) };
      }
      const mandatory = MANDATORY.test(prefix) || MANDATORY.test(suffix);
      const boundedQuantity = field === 'quantity' && /至少|至多|不超过|不少于|超过|以上|以下|[套件身]起/.test(statusScope);
      if (AMBIGUITY.test(statusScope) || AWAITING_REVIEW.test(statusScope) || boundedQuantity) {
        return unresolved(field, clause, '原话给出的范围或取值尚不确定。', mandatory || boundedQuantity);
      }
      const explicitComposition = field === 'fabric' && /\d[\d.]*\s*(?:%|％)|百分之[零一二两三四五六七八九十百\d]+|[一二两三四五六七八九]成/.test(statusScope);
      const measuredFit = (field === 'easeAllowance' || field === 'lengthRatio') && /(?:\d|[一二两三四五六七八九十])\s*(?:公分|厘米|毫米|cm\b|mm\b)/i.test(statusScope);
      if ((explicitComposition || measuredFit) && explicitlyRequired(prefix, trailing, statusScope)) {
        return unresolved(field, clause, '原话要求核验具体数值，待人工补证。', true);
      }
      const doubleCareNegative = field === 'care' && /(?:不要|拒绝|不接受|不能用)[^，,；;]{0,8}(?:不能|不可|不支持)\s*$/.test(prefix);
      const exclusiveCareExcluded = field === 'care' && /(?:不能|不要|拒绝|不接受|避开|不选|谢绝)(?:再)?(?:选|用|买|采用|接受|要)?(?:必须|只能|仅能|只可|仅可|仅限|只允许)\s*$/.test(prefix);
      const trailingPreference = PREFERENCE_AFTER.exec(trailing);
      const permitted = (field !== 'care' && PERMITTED_BEFORE.test(prefix)) || PERMITTED_AFTER.test(trailing);
      const excluded = !doubleCareNegative && (negativeChange || NEGATION.test(prefix) || FORBIDDEN_AFTER.test(trailing) ||
        Boolean(trailingPreference?.[1]) || exclusiveCareExcluded);
      const preferred = PREFERENCE.test(prefix) || proposal || /偏(?:向)?\s*$/.test(prefix) || trailingPreference !== null;
      if (mode === 'initial' && permitted && !preferred && !mandatory && !excluded) {
        return unresolved(field, clause, REFERENCE_REASON);
      }
      const categoryOrder = field === 'category' && /(?:想|希望)要?定制/.test(prefix);
      const level = !mandatory && ((preferred || permitted) && !categoryOrder ||
        (!change && field === 'luster' && /更亮|亮一点|亮一些/.test(statusScope)))
        ? 'preference' : 'hard';
      return { field, ...predicateFor(field, value, excluded), level, reason: null, quote: clause };
    });
    const alternatives = new Set<number>();
    for (let index = 1; index < matches.length; index++) {
      const left = matches[index - 1];
      const right = matches[index];
      const gap = target.slice(left.end, right.start).trim();
      if (left.value === right.value || !ALTERNATIVE.test(gap) || !COORDINATOR.test(gap)) continue;
      if (fieldObservations[index - 1].op === 'neq' && fieldObservations[index].op === 'neq') continue;
      alternatives.add(index - 1);
      alternatives.add(index);
    }
    observations.push(...fieldObservations.filter((_, index) => !alternatives.has(index)));
    if (alternatives.size) observations.push(unresolved(field, clause, '原话列出多个备选，需要确认取值。',
      [...alternatives].some((index) => MANDATORY.test(nearbyLanguage(target, { field, ...matches[index] }, anchors).prefix))));
  }
  return observations;
}

type ConstraintPredicate = Pick<Constraint, 'field' | 'op' | 'value'>;

export function constraintPredicatesConflict(left: ConstraintPredicate, right: ConstraintPredicate): boolean {
  if (left.field === 'scene' && right.field === 'scene' && left.value !== null && right.value !== null) {
    const named = [left, right].find((item) => SCENES.some(({ id }) => id === item.value));
    if (named) {
      const other = named === left ? right : left;
      const fits = sceneFits(String(named.value), String(other.value));
      if (named.op === 'eq') return fits !== undefined && (other.op === 'eq' ? !fits : fits);
      return other.op === 'eq' && named.value === other.value;
    }
  }
  return left.field === right.field && left.value !== null && right.value !== null && (
    left.field !== 'craft' && left.op === 'eq' && right.op === 'eq' && left.value !== right.value ||
    left.op !== right.op && left.value === right.value
  );
}

export function constraintsConflict(left: Constraint, right: Constraint): boolean {
  return left.level === 'hard' && right.level === 'hard' && constraintPredicatesConflict(left, right);
}

function standaloneGarment(item: Constraint, observations: Constraint[]): boolean {
  if (item.field !== 'category' || item.value !== 'jacket' && item.value !== 'dress' || item.op !== 'eq' || !item.quote) return true;
  const localFields = observations.filter((other) => other.quote === item.quote && other.value !== null);
  const localOutfit = localFields.some(({ field, op, value }) =>
    (field === 'category' || field === 'patternStructure') && op === 'eq' && value === 'two_piece');
  if (localOutfit && new RegExp(`(?:${TWO_PIECE_COMPOSITION}|${GARMENT_COMPONENT_PAIR})`).test(item.quote)) return false;
  if (localFields.some(({ field }) => field === 'quantity')) return true;
  const componentDescription = /^(?:这套的|其中的?|套装的|演出服的|配套的?)?(?:外套|夹克|上衣|下装|长裙|连衣裙)(?:的)?(?=颜色|配色|袖|领|下摆|衣长|裙长|面料|洗护|采用|用|选|定|控制|换|改|做|需|应|必须|要|只|建议)/;
  if (!componentDescription.test(item.quote)) return true;
  return !localFields.some(({ field }) =>
    ['collar', 'lengthRatio', 'fabric', 'color', 'luster', 'closure', 'motif', 'style', 'craft', 'easeAllowance', 'care'].includes(field));
}

export function extractRevisionConstraints(turn: RequirementTurn, mode: 'initial' | 'revision' = 'revision'): Constraint[] {
  const clauses = splitRequirementClauses(turn.text);
  const observations = clauses.flatMap((clause, index) => {
    const found = readSegment(clause.text, mode);
    const previous = clauses[index - 1];
    if (!previous || !/^(?:每(?:一)?[个名人位]|一[人位]|人[均手]|各)/u.test(clause.text) ||
      !/^[，,；;\s]+$/u.test(turn.text.slice(previous.end, clause.start))) return found;
    const source = turn.text.slice(previous.start, clause.end);
    const allocation = matchPerPersonQuantity(source);
    if (!allocation || allocation.start >= clause.start - previous.start) return found;
    return [...found.filter(({ field }) => field !== 'quantity'),
      ...readSegment(source, mode).filter(({ field }) => field === 'quantity')];
  });
  const constraints = observations.map((observation, index): Constraint => ({
    ...observation,
    id: `${turn.id}:${observation.field}:${index + 1}`,
    state: observation.level === 'pending' ? 'unknown' : 'explicit',
    sourceTurnId: turn.id,
    verifiedBy: null,
  }));
  const twoPieceOrder = constraints.some(({ field, op, value }) =>
    (field === 'category' || field === 'patternStructure') && op === 'eq' && value === 'two_piece');
  return requirementFieldIds.flatMap((field) => {
    let items = constraints.filter((constraint) => constraint.field === field && (!twoPieceOrder || standaloneGarment(constraint, constraints)));
    if (field === 'quantity' && items.some(({ op, quote }) => op === 'eq' && /^(?:而)?是/.test(quote ?? ''))) {
      items = items.filter(({ op, quote }) => op !== 'neq' || !/(?:不是|并非)(?:要|订|做)?/.test(quote ?? ''));
    }
    const withdrawalIndex = items.findLastIndex(isExplicitWithdrawal);
    const targetedCraftWithdrawals = field === 'craft' && withdrawalIndex >= 0 && Boolean(items[withdrawalIndex].withdraws);
    if (withdrawalIndex >= 0 && !targetedCraftWithdrawals) {
      const after = items.slice(withdrawalIndex + 1);
      if (!after.some(({ value }) => value !== null)) return [items[withdrawalIndex]];
      items = after;
    }
    const conflicts = items.some((left, index) => items.slice(index + 1).some((right) => constraintsConflict(left, right)));
    if (conflicts) return [...items.filter(({ level }) => level === 'hard'), {
      ...items[0], id: `${turn.id}:${field}:conflict`, value: null, op: 'eq', level: 'pending', state: 'unknown',
      quote: turn.text.trim(), reason: '同一轮原话包含互相冲突的要求，需要人工确认。', blocking: true,
    } satisfies Constraint];
    const withdrawals = targetedCraftWithdrawals ? items.filter((item, index) => item.withdraws &&
      !items.slice(index + 1).some((next) => next.op === item.withdraws!.op && next.value === item.withdraws!.value)) : [];
    const hasChosenValue = items.some((item) => item.op === 'eq' && item.value !== null);
    const pending = items.findLast((item) => item.state === 'unknown' && !isExplicitWithdrawal(item) &&
      (item.reason !== REFERENCE_REASON || !hasChosenValue));
    const concrete = items.filter((item, index) => item.value !== null && !items.slice(index + 1).some((next) =>
      next.withdraws?.op === item.op && next.withdraws.value === item.value));
    const distinct = concrete.filter((item, index) => !concrete.slice(index + 1).some((other) =>
      other.op === item.op && other.value === item.value && (other.level === item.level || other.level === 'hard')))
      .filter((item) => item.level === 'hard' || !concrete.some((other) =>
        other.op === item.op && other.value === item.value && other.level === 'hard'));
    return [...withdrawals, ...distinct, ...(pending ? [pending] : [])];
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
  const formQuantity = parseFormQuantity(input.groupSize);
  return {
    businessType: input.businessType, season: input.season, scene: sceneContext[input.targetSceneId],
    quantity: input.presetDemoId && formQuantity ? formQuantity : undefined,
    ...(input.presetDemoId === 'official-case-6' ? officialSixSuggestions : {}),
  };
}

export function buildLocalDecisionRequirement(input: RequirementInput): DecisionRequirement {
  const firstTurn = { id: 'brief-1', text: input.rawNarrative };
  const observations = extractRevisionConstraints(firstTurn, 'initial');
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
