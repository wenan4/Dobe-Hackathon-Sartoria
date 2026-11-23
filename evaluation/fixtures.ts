export interface Triple {
  field: string;
  op: 'eq' | 'neq';
  value: string | number | boolean | null;
}

interface HardLabel extends Triple {
  quote: string;
  sourceTurnId: string;
}

export interface CatalogExpectation {
  outcome: 'eligible' | 'no-match' | 'blocked';
  source: string;
  requiredIds?: readonly string[];
  blockers?: readonly {
    assetId: string;
    field: string;
    kind: 'known-violation' | 'reference-only' | 'unknown-attribute';
    source: string;
  }[];
}

export interface FixtureTurn {
  id: string;
  text: string;
  hard: readonly HardLabel[];
  unknowns: readonly { field: string; reason: string }[];
  conflicts?: readonly string[];
  followUpFields?: readonly string[];
  catalog?: CatalogExpectation;
  revision?: {
    decision: 'apply' | 'keep' | 'cancel' | 'defer';
    invariantFields: readonly string[];
    changedFields: readonly string[];
    requestedFields: readonly string[];
  };
}

export interface Fixture {
  id: string;
  group: 'synonyms-omissions' | 'negation-conflicts' | 'catalog-no-match' | 'multi-round-revisions';
  turns: readonly FixtureTurn[];
  catalog?: CatalogExpectation;
}

function eq(field: string, value: Triple['value'], quote: string, sourceTurnId = 't1'): HardLabel {
  return { field, op: 'eq', value, quote, sourceTurnId };
}

function neq(field: string, value: Triple['value'], quote: string, sourceTurnId = 't1'): HardLabel {
  return { field, op: 'neq', value, quote, sourceTurnId };
}

const grayCouture = [
  eq('businessType', 'private_couture', '给我个人定做'),
  eq('quantity', 1, '一件'),
  eq('category', 'jacket', '外套'),
];
const grayGroup = [
  eq('businessType', 'corporate_uniform', '公司团装'),
  eq('quantity', 37, '37 套'),
  eq('scene', 'indoor_formal', '室内正式接待'),
  eq('color', 'obsidian', '炭黑定死'),
];
const winterGown = [
  eq('scene', 'formal_evening', '晚宴'),
  eq('season', 'winter', '冬季'),
  eq('category', 'dress', '连衣礼服'),
  eq('lengthRatio', 'floor', '裙摆必须到地'),
];
const warmGrayTeam = [
  eq('businessType', 'corporate_uniform', '企业团装'),
  eq('quantity', 22, '二十二套'),
  eq('scene', 'indoor_formal', '室内正式'),
  eq('color', 'stone_gray', '必须暖灰'),
  eq('fabric', 'blend', '要混纺'),
  eq('closure', 'no_visible_buttons', '不能有外露扣'),
];

export const fixtures: readonly Fixture[] = [
  {
    id: 'S01', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '馆里开幕接待统一给员工订二十八套，室内正式接待用。颜色以暖灰为准，洗护等行政确认。',
      hard: [
        eq('businessType', 'corporate_uniform', '统一给员工订'), eq('quantity', 28, '二十八套'),
        eq('scene', 'indoor_formal', '室内正式接待'), eq('color', 'stone_gray', '以暖灰为准'),
      ],
      unknowns: [{ field: 'care', reason: '已明确交由行政确认，暂未授权任何洗护方式。' }],
    }],
  },
  {
    id: 'S02', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '给我个人做一件外套。衣身要直上直下的 H 形，下摆落在臀部中间。颜色先空着，等我拿色卡。',
      hard: [
        eq('businessType', 'private_couture', '给我个人做'), eq('quantity', 1, '一件'),
        eq('category', 'jacket', '外套'), eq('patternStructure', 'h_line', '直上直下的 H 形'),
        eq('lengthRatio', 'mid_hip', '臀部中间'),
      ],
      unknowns: [{ field: 'color', reason: '客户会另拿色卡，候选用色无权回填客户确认字段。' }],
    }],
  },
  {
    id: 'S03', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '露天音乐节登台演奏穿，演出服一定分成上下两件，拉琴时抬胳膊得伸得开。料子还没定。',
      hard: [
        eq('scene', 'outdoor_stage', '露天音乐节登台'), eq('patternStructure', 'two_piece', '分成上下两件'),
        eq('easeAllowance', 'arm_mobility', '抬胳膊得伸得开'),
      ],
      unknowns: [
        { field: 'fabric', reason: '客户明确留待选择。' },
        { field: 'quantity', reason: '上下两件指一套内的结构，从原话无法得出订单套数。' },
      ],
    }],
  },
  {
    id: 'S04', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '婚礼晚宴我只订一条连衣礼服，裙脚一定要拖地，布面必须哑光，颜色还没拍板。',
      hard: [
        eq('scene', 'formal_evening', '婚礼晚宴'), eq('quantity', 1, '只订一条'),
        eq('category', 'dress', '连衣礼服'), eq('lengthRatio', 'floor', '裙脚一定要拖地'),
        eq('luster', 'low', '必须哑光'),
      ],
      unknowns: [{ field: 'color', reason: '光泽和颜色是两个决策，哑光不能推定色系。' }],
    }],
  },
  {
    id: 'S05', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '入秋用的礼宾外套，选松针一样的深墨绿，洗护方式确定为专业干洗。领子款式先留白。',
      hard: [
        eq('season', 'autumn', '入秋用'), eq('category', 'jacket', '礼宾外套'),
        eq('color', 'pine_green', '松针一样的深墨绿'), eq('care', 'dry_clean', '专业干洗'),
      ],
      unknowns: [
        { field: 'collar', reason: '客户明确留白。' },
        { field: 'scene', reason: '礼宾角色没有明确室内或户外。' },
      ],
    }],
  },
  {
    id: 'S06', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '开会穿的西服套装，要翻驳领，面料定成混纺。套数还没批，颜色偏暖灰就好。',
      hard: [
        eq('category', 'suit', '西服套装'), eq('collar', 'lapel', '翻驳领'), eq('fabric', 'blend', '定成混纺'),
      ],
      unknowns: [{ field: 'quantity', reason: '套数待审批。暖灰是偏好，不能算颜色硬要求。' }],
    }],
  },
  {
    id: 'N01', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '给前台直接做32套团体职业装，绝对不要藏青，也别用立领。其他颜色先都可以聊。',
      hard: [
        eq('businessType', 'corporate_uniform', '团体职业装'), eq('quantity', 32, '32套'),
        neq('color', 'navy', '绝对不要藏青'), neq('collar', 'stand', '别用立领'),
      ],
      unknowns: [{ field: 'color', reason: '只能排除藏青，尚未选定替代色。' }],
    }],
  },
  {
    id: 'N02', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '夏季晚宴的连衣礼服，活动负责人说必须用真丝，采购却说绝不能用真丝。这两条都还是硬要求，等客户拍板。',
      hard: [
        eq('season', 'summer', '夏季'), eq('scene', 'formal_evening', '晚宴'), eq('category', 'dress', '连衣礼服'),
        eq('fabric', 'silk', '必须用真丝'), neq('fabric', 'silk', '绝不能用真丝'),
      ],
      unknowns: [{ field: 'fabric', reason: '两条互斥要求仍有效，客户尚未决定保留哪条。' }],
      conflicts: ['fabric'], followUpFields: ['fabric'],
      catalog: { outcome: 'blocked', source: '同一轮原话对真丝同时要求与禁止。' },
    }],
  },
  {
    id: 'N03', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '这件秋季外套正面不能有任何外露纽扣，面料不要羊毛。暗扣怎么做先由打版评估。',
      hard: [
        eq('season', 'autumn', '秋季'), eq('category', 'jacket', '外套'),
        eq('closure', 'no_visible_buttons', '不能有任何外露纽扣'), neq('fabric', 'wool', '不要羊毛'),
      ],
      unknowns: [{ field: 'craft', reason: '不能见扣是成衣要求，客户未指定具体工艺。' }],
    }],
  },
  {
    id: 'N04', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '店里工作服做四十套，别给要干洗的款，必须能放家用洗衣机洗。抗皱有更好，没也行。',
      hard: [
        eq('businessType', 'corporate_uniform', '店里工作服'), eq('quantity', 40, '四十套'),
        neq('care', 'dry_clean', '别给要干洗的款'), eq('care', 'machine_wash', '放家用洗衣机洗'),
      ],
      unknowns: [{ field: 'color', reason: '客户未提及配色，抗皱也只是偏好。' }],
    }],
  },
  {
    id: 'N05', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '柜台团队职业装不是要20套，是15套。配色确定：别用炭黑，要暖灰。洗护还没问。',
      hard: [
        eq('businessType', 'corporate_uniform', '柜台团队职业装'), eq('quantity', 15, '是15套'),
        neq('color', 'obsidian', '别用炭黑'), eq('color', 'stone_gray', '要暖灰'),
      ],
      unknowns: [{ field: 'care', reason: '客户说洗护还没问。20 套是自我修正前的数字。' }],
    }],
  },
  {
    id: 'N06', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '演出在露天舞台，拉琴抬手不能卡住；绝不要高亮面的面料，没指定领型。',
      hard: [
        eq('scene', 'outdoor_stage', '露天舞台'), eq('easeAllowance', 'arm_mobility', '抬手不能卡住'),
        neq('luster', 'high', '绝不要高亮面'),
      ],
      unknowns: [{ field: 'collar', reason: '领型待定，禁止高亮面并未排除中等光泽。' }],
    }],
  },
  {
    id: 'C01', group: 'catalog-no-match',
    catalog: {
      outcome: 'eligible', requiredIds: ['fab-official-acetate-jacquard'],
      source: 'src/data/fabrics.ts#fab-official-acetate-jacquard 的色系、成分和洗护说明。src/data/patterns.ts#pat-official-h-low-collar 允许薄款醋酸提花锦；src/data/crafts.ts#crf-low-collar-ergo 列有该面料的织法。',
    },
    turns: [{
      id: 't1',
      text: '给我个人订做一件室内正式接待的外套。一定要炭黑色醋酸面料，洗护按专业干洗。',
      hard: [
        eq('businessType', 'private_couture', '给我个人订做'), eq('quantity', 1, '一件'),
        eq('category', 'jacket', '外套'), eq('scene', 'indoor_formal', '室内正式接待'),
        eq('color', 'obsidian', '炭黑色'), eq('fabric', 'acetate', '醋酸面料'), eq('care', 'dry_clean', '专业干洗'),
      ],
      unknowns: [{ field: 'collar', reason: '版型领口由方案选项提供，客户没有锁死。' }],
    }],
  },
  {
    id: 'C02', group: 'catalog-no-match',
    catalog: {
      outcome: 'eligible',
      requiredIds: ['pat-official-xiangyun-dropped', 'fab-official-xiangyun-matte', 'crf-hidden-mandarin-placket'],
      source: 'src/data/patterns.ts#pat-official-xiangyun-dropped 的季节、领型、面料标准和暗门襟。src/data/fabrics.ts#fab-official-xiangyun-matte 的色系与光泽。src/data/crafts.ts#crf-hidden-mandarin-placket 的适用业务及织法兼容表。',
    },
    turns: [{
      id: 't1',
      text: '夏季给我个人做件低立领外套，要求古茶墨褐、哑光，工艺指定暗门襟无痕改良立领。',
      hard: [
        eq('season', 'summer', '夏季'), eq('businessType', 'private_couture', '给我个人做'),
        eq('quantity', 1, '做件'), eq('category', 'jacket', '外套'), eq('collar', 'stand', '低立领'),
        eq('color', 'earth_brown', '古茶墨褐'), eq('luster', 'low', '哑光'),
        eq('craft', 'crf-hidden-mandarin-placket', '暗门襟无痕改良立领'),
      ],
      unknowns: [{ field: 'care', reason: '客户未指定，可列面料洗护待核。' }],
    }],
  },
  {
    id: 'C03', group: 'catalog-no-match',
    catalog: {
      outcome: 'no-match',
      source: 'src/data/fabrics.ts 的松墨绿色记录为精纺混纺；已列纯桑蚕丝的记录均为其它色系，且多为个人定制。',
      blockers: [{
        assetId: 'fab-shanghai-pine-green', field: 'fabric', kind: 'known-violation',
        source: 'src/data/fabrics.ts#fab-shanghai-pine-green 的 composition 为 92% 羊毛、6% 桑蚕丝、2% 氨纶。',
      }],
    },
    turns: [{
      id: 't1',
      text: '酒店给礼宾团队订四十套团体职业装，冬天穿，必须松墨绿，面料必须全真丝。',
      hard: [
        eq('businessType', 'corporate_uniform', '团体职业装'), eq('quantity', 40, '四十套'),
        eq('season', 'winter', '冬天'), eq('color', 'pine_green', '必须松墨绿'), eq('fabric', 'silk', '必须全真丝'),
      ],
      unknowns: [{ field: 'care', reason: '客户未说可接受何种养护。' }],
    }],
  },
  {
    id: 'C04', group: 'catalog-no-match',
    catalog: {
      outcome: 'no-match',
      source: 'src/data/patterns.ts 的曳地连衣礼服用于个人定制，团体职业服目录为商务正装。src/data/cases.ts#case-hist-005 是个人高定参考。',
      blockers: [
        { assetId: 'pat-haipai-gown-column', field: 'businessType', kind: 'known-violation', source: 'src/data/patterns.ts#pat-haipai-gown-column 的 businessType 仅 private_couture。' },
        { assetId: 'case-hist-005', field: 'businessType', kind: 'reference-only', source: 'src/data/cases.ts#case-hist-005 仅描述过往单件孤品。' },
      ],
    },
    turns: [{
      id: 't1',
      text: '颁奖晚宴给引导团队订三十六套团装，款式统一为连衣礼服，裙摆必须曳地。颜色待主办方确认。',
      hard: [
        eq('scene', 'formal_evening', '颁奖晚宴'), eq('quantity', 36, '三十六套'),
        eq('businessType', 'corporate_uniform', '团装'), eq('category', 'dress', '连衣礼服'),
        eq('lengthRatio', 'floor', '必须曳地'),
      ],
      unknowns: [{ field: 'color', reason: '颜色归主办方确认。' }],
    }],
  },
  {
    id: 'C05', group: 'catalog-no-match',
    catalog: {
      outcome: 'no-match',
      source: 'src/data/fabrics.ts 的炭黑色候选没有可用于冬季团装且有明确机洗依据的记录。干洗要求与洗护缺项应分别反馈。',
      blockers: [
        { assetId: 'fab-official-acetate-jacquard', field: 'care', kind: 'known-violation', source: 'src/data/fabrics.ts#fab-official-acetate-jacquard 的 careAndMoqNote 写常规专业干洗。' },
        { assetId: 'fab-heavy-cashmere-obsidian', field: 'care', kind: 'unknown-attribute', source: 'src/data/fabrics.ts#fab-heavy-cashmere-obsidian 的 careAndMoqNote 只有克重和季节建议。' },
      ],
    },
    turns: [{
      id: 't1',
      text: '新店给团队做二十四套职业装，冬季用，硬性要求炭黑，成衣要能家用机洗，麻烦给可核对的洗护依据。',
      hard: [
        eq('businessType', 'corporate_uniform', '给团队做'), eq('quantity', 24, '二十四套'),
        eq('season', 'winter', '冬季用'), eq('color', 'obsidian', '硬性要求炭黑'),
        eq('care', 'machine_wash', '要能家用机洗'),
      ],
      unknowns: [{ field: 'category', reason: '职业装描述业务用途，未明确单件外套或西服套装。' }],
    }],
  },
  {
    id: 'C06', group: 'catalog-no-match',
    catalog: {
      outcome: 'no-match',
      source: 'src/data/fabrics.ts#fab-xiangyun-crimson-velvet 的织法为提花烂花丝绒，与 src/data/crafts.ts#crf-full-canvas-guiba 的兼容织法无交集。',
      blockers: [{
        assetId: 'crf-full-canvas-guiba', field: 'fabric', kind: 'known-violation',
        source: 'src/data/crafts.ts#crf-full-canvas-guiba 的兼容表仅有精纺/斜纹等织法，没有提花烂花丝绒。',
      }],
    },
    turns: [{
      id: 't1',
      text: '个人定制一条晚宴连衣礼服，布料一定要绯红丝绒，工艺指定全毛衬手工归拔，不允许替换。领型等设计师提议。',
      hard: [
        eq('businessType', 'private_couture', '个人定制'), eq('quantity', 1, '一条'),
        eq('scene', 'formal_evening', '晚宴'), eq('category', 'dress', '连衣礼服'),
        eq('color', 'crimson', '绯红'), eq('fabric', 'velvet', '丝绒'),
        eq('craft', 'crf-full-canvas-guiba', '全毛衬手工归拔'),
      ],
      unknowns: [{ field: 'collar', reason: '未锁定领型，让设计师出选项。' }],
    }],
  },
  {
    id: 'R01', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '企业团装做三十四套，秋季室内正式活动穿，一定要松墨绿，面料用混纺。',
        hard: [
          eq('businessType', 'corporate_uniform', '企业团装'), eq('quantity', 34, '三十四套'),
          eq('season', 'autumn', '秋季'), eq('scene', 'indoor_formal', '室内正式'),
          eq('color', 'pine_green', '一定要松墨绿'), eq('fabric', 'blend', '面料用混纺'),
        ],
        unknowns: [{ field: 'care', reason: '首轮未指定洗护。' }],
      },
      {
        id: 't2',
        text: '配色改为暖灰，其他条件照旧。',
        hard: [
          eq('businessType', 'corporate_uniform', '企业团装'), eq('quantity', 34, '三十四套'),
          eq('season', 'autumn', '秋季'), eq('scene', 'indoor_formal', '室内正式'),
          eq('color', 'stone_gray', '改为暖灰', 't2'), eq('fabric', 'blend', '面料用混纺'),
        ],
        unknowns: [{ field: 'care', reason: '只改颜色，仍无洗护原话。' }],
        conflicts: ['color'],
        revision: { decision: 'apply', requestedFields: ['color'], changedFields: ['color'], invariantFields: ['businessType', 'quantity', 'season', 'scene', 'fabric'] },
      },
      {
        id: 't3',
        text: '补一条，洗护必须是专业干洗。',
        hard: [
          eq('businessType', 'corporate_uniform', '企业团装'), eq('quantity', 34, '三十四套'),
          eq('season', 'autumn', '秋季'), eq('scene', 'indoor_formal', '室内正式'),
          eq('color', 'stone_gray', '改为暖灰', 't2'), eq('fabric', 'blend', '面料用混纺'),
          eq('care', 'dry_clean', '专业干洗', 't3'),
        ],
        unknowns: [],
        revision: { decision: 'apply', requestedFields: ['care'], changedFields: ['care'], invariantFields: ['businessType', 'quantity', 'season', 'scene', 'color', 'fabric'] },
      },
    ],
  },
  {
    id: 'R02', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '给我个人定做一件外套，面料一定要炭黑醋酸，洗护按专业干洗。',
        hard: [
          ...grayCouture, eq('color', 'obsidian', '炭黑'), eq('fabric', 'acetate', '醋酸'),
          eq('care', 'dry_clean', '专业干洗'),
        ],
        unknowns: [{ field: 'scene', reason: '没有说明使用场合。' }],
      },
      {
        id: 't2',
        text: '采购想把干洗改掉，换成必须能放洗衣机洗，其他都照旧。',
        hard: [
          ...grayCouture, eq('color', 'obsidian', '炭黑'), eq('fabric', 'acetate', '醋酸'),
          eq('care', 'dry_clean', '专业干洗'),
        ],
        unknowns: [{ field: 'scene', reason: '改口只涉及洗护。' }],
        conflicts: ['care'],
        revision: { decision: 'keep', requestedFields: ['care'], changedFields: [], invariantFields: ['businessType', 'quantity', 'category', 'color', 'fabric', 'care'] },
      },
      {
        id: 't3',
        text: '最后还是按原来的干洗。只把款式领型定成立领。',
        hard: [
          ...grayCouture, eq('color', 'obsidian', '炭黑'), eq('fabric', 'acetate', '醋酸'),
          eq('care', 'dry_clean', '专业干洗'), eq('collar', 'stand', '领型定成立领', 't3'),
        ],
        unknowns: [{ field: 'scene', reason: '本轮确认保留洗护并补领型，场景仍未指定。' }],
        revision: { decision: 'apply', requestedFields: ['collar'], changedFields: ['collar'], invariantFields: ['businessType', 'quantity', 'category', 'color', 'fabric', 'care'] },
      },
    ],
  },
  {
    id: 'R03', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '公司团装 37 套，室内正式接待用，炭黑定死，领型必须是驳领。',
        hard: [...grayGroup, eq('collar', 'lapel', '必须是驳领')],
        unknowns: [{ field: 'fabric', reason: '未指定材质。' }],
      },
      {
        id: 't2',
        text: '先提议改成暖灰，其他不改。',
        hard: [...grayGroup, eq('collar', 'lapel', '必须是驳领')],
        unknowns: [{ field: 'fabric', reason: '颜色提议被取消，面料依旧没定。' }],
        conflicts: ['color'],
        revision: { decision: 'cancel', requestedFields: ['color'], changedFields: [], invariantFields: ['businessType', 'quantity', 'scene', 'color', 'collar'] },
      },
      {
        id: 't3',
        text: '颜色照原来的，领型改成立领。',
        hard: [...grayGroup, eq('collar', 'stand', '领型改成立领', 't3')],
        unknowns: [{ field: 'fabric', reason: '只改领型。' }],
        conflicts: ['collar'],
        revision: { decision: 'apply', requestedFields: ['collar'], changedFields: ['collar'], invariantFields: ['businessType', 'quantity', 'scene', 'color'] },
      },
    ],
  },
  {
    id: 'R04', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '我个人订一套冬天穿的暖灰西服套装，版面没问题，面料只用纯羊毛。',
        hard: [
          eq('businessType', 'private_couture', '我个人订'), eq('quantity', 1, '一套'),
          eq('season', 'winter', '冬天'), eq('color', 'stone_gray', '暖灰'), eq('category', 'suit', '西服套装'),
          eq('fabric', 'wool', '只用纯羊毛'),
        ],
        unknowns: [{ field: 'care', reason: '洗护没有提到。' }],
      },
      {
        id: 't2',
        text: '客户提出材质改真丝，旧的纯羊毛要求还不能撤，我得先跟负责人确认。',
        hard: [
          eq('businessType', 'private_couture', '我个人订'), eq('quantity', 1, '一套'),
          eq('season', 'winter', '冬天'), eq('color', 'stone_gray', '暖灰'), eq('category', 'suit', '西服套装'),
          eq('fabric', 'wool', '只用纯羊毛'),
        ],
        unknowns: [
          { field: 'fabric', reason: '批准改材质前仍保留旧版纯羊毛，替代项暂挂起。' },
          { field: 'care', reason: '两轮均无洗护要求。' },
        ],
        conflicts: ['fabric'], followUpFields: ['fabric'],
        revision: { decision: 'defer', requestedFields: ['fabric'], changedFields: [], invariantFields: ['businessType', 'quantity', 'season', 'color', 'category', 'fabric'] },
      },
      {
        id: 't3',
        text: '负责人拍板将材质改为混纺，其他按原方案。',
        hard: [
          eq('businessType', 'private_couture', '我个人订'), eq('quantity', 1, '一套'),
          eq('season', 'winter', '冬天'), eq('color', 'stone_gray', '暖灰'), eq('category', 'suit', '西服套装'),
          eq('fabric', 'blend', '改为混纺', 't3'),
        ],
        unknowns: [{ field: 'care', reason: '仍无洗护要求。' }],
        conflicts: ['fabric'],
        revision: { decision: 'apply', requestedFields: ['fabric'], changedFields: ['fabric'], invariantFields: ['businessType', 'quantity', 'season', 'color', 'category'] },
      },
    ],
  },
  {
    id: 'R05', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '冬季晚宴穿的连衣礼服，裙摆必须到地，用酒红丝绒。',
        hard: [...winterGown, eq('color', 'crimson', '酒红'), eq('fabric', 'velvet', '丝绒')],
        unknowns: [{ field: 'care', reason: '洗护未经确认。' }],
      },
      {
        id: 't2',
        text: '色系改为炭黑，材质一并换成真丝。晚宴和长度照旧。',
        hard: [...winterGown, eq('color', 'obsidian', '改为炭黑', 't2'), eq('fabric', 'silk', '换成真丝', 't2')],
        unknowns: [{ field: 'care', reason: '更换面料后应重新核查候选养护，客户仍未指定养护方式。' }],
        conflicts: ['color', 'fabric'],
        revision: { decision: 'apply', requestedFields: ['color', 'fabric'], changedFields: ['color', 'fabric'], invariantFields: ['scene', 'season', 'category', 'lengthRatio'] },
      },
      {
        id: 't3',
        text: '再补一条：材质照旧，指定布面有高光泽。',
        hard: [
          ...winterGown, eq('color', 'obsidian', '改为炭黑', 't2'), eq('fabric', 'silk', '换成真丝', 't2'),
          eq('luster', 'high', '有高光泽', 't3'),
        ],
        unknowns: [{ field: 'care', reason: '光泽与洗护是不同字段。' }],
        revision: { decision: 'apply', requestedFields: ['luster'], changedFields: ['luster'], invariantFields: ['scene', 'season', 'category', 'lengthRatio', 'color', 'fabric'] },
      },
    ],
  },
  {
    id: 'R06', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '企业团装二十二套，室内正式场合，必须暖灰，要混纺，正面不能有外露扣。',
        hard: warmGrayTeam,
        unknowns: [{ field: 'collar', reason: '客户只限定扣子露不露脸，领型未选。' }],
      },
      {
        id: 't2',
        text: '加一条，不要立领，扣子还是不能露。',
        hard: [...warmGrayTeam, neq('collar', 'stand', '不要立领', 't2')],
        unknowns: [{ field: 'collar', reason: '排除立领后也未指定另一种领型。' }],
        revision: { decision: 'apply', requestedFields: ['collar'], changedFields: ['collar'], invariantFields: ['businessType', 'quantity', 'scene', 'color', 'fabric', 'closure'] },
      },
      {
        id: 't3',
        text: '把「不要立领」这个限制撤掉，领型先待选，其他都保持。',
        hard: warmGrayTeam,
        unknowns: [{ field: 'collar', reason: '撤掉禁止项不等于指定立领，客户明确还没选。' }],
        revision: { decision: 'apply', requestedFields: ['collar'], changedFields: ['collar'], invariantFields: ['businessType', 'quantity', 'scene', 'color', 'fabric', 'closure'] },
      },
    ],
  },
];
