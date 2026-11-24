import type { ConstraintField, ConstraintValue } from '../src/types/decisions';
import type { CatalogExpectation, Fixture } from './fixtures';

function eq(field: ConstraintField, value: ConstraintValue, quote: string, sourceTurnId = 't1') {
  return { field, op: 'eq' as const, value, quote, sourceTurnId };
}

function neq(field: ConstraintField, value: ConstraintValue, quote: string) {
  return { field, op: 'neq' as const, value, quote, sourceTurnId: 't1' };
}

function eligible(source: string, requiredIds?: readonly string[]): CatalogExpectation {
  return requiredIds ? { outcome: 'eligible', source, requiredIds } : { outcome: 'eligible', source };
}

const softSuit = 'pat-minimal-unstructured-blazer';
const standSuit = 'pat-haipai-suit-ensemble';
const lapelSuit = 'pat-haipai-suit-ensemble-lapel';
const navyTwill = 'fab-demo-navy-washable-twill';
const navyBlend = 'fab-demo-navy-lustrous-blend';
const navySilk = 'fab-demo-navy-silk-satin';
const navyWool = 'fab-bund-navy-wool130';
const grayBlend = 'fab-shikumen-stone-gray';
const greenBlend = 'fab-shanghai-pine-green';
const stagePattern = 'pat-official-stage-twopiece';
const stageFabric = 'fab-official-ivory-rose-stage';

const stageCatalog = eligible(
  'src/data/decisionCatalog.ts 的 PT-103 为两件式，支持抬臂并可做 1–16 套。FB-003 是对应的活动主料，版型和面料静态资料均列户外舞台和秋季，也覆盖夏季。',
  [stagePattern, stageFabric],
);

const grayCareMissing: CatalogExpectation = {
  outcome: 'no-match',
  source: 'src/data/fabrics.ts 给出团装暖灰 FB-202，src/data/decisionCatalog.ts 中数量及立领版型相容，但未录入洗护方式。其他团装可核料均不是暖灰。',
  blockers: [{ assetId: grayBlend, field: 'care', kind: 'unknown-attribute', source: 'src/data/decisionCatalog.ts · FB-202 未填 care。' }],
};

const lowLusterWash = eligible(
  'src/data/decisionCatalog.ts 的 FB-211 是低光泽、耐皱、可机洗的藏青涤纶，可与 PT-301 和 CR-211 搭配。',
  [softSuit, navyTwill],
);

const highLusterWash = eligible(
  'src/data/decisionCatalog.ts 的 FB-212 是高光、耐皱、可机洗的藏青混纺，可与 PT-301 和 CR-212 搭配。',
  [softSuit, navyBlend],
);

const firstRevisionBase = [
  eq('businessType', 'corporate_uniform', '走企业团装'),
  eq('quantity', 56, '第一批锁56套'),
  eq('color', 'navy', '颜色定藏青'),
  eq('care', 'machine_wash', '成衣得能机洗'),
  eq('wrinkleResistance', true, '面料也必须抗皱'),
];
const firstRevisionFields = ['businessType', 'quantity', 'color', 'care', 'wrinkleResistance'];
const bright = eq('luster', 'high', '光泽改成高亮面', 't2');

const secondRevisionBase = [
  eq('businessType', 'corporate_uniform', '按公司团装下单'),
  eq('quantity', 30, '首批核准30套'),
  eq('category', 'suit', '品类定西服套装'),
  eq('collar', 'stand', '必须做立领'),
  eq('color', 'navy', '全组用深藏蓝'),
];
const secondRevisionFields = ['businessType', 'quantity', 'category', 'collar', 'color', 'care'];
const secondRevisionUnknowns = [{ field: 'care', reason: '洗标和护理方式等待供应商核定。' }];
const secondRevisionCatalog = eligible(
  'src/data/decisionCatalog.ts 的 PT-201 立领套装支持 30 套，藏青 FB-201 与之配套，数量在其核定区间。',
  [standSuit, navyWool],
);

const thirdRevisionCommon = [
  eq('businessType', 'corporate_uniform', '是团体职业装'),
  eq('quantity', 28, '数量批了28套'),
  eq('season', 'spring', '只在春季启用'),
  eq('scene', 'scene-bund-protocol', '正式文化礼厅内使用'),
];
const thirdRevisionFields = ['businessType', 'quantity', 'season', 'scene'];
const thirdRevisionBase = [...thirdRevisionCommon, eq('color', 'navy', '主色定藏青')];
const thirdRevisionNavy = eligible(
  'src/data/decisionCatalog.ts 和版型、面料静态表支持礼厅春季 28 套。PT-201 或 PT-201-L 可用 FB-201，普通领型与面料护理均未设限制。',
);

const fourthRevisionCommon = [
  eq('businessType', 'private_couture', '按私人定制做'),
  eq('quantity', 2, '一共要2件'),
  eq('category', 'jacket', '品类就是外套'),
  eq('patternStructure', 'h_line', '版型必须是H型'),
  eq('season', 'spring', '只给春季穿'),
];
const fourthRevisionFields = ['businessType', 'quantity', 'category', 'patternStructure', 'season'];
const fourthRevisionBaseColor = eq('color', 'obsidian', '主料要黑色');
const fourthRevisionStand = eq('collar', 'stand', '领型换成立领', 't2');

const fifthRevisionBase = [
  eq('businessType', 'private_couture', '按私人定制接单'),
  eq('quantity', 1, '只订一套'),
  eq('season', 'autumn', '秋季穿'),
  eq('scene', 'scene-outdoor-stage', '地点就是户外舞台'),
  eq('category', 'two_piece', '品类就填两件式演出服'),
  eq('patternStructure', 'two_piece', '外套和裙子必须分开做成两件'),
  eq('easeAllowance', 'arm_mobility', '抬胳膊拉琴必须不受限'),
];
const fifthRevisionFields = ['businessType', 'quantity', 'season', 'scene', 'category', 'patternStructure', 'easeAllowance', 'care'];
const fifthRevisionCarePending = { field: 'care', reason: '样衣出齐前不定正式洗护要求。' };
const ankleHem = eq('lengthRatio', 'ankle', '裙摆长度定到脚踝', 't2');

const sixthRevisionCommon = [
  eq('businessType', 'corporate_uniform', '公司团装'),
  eq('quantity', 38, '确认做38套'),
  eq('category', 'suit', '按职业西服套装开单'),
  eq('collar', 'stand', '指定小立领'),
];
const sixthRevisionFields = ['businessType', 'quantity', 'category', 'collar'];
const sixthRevisionGray = eq('color', 'stone_gray', '主色必须暖灰');
const sixthRevisionDry = eq('care', 'dry_clean', '洗护改用专业干洗', 't2');

export const HOLDOUT3_FIXTURES: readonly Fixture[] = [
  {
    id: 'independent-01', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '师傅，我想给家里人办个私定单，三件外套。都做直筒H型，衣摆到臀部正中。颜色还拿不准，先给设计师留白。',
      hard: [
        eq('businessType', 'private_couture', '办个私定单'), eq('quantity', 3, '三件外套'),
        eq('category', 'jacket', '三件外套'), eq('patternStructure', 'h_line', '都做直筒H型'),
        eq('lengthRatio', 'mid_hip', '衣摆到臀部正中'),
      ],
      unknowns: [{ field: 'color', reason: '颜色尚未拍板。' }],
      catalog: eligible('src/data/decisionCatalog.ts 有臀中 H 型 PT-101、PT-102、PT-104、PT-106；例如 PT-101 或 PT-104 均可搭 FB-001。'),
    }],
  },
  {
    id: 'independent-02', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '帮园区前台订一批企业工装，四十四套西装套装，春天上身，平驳领不能变。松墨绿我个人挺喜欢，采购还没批色。接待摆在哪儿也得等场务回话。',
      hard: [
        eq('businessType', 'corporate_uniform', '一批企业工装'), eq('quantity', 44, '四十四套西装套装'),
        eq('category', 'suit', '西装套装'), eq('season', 'spring', '春天上身'), eq('collar', 'lapel', '平驳领不能变'),
      ],
      unknowns: [
        { field: 'color', reason: '松墨绿是个人倾向，采购未定色。' },
        { field: 'scene', reason: '接待地点由场务另行确定。' },
      ],
      catalog: eligible('src/data/decisionCatalog.ts 和 src/data/patterns.ts 中 PT-201-L、PT-301 均为春季可用驳领团装；可配 FB-201，面料不限为此一款。'),
    }],
  },
  {
    id: 'independent-03', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '夏天七位琴师去户外舞台演出，七套分别量身走私人订制。品类写演出两件套，上装和下裙得是两件独立单品。袖笼必须放量，抬手运弓不能被衣服扯住。',
      hard: [
        eq('season', 'summer', '夏天七位琴师'), eq('scene', 'scene-outdoor-stage', '去户外舞台演出'),
        eq('quantity', 7, '七套分别量身'), eq('businessType', 'private_couture', '走私人订制'),
        eq('category', 'two_piece', '品类写演出两件套'), eq('patternStructure', 'two_piece', '上装和下裙得是两件独立单品'),
        eq('easeAllowance', 'arm_mobility', '抬手运弓不能被衣服扯住'),
      ],
      unknowns: [], catalog: stageCatalog,
    }],
  },
  {
    id: 'independent-04', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '秋季那场外滩老洋房晚宴，我要私人定做一件女式礼服，裙长认曳地款，主料用绯红丝绒。领型我得看图才能签。',
      hard: [
        eq('season', 'autumn', '秋季那场'), eq('scene', 'scene-bund-banquet', '外滩老洋房晚宴'),
        eq('businessType', 'private_couture', '我要私人定做'), eq('quantity', 1, '一件女式礼服'),
        eq('category', 'dress', '女式礼服'), eq('lengthRatio', 'floor', '裙长认曳地款'),
        eq('color', 'crimson', '绯红丝绒'), eq('fabric', 'velvet', '主料用绯红丝绒'),
      ],
      unknowns: [{ field: 'collar', reason: '客户要看图后确定领型。' }],
      catalog: eligible('src/data/decisionCatalog.ts 的 PT-202 是曳地礼服；FB-103 为绯红丝绒，静态表均覆盖秋季与外滩晚宴。', ['pat-haipai-gown-column', 'fab-xiangyun-crimson-velvet']),
    }],
  },
  {
    id: 'independent-05', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '行政这边发团单，三十六套秋装，必须是成套西服。照相好看最好有点柔光，光泽可以让版师试完再选。洗护方式也还没定。我们要先把洗护和后勤对上，才好定样。',
      hard: [
        eq('businessType', 'corporate_uniform', '行政这边发团单'), eq('quantity', 36, '三十六套秋装'),
        eq('season', 'autumn', '三十六套秋装'), eq('category', 'suit', '必须是成套西服'),
      ],
      unknowns: [
        { field: 'luster', reason: '柔光只是偏好，版师试样后再决定。' },
        { field: 'care', reason: '后勤确认前洗护方式未定，且影响定样。' },
      ],
      followUpFields: ['care'],
      catalog: eligible('src/data/decisionCatalog.ts 的 PT-201、PT-201-L、PT-301 均覆盖 36 套，静态秋季主料可选 FB-201 等。'),
    }],
  },
  {
    id: 'independent-06', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '五件春天穿的外套，按个人高级定制做。色卡只看黑色，花纹须是织出来的暗纹。领子有图以后再选。',
      hard: [
        eq('quantity', 5, '五件春天穿的外套'), eq('season', 'spring', '春天穿的外套'),
        eq('category', 'jacket', '五件春天穿的外套'), eq('businessType', 'private_couture', '按个人高级定制做'),
        eq('color', 'obsidian', '色卡只看黑色'), eq('motif', 'subtle_jacquard', '须是织出来的暗纹'),
      ],
      unknowns: [{ field: 'collar', reason: '领型将在看图后确定。' }],
      catalog: eligible('src/data/decisionCatalog.ts 的 FB-001 和 FB-101 均为黑色暗纹，前者可配数款春季外套，后者可配 PT-102。'),
    }],
  },
  {
    id: 'independent-07', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '这回是公司团装，排了72套，主色藏青，布要抗皱。不要老式制服风，也别用羊毛面料。比寻常稍亮可以考虑，光泽先别锁。',
      hard: [
        eq('businessType', 'corporate_uniform', '是公司团装'), eq('quantity', 72, '排了72套'),
        eq('color', 'navy', '主色藏青'), eq('wrinkleResistance', true, '布要抗皱'),
        neq('style', 'traditional_uniform', '不要老式制服风'), neq('fabric', 'wool', '别用羊毛面料'),
      ],
      unknowns: [{ field: 'luster', reason: '较亮只能作偏好，光泽未锁。' }],
      catalog: eligible('src/data/decisionCatalog.ts 的 PT-301 不是传统制服版，FB-211、FB-212、FB-213 均为 72 套区间内的藏青抗皱非羊毛料。', [softSuit]),
    }],
  },
  {
    id: 'independent-08', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '两个审核的人把同一批团装都签了，锁定一次做52套。品牌签字单上写必须用藏青，采购签字单上写必须用松墨绿。两张现在都有效，做的还是同一批同一个主色。',
      hard: [
        eq('businessType', 'corporate_uniform', '同一批团装'), eq('quantity', 52, '锁定一次做52套'),
        eq('color', 'navy', '必须用藏青'), eq('color', 'pine_green', '必须用松墨绿'),
      ],
      unknowns: [], conflicts: ['color'],
      catalog: { outcome: 'blocked', source: '两个主色均有效且互斥。src/data/fabrics.ts 中 FB-201、211、212、213 为藏青，FB-203 为松墨绿，单一主料不可能同时符合两值。' },
    }],
  },
  {
    id: 'independent-09', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '统一的职业团装做二十二套。两份已签要求撞了，设计单写领型必须做平驳领，合同附件却写不得用平驳领。目前没人撤回，两份都得遵守。',
      hard: [
        eq('businessType', 'corporate_uniform', '统一的职业团装'), eq('quantity', 22, '做二十二套'),
        eq('collar', 'lapel', '领型必须做平驳领'), neq('collar', 'lapel', '不得用平驳领'),
      ],
      unknowns: [], conflicts: ['collar'],
      catalog: { outcome: 'blocked', source: '同一领型的必选与排除冲突。src/data/decisionCatalog.ts 中 PT-201-L 和 PT-301 为驳领，PT-201 为立领，三者各违背其中一项。' },
    }],
  },
  {
    id: 'independent-10', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '我和姐姐这单按个人量身定制，两件春季中式外套，都得做直身H版。我们不穿立领，主料也禁用醋酸。',
      hard: [
        eq('businessType', 'private_couture', '按个人量身定制'), eq('quantity', 2, '两件春季中式外套'),
        eq('season', 'spring', '两件春季中式外套'), eq('category', 'jacket', '两件春季中式外套'),
        eq('patternStructure', 'h_line', '都得做直身H版'), neq('collar', 'stand', '不穿立领'),
        neq('fabric', 'acetate', '主料也禁用醋酸'),
      ],
      unknowns: [],
      catalog: eligible('src/data/decisionCatalog.ts 的 PT-106 是交领，PT-102 是驳领，两者均为 H 型。剔除醋酸 FB-001 后仍可搭 FB-006 或 FB-002 等。'),
    }],
  },
  {
    id: 'independent-11', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '部门统一订的团装，藏蓝色正装套装，第一批定48套。后勤不接受专业干洗，机洗或手洗都行；面料也不要高亮面。',
      hard: [
        eq('businessType', 'corporate_uniform', '部门统一订的团装'), eq('color', 'navy', '藏蓝色'),
        eq('category', 'suit', '正装套装'), eq('quantity', 48, '第一批定48套'),
        neq('care', 'dry_clean', '不接受专业干洗'), neq('luster', 'high', '不要高亮面'),
      ],
      unknowns: [],
      catalog: eligible('src/data/decisionCatalog.ts 中 FB-211 支持机洗，低光泽并可搭 PT-301。FB-201 要干洗，FB-212、FB-213 则属高光。', [softSuit, navyTwill]),
    }],
  },
  {
    id: 'independent-12', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '策展人自用的服装，按私人定制下四件长礼服，静安艺术沙龙当天穿。丝绒不要，高光泽也排除，颜色由你们先出稿。',
      hard: [
        eq('businessType', 'private_couture', '按私人定制下'), eq('quantity', 4, '四件长礼服'),
        eq('category', 'dress', '四件长礼服'), eq('scene', 'scene-jingan-salon', '静安艺术沙龙当天穿'),
        neq('fabric', 'velvet', '丝绒不要'), neq('luster', 'high', '高光泽也排除'),
      ],
      unknowns: [{ field: 'color', reason: '交给设计师先出稿，客户尚未定色。' }],
      catalog: eligible('src/data/decisionCatalog.ts 与 src/data/fabrics.ts 的 FB-002 为中光泽非丝绒，适用于静安艺术沙龙，可搭 PT-202。', ['pat-haipai-gown-column', 'fab-official-plum-song']),
    }],
  },
  {
    id: 'independent-13', group: 'catalog-no-match', turns: [{
      id: 't1',
      text: '物业迎宾组这单是企业团体订制，西服套装统一用藏青，一次性做172套，最重要是成衣必须可以机洗。',
      hard: [
        eq('businessType', 'corporate_uniform', '企业团体订制'), eq('category', 'suit', '西服套装'),
        eq('color', 'navy', '统一用藏青'), eq('quantity', 172, '一次性做172套'),
        eq('care', 'machine_wash', '成衣必须可以机洗'),
      ],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'src/data/decisionCatalog.ts 仅 FB-211 和 FB-212 具备藏青机洗证据，但批量上限分别为 160 和 120。FB-201 为专业干洗，FB-213 上限 80 且洗护未知。',
        blockers: [
          { assetId: navyTwill, field: 'quantity', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · FB-211 为 8–160 套。' },
          { assetId: navyBlend, field: 'quantity', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · FB-212 为 8–120 套。' },
          { assetId: navySilk, field: 'quantity', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · FB-213 为 1–80 套。' },
          { assetId: navyWool, field: 'care', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · FB-201 为 dry_clean。' },
        ],
      },
    }],
  },
  {
    id: 'independent-14', group: 'catalog-no-match', turns: [{
      id: 't1',
      text: '我们要私订六件外套，每件的领型都指定交领。主料只要真丝，还得允许机洗。朋友发来一张以前做过的真丝交领成衣照片，版型可参考。',
      hard: [
        eq('businessType', 'private_couture', '要私订'), eq('quantity', 6, '六件外套'), eq('category', 'jacket', '六件外套'),
        eq('collar', 'cross_open', '领型都指定交领'), eq('fabric', 'silk', '主料只要真丝'),
        eq('care', 'machine_wash', '还得允许机洗'),
      ],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'src/data/decisionCatalog.ts 的交领 PT-106 可配真丝 FB-006、FB-004、FB-213。第一款为专业干洗，后两款洗护缺证。src/data/cases.ts 中的 CS-006 只说明既往交领真丝搭配。',
        blockers: [
          { assetId: 'fab-official-silk-jacquard-subtle', field: 'care', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · FB-006 为 dry_clean。' },
          { assetId: 'fab-official-xiangyun-matte', field: 'care', kind: 'unknown-attribute', source: 'src/data/decisionCatalog.ts · FB-004 未填 care。' },
          { assetId: navySilk, field: 'care', kind: 'unknown-attribute', source: 'src/data/decisionCatalog.ts · FB-213 未填 care。' },
          { assetId: 'case-hist-006', field: 'care', kind: 'reference-only', source: 'src/data/cases.ts · CS-006 为历史造型参照，不能证明可机洗。' },
        ],
      },
    }],
  },
  {
    id: 'independent-15', group: 'catalog-no-match', turns: [{
      id: 't1',
      text: '客户接待科申报的是公司团装，采购锁42套，春季用，面料只要松墨绿色。物业只签了一个洗护口径，所有成衣必须送专业干洗。',
      hard: [
        eq('businessType', 'corporate_uniform', '申报的是公司团装'), eq('quantity', 42, '采购锁42套'),
        eq('season', 'spring', '春季用'), eq('color', 'pine_green', '面料只要松墨绿色'),
        eq('care', 'dry_clean', '所有成衣必须送专业干洗'),
      ],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'src/data/fabrics.ts 只有 FB-203 是松墨绿。src/data/decisionCatalog.ts 中数量覆盖 42 套，但无 care；干洗的团装面料 FB-201 和 FB-001 色系不同。',
        blockers: [{ assetId: greenBlend, field: 'care', kind: 'unknown-attribute', source: 'src/data/decisionCatalog.ts · FB-203 未填 care。' }],
      },
    }],
  },
  {
    id: 'independent-16', group: 'catalog-no-match', turns: [{
      id: 't1',
      text: '我们办的是陆家嘴金融峰会，报名核下来要订企业团装90套。颜色指定海军蓝，要求布料抗皱，服装必须可机洗。布面反光程度没有限定。',
      hard: [
        eq('scene', 'scene-lujiazui-summit', '陆家嘴金融峰会'), eq('businessType', 'corporate_uniform', '订企业团装'),
        eq('quantity', 90, '90套'), eq('color', 'navy', '颜色指定海军蓝'),
        eq('wrinkleResistance', true, '要求布料抗皱'), eq('care', 'machine_wash', '服装必须可机洗'),
      ],
      unknowns: [{ field: 'luster', reason: '反光程度未设定。' }],
      catalog: eligible('src/data/decisionCatalog.ts 的 PT-301 可选 FB-211 配 CR-211，或 FB-212 配 CR-212；两种面料都在 90 套区间，并具备藏青、抗皱及机洗证据。', [softSuit]),
    }],
  },
  {
    id: 'independent-17', group: 'catalog-no-match', turns: [{
      id: 't1',
      text: '新址的行政团服订28套。品牌部已经把现代极简风写进要求，领型也写死为立领。别拿传统单位制服来充数。',
      hard: [
        eq('businessType', 'corporate_uniform', '行政团服'), eq('quantity', 28, '订28套'),
        eq('style', 'modern', '把现代极简风写进要求'), eq('collar', 'stand', '领型也写死为立领'),
        neq('style', 'traditional_uniform', '别拿传统单位制服来充数'),
      ],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'src/data/decisionCatalog.ts 的团装现代版型 PT-301 只有驳领；有立领的 PT-201 则是传统制服风。',
        blockers: [
          { assetId: softSuit, field: 'collar', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · PT-301 只有 lapel。' },
          { assetId: standSuit, field: 'style', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · PT-201 为 traditional_uniform。' },
          { assetId: lapelSuit, field: 'style', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · PT-201-L 为 traditional_uniform。' },
        ],
      },
    }],
  },
  {
    id: 'independent-18', group: 'catalog-no-match', turns: [{
      id: 't1',
      text: '合唱活动订十套，演出用的私人定制两件式套装，上衣和下裙要各自独立。地点在户外舞台。团员自己护理，成衣的洗护标签必须是手洗。',
      hard: [
        eq('quantity', 10, '订十套'), eq('businessType', 'private_couture', '私人定制'),
        eq('category', 'two_piece', '两件式套装'), eq('patternStructure', 'two_piece', '上衣和下裙要各自独立'),
        eq('scene', 'scene-outdoor-stage', '地点在户外舞台'), eq('care', 'hand_wash', '洗护标签必须是手洗'),
      ],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'src/data/decisionCatalog.ts 只有 PT-103 是户外演出两件式，唯一相容主料 FB-003 未录洗护方式。src/data/cases.ts 中 CS-003 的搭配不能证明手洗。',
        blockers: [
          { assetId: stageFabric, field: 'care', kind: 'unknown-attribute', source: 'src/data/decisionCatalog.ts · FB-003 未填 care。' },
          { assetId: 'case-hist-003', field: 'care', kind: 'reference-only', source: 'src/data/cases.ts · CS-003 为历史案例，不能补足成衣洗护证据。' },
        ],
      },
    }],
  },
  {
    id: 'independent-19', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '销售部这单走企业团装，第一批锁56套。颜色定藏青，要哑光。成衣得能机洗，面料也必须抗皱。',
        hard: [...firstRevisionBase, eq('luster', 'low', '要哑光')], unknowns: [], catalog: lowLusterWash,
      },
      {
        id: 't2', text: '宣传图出来了，光泽改成高亮面，确认就按这条改。藏青和可机洗这两条照旧。',
        hard: [...firstRevisionBase, bright], unknowns: [], conflicts: ['luster'], catalog: highLusterWash,
        revision: { decision: 'apply', invariantFields: firstRevisionFields, changedFields: ['luster'], requestedFields: ['luster'] },
      },
      {
        id: 't3', text: '供应总监刚补了一条，主料要真丝，批准加进本版。其他约定继续有效。',
        hard: [...firstRevisionBase, bright, eq('fabric', 'silk', '主料要真丝', 't3')], unknowns: [], conflicts: [],
        catalog: {
          outcome: 'no-match',
          source: 'src/data/decisionCatalog.ts 中高亮藏青、耐皱、56 套的真丝仅 FB-213，未提供机洗证据；FB-212 支持机洗，但面料为混纺。',
          blockers: [
            { assetId: navySilk, field: 'care', kind: 'unknown-attribute', source: 'src/data/decisionCatalog.ts · FB-213 未填 care。' },
            { assetId: navyBlend, field: 'fabric', kind: 'known-violation', source: 'src/data/decisionCatalog.ts · FB-212 为 blend。' },
          ],
        },
        revision: { decision: 'apply', invariantFields: [...firstRevisionFields, 'luster'], changedFields: ['fabric'], requestedFields: ['fabric'] },
      },
    ],
  },
  {
    id: 'independent-20', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '值台这批按公司团装下单，首批核准30套，品类定西服套装，必须做立领，全组用深藏蓝。洗标上的护理方式等供应商答复。',
        hard: secondRevisionBase, unknowns: secondRevisionUnknowns, catalog: secondRevisionCatalog,
      },
      {
        id: 't2', text: '门店提了把领型换成平驳领的方案。看完我决定保持原方案，这轮继续沿用原版。',
        hard: secondRevisionBase, unknowns: secondRevisionUnknowns, conflicts: ['collar'], catalog: secondRevisionCatalog,
        revision: { decision: 'keep', invariantFields: secondRevisionFields, changedFields: [], requestedFields: ['collar'] },
      },
      {
        id: 't3', text: '采购又来了一条建议，主色改暖灰。先把这句话留作改稿草稿，这轮取消，不保存新版本。',
        hard: secondRevisionBase, unknowns: secondRevisionUnknowns, conflicts: ['color'], catalog: secondRevisionCatalog,
        revision: { decision: 'cancel', invariantFields: secondRevisionFields, changedFields: [], requestedFields: ['color'] },
      },
    ],
  },
  {
    id: 'independent-21', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '是团体职业装，数量批了28套，只在春季启用。成衣在正式文化礼厅内使用，主色定藏青。',
        hard: thirdRevisionBase, unknowns: [], catalog: thirdRevisionNavy,
      },
      {
        id: 't2', text: '品牌想把主色换成松墨绿。等样卡签回来再定，这条改动先挂起。',
        hard: thirdRevisionBase, unknowns: [{ field: 'color', reason: '松墨绿作为改稿意向挂起，待样卡签回，当前已确认主色仍来自首轮。' }],
        conflicts: ['color'], catalog: thirdRevisionNavy,
        revision: { decision: 'defer', invariantFields: [...thirdRevisionFields, 'color'], changedFields: [], requestedFields: ['color'] },
      },
      {
        id: 't3', text: '色卡签回来了，主色改松墨绿，面料必须抗皱。两项现在都确认了，正式文化礼厅继续照原单。',
        hard: [...thirdRevisionCommon, eq('color', 'pine_green', '主色改松墨绿', 't3'), eq('wrinkleResistance', true, '面料必须抗皱', 't3')],
        unknowns: [], conflicts: ['color'],
        catalog: eligible('src/data/decisionCatalog.ts 与 src/data/fabrics.ts 中 FB-203 的松墨绿、抗皱及 20–60 套范围符合条件。PT-201、PT-201-L 均相容，版型和面料都列有春季正式礼厅。', [greenBlend]),
        revision: { decision: 'apply', invariantFields: thirdRevisionFields, changedFields: ['color', 'wrinkleResistance'], requestedFields: ['color', 'wrinkleResistance'] },
      },
    ],
  },
  {
    id: 'independent-22', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '姊妹两人的衣服按私人定制做，一共要2件，只给春季穿。品类就是外套，版型必须是H型，领口走驳领，主料要黑色。',
        hard: [...fourthRevisionCommon, fourthRevisionBaseColor, eq('collar', 'lapel', '领口走驳领')], unknowns: [],
        catalog: eligible('src/data/decisionCatalog.ts 中 PT-102 是 H 型驳领外套；黑色 FB-001、FB-101 都相容，静态季节均覆盖春。', ['pat-official-shawl-plum']),
      },
      {
        id: 't2', text: '配了衬衫看过了，领型换成立领，批准改。衣服还是外套，那个H型也留着。',
        hard: [...fourthRevisionCommon, fourthRevisionBaseColor, fourthRevisionStand], unknowns: [], conflicts: ['collar'],
        catalog: eligible('src/data/decisionCatalog.ts 中 PT-101 与 PT-104 都是春季 H 型立领外套，黑色 FB-001 均可搭。', ['fab-official-acetate-jacquard']),
        revision: { decision: 'apply', invariantFields: [...fourthRevisionFields, 'color'], changedFields: ['collar'], requestedFields: ['collar'] },
      },
      {
        id: 't3', text: '家里最后定了主料改绯红。立领继续按已确认的做。现在就用新颜色提交，件数照前。',
        hard: [...fourthRevisionCommon, fourthRevisionStand, eq('color', 'crimson', '主料改绯红', 't3')], unknowns: [], conflicts: ['color'],
        catalog: {
          outcome: 'no-match',
          source: 'src/data/fabrics.ts 唯一绯红料 FB-103 为秋冬用丝绒，src/data/decisionCatalog.ts 只相容礼服 PT-202，不能给春季 H 型立领外套。',
          blockers: [{ assetId: 'fab-xiangyun-crimson-velvet', field: 'season', kind: 'known-violation', source: 'src/data/fabrics.ts · FB-103 的 seasons 为 autumn、winter。' }],
        },
        revision: { decision: 'apply', invariantFields: [...fourthRevisionFields, 'collar'], changedFields: ['color'], requestedFields: ['color'] },
      },
    ],
  },
  {
    id: 'independent-23', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '我是拉二胡的，按私人定制接单，只订一套，秋季穿，地点就是户外舞台。品类就填两件式演出服，外套和裙子必须分开做成两件，抬胳膊拉琴必须不受限。裙长先不定，洗护等样衣出来再说。',
        hard: fifthRevisionBase, unknowns: [{ field: 'lengthRatio', reason: '裙长尚未确定。' }, fifthRevisionCarePending], catalog: stageCatalog,
      },
      {
        id: 't2', text: '排练量过腿长了，裙摆长度定到脚踝，这条现在确认。秋季户外舞台还是原计划。',
        hard: [...fifthRevisionBase, ankleHem], unknowns: [fifthRevisionCarePending], conflicts: [], catalog: stageCatalog,
        revision: { decision: 'apply', invariantFields: fifthRevisionFields, changedFields: ['lengthRatio'], requestedFields: ['lengthRatio'] },
      },
      {
        id: 't3', text: '演出经理问能不能把可机洗加成成衣要求。先把这一条挂起，等做出样衣再定可不可以。',
        hard: [...fifthRevisionBase, ankleHem], unknowns: [fifthRevisionCarePending], conflicts: [], catalog: stageCatalog,
        revision: { decision: 'defer', invariantFields: [...fifthRevisionFields, 'lengthRatio'], changedFields: [], requestedFields: ['care'] },
      },
    ],
  },
  {
    id: 'independent-24', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '后勤拉的公司团装，确认做38套，按职业西服套装开单，指定小立领，主色必须暖灰。成衣必须可机洗，写进确认单。',
        hard: [...sixthRevisionCommon, sixthRevisionGray, eq('care', 'machine_wash', '成衣必须可机洗')], unknowns: [], catalog: grayCareMissing,
      },
      {
        id: 't2', text: '现在有固定供应商了，洗护改用专业干洗，请确认为新要求。颜色还是暖灰，没有再改。',
        hard: [...sixthRevisionCommon, sixthRevisionGray, sixthRevisionDry], unknowns: [], conflicts: ['care'], catalog: grayCareMissing,
        revision: { decision: 'apply', invariantFields: [...sixthRevisionFields, 'color'], changedFields: ['care'], requestedFields: ['care'] },
      },
      {
        id: 't3', text: '颜色审批重走了，主色改定藏青，这版请保存。小立领和专业干洗都保留。',
        hard: [...sixthRevisionCommon, sixthRevisionDry, eq('color', 'navy', '主色改定藏青', 't3')], unknowns: [], conflicts: ['color'],
        catalog: eligible('src/data/decisionCatalog.ts 的 PT-201 可做 38 套团装立领，FB-201 为相容藏青专业干洗料。', [standSuit, navyWool]),
        revision: { decision: 'apply', invariantFields: [...sixthRevisionFields, 'care'], changedFields: ['color'], requestedFields: ['color'] },
      },
    ],
  },
];
