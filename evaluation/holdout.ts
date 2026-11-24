import type { Fixture, Triple } from './fixtures';

function eq(field: string, value: Triple['value'], quote: string, sourceTurnId = 't1') {
  return { field, op: 'eq' as const, value, quote, sourceTurnId };
}

function neq(field: string, value: Triple['value'], quote: string, sourceTurnId = 't1') {
  return { field, op: 'neq' as const, value, quote, sourceTurnId };
}

const dispatch = [
  eq('businessType', 'corporate_uniform', '统一定制团体职业服'),
  eq('category', 'suit', '西服套装'),
  eq('season', 'summer', '夏天穿'),
  eq('care', 'machine_wash', '必须能机洗'),
];
const gala = [
  eq('businessType', 'private_couture', '给我本人定做'),
  eq('quantity', 1, '一条'),
  eq('scene', 'formal_evening', '正式晚宴'),
  eq('category', 'dress', '连衣礼服'),
  eq('season', 'winter', '冬天'),
  eq('color', 'crimson', '绛红'),
  eq('fabric', 'velvet', '只用丝绒'),
];
const tour = [
  eq('businessType', 'corporate_uniform', '团队职业装'),
  eq('quantity', 38, '三十八套'),
  eq('scene', 'indoor_formal', '室内正式接待'),
  eq('color', 'stone_gray', '定建筑暖灰'),
  eq('fabric', 'blend', '指定混纺'),
];
const concierge = [
  eq('businessType', 'corporate_uniform', '给公司统一做团装'),
  eq('scene', 'indoor_formal', '室内正式会务'),
  eq('season', 'autumn', '秋天用'),
  eq('color', 'navy', '确定藏青'),
  eq('care', 'dry_clean', '洗护一定是专业干洗'),
];
const gallery = [
  eq('businessType', 'private_couture', '我自己穿，走个人定制'),
  eq('quantity', 1, '定一件'),
  eq('category', 'jacket', '外套'),
  eq('season', 'summer', '夏天'),
  eq('color', 'earth_brown', '茶褐色'),
  eq('luster', 'low', '面料要哑光'),
  eq('collar', 'stand', '立领定下了'),
];
const conductor = [
  eq('businessType', 'private_couture', '我个人定制'),
  eq('quantity', 1, '一套'),
  eq('scene', 'outdoor_stage', '户外舞台'),
  eq('season', 'autumn', '秋季'),
  eq('patternStructure', 'two_piece', '版型用两件式结构'),
  eq('lengthRatio', 'ankle', '裙摆及踝'),
  eq('easeAllowance', 'arm_mobility', '袖子必须抬得开'),
];

export const holdout: readonly Fixture[] = [
  {
    id: 'HS01', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '展馆揭幕当天在展厅里做正式迎宾，员工服统一订三十六套，配色就用建筑暖灰。怎么打理等物管回复。',
      hard: [
        eq('scene', 'indoor_formal', '展厅里做正式迎宾'), eq('businessType', 'corporate_uniform', '员工服统一订'),
        eq('quantity', 36, '三十六套'), eq('color', 'stone_gray', '就用建筑暖灰'),
      ],
      unknowns: [{ field: 'care', reason: '等待物管答复如何清洁保养。' }],
    }],
  },
  {
    id: 'HS02', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '给我自己订制一件夹克。腰那里别掐进去，整个衣身要像字母 H 一样直，下摆落在臀部正中。用料等摸过小样再定。',
      hard: [
        eq('businessType', 'private_couture', '给我自己订制'), eq('quantity', 1, '一件'),
        eq('category', 'jacket', '夹克'), eq('patternStructure', 'h_line', '衣身要像字母 H 一样直'),
        eq('lengthRatio', 'mid_hip', '下摆落在臀部正中'),
      ],
      unknowns: [{ field: 'fabric', reason: '硬约束是结构，面料等样布确认。' }],
    }],
  },
  {
    id: 'HS03', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '室外登台用的演出衣得分成上装和裙子两件，挥指挥棒的时候胳膊必须抬得起来。报价前先别填订购套数。',
      hard: [
        eq('scene', 'outdoor_stage', '室外登台'), eq('patternStructure', 'two_piece', '分成上装和裙子两件'),
        eq('easeAllowance', 'arm_mobility', '胳膊必须抬得起来'),
      ],
      unknowns: [{ field: 'quantity', reason: '两件是结构，套数等订单确认。' }],
    }],
  },
  {
    id: 'HS04', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '冬季正式婚宴上主持晚宴用。指定酒红色连衣礼服，裙脚得拂地。至于领口，我想看完几种再选。',
      hard: [
        eq('season', 'winter', '冬季'), eq('scene', 'formal_evening', '主持晚宴用'),
        eq('color', 'crimson', '指定酒红色'), eq('category', 'dress', '连衣礼服'),
        eq('lengthRatio', 'floor', '裙脚得拂地'),
      ],
      unknowns: [{ field: 'collar', reason: '客户要比较领型后再确定。' }],
    }],
  },
  {
    id: 'HS05', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '盛夏室内的正式授奖仪式穿。料子锁定米白色，只准同色的小暗花提花，不能改成印上去的花。清洗由后勤确认。',
      hard: [
        eq('season', 'summer', '盛夏'), eq('scene', 'indoor_formal', '室内的正式授奖仪式'),
        eq('color', 'ivory', '锁定米白色'), eq('motif', 'subtle_jacquard', '只准同色的小暗花提花'),
      ],
      unknowns: [{ field: 'care', reason: '已交后勤确认，能否机洗等尚无原话。' }],
    }],
  },
  {
    id: 'HS06', group: 'synonyms-omissions', turns: [{
      id: 't1',
      text: '要成套的西服，指定窄平驳领。面料偏向混纺，不过可以选别的，套数等预算批复。',
      hard: [eq('category', 'suit', '成套的西服'), eq('collar', 'lapel', '指定窄平驳领')],
      unknowns: [{ field: 'quantity', reason: '套数待批，混纺是偏好。' }],
    }],
  },
  {
    id: 'HN01', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '给集团接待队做四十八套团体职业服，黑色一律排除，领子不能是立领。其他颜色试色卡再决定。',
      hard: [
        eq('businessType', 'corporate_uniform', '团体职业服'), eq('quantity', 48, '四十八套'),
        neq('color', 'obsidian', '黑色一律排除'), neq('collar', 'stand', '不能是立领'),
      ],
      unknowns: [{ field: 'color', reason: '排除炭黑后暂无选定颜色。' }],
    }],
  },
  {
    id: 'HN02', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '秋天穿的工作服。采购备注每件必须手洗，店长写严禁手洗。请等两人确认后再定，别擅自舍掉其中一条。',
      hard: [
        eq('season', 'autumn', '秋天'), eq('businessType', 'corporate_uniform', '工作服'),
        eq('care', 'hand_wash', '必须手洗'), neq('care', 'hand_wash', '严禁手洗'),
      ],
      unknowns: [{ field: 'care', reason: '两条原话相互排斥，需确认以哪条为准。' }],
      conflicts: ['care'], followUpFields: ['care'],
      catalog: { outcome: 'blocked', source: '同轮明确要求并禁止手洗。' },
    }],
  },
  {
    id: 'HN03', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '员工统一穿的接待职业服，衣服正面一颗扣子都不能露，暖灰也明确排除。主料等供应商给资料。',
      hard: [
        eq('businessType', 'corporate_uniform', '员工统一穿的接待职业服'),
        eq('closure', 'no_visible_buttons', '正面一颗扣子都不能露'),
        neq('color', 'stone_gray', '暖灰也明确排除'),
      ],
      unknowns: [{ field: 'fabric', reason: '缺主料资料。' }],
    }],
  },
  {
    id: 'HN04', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '西服套装要能用家里的洗衣机洗，不能选只能干洗的料，面料光泽一定是哑光。现场没定正装颜色。',
      hard: [
        eq('category', 'suit', '西服套装'), eq('care', 'machine_wash', '用家里的洗衣机洗'),
        neq('care', 'dry_clean', '不能选只能干洗的料'), eq('luster', 'low', '一定是哑光'),
      ],
      unknowns: [{ field: 'color', reason: '哑光只限定表面光泽。' }],
    }],
  },
  {
    id: 'HN05', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '我更正一下，不是冬装，实际就是秋天穿的外套。松墨绿不要，其他颜色我还没勾选。',
      hard: [
        eq('season', 'autumn', '秋天穿'), eq('category', 'jacket', '外套'),
        neq('color', 'pine_green', '松墨绿不要'),
      ],
      unknowns: [{ field: 'color', reason: '排除指定墨绿色，尚无正向配色。冬装已明确更正。' }],
    }],
  },
  {
    id: 'HN06', group: 'negation-conflicts', turns: [{
      id: 't1',
      text: '二十四套团装，秋天用。涤纶不考虑，纯羊毛也一定不要。最终材质还得重新选。',
      hard: [
        eq('quantity', 24, '二十四套'), eq('businessType', 'corporate_uniform', '团装'),
        eq('season', 'autumn', '秋天用'), neq('fabric', 'polyester', '涤纶不考虑'),
        neq('fabric', 'wool', '纯羊毛也一定不要'),
      ],
      unknowns: [{ field: 'fabric', reason: '仅排除了两种材质，尚未选定其余选项。' }],
    }],
  },
  {
    id: 'HC01', group: 'catalog-no-match',
    catalog: {
      outcome: 'eligible',
      requiredIds: ['pat-haipai-gown-column', 'fab-xiangyun-crimson-velvet', 'crf-haipai-pipa-button'],
      source: 'src/data/patterns.ts#pat-haipai-gown-column 的连衣礼服比例、立领和季节；src/data/fabrics.ts#fab-xiangyun-crimson-velvet 的绛红色、丝绒和冬季适配；src/data/crafts.ts#crf-haipai-pipa-button 支持提花烂花丝绒。',
    },
    turns: [{
      id: 't1',
      text: '给我个人订一条冬季晚宴连衣礼服。裙摆拖地，必须是绛红丝绒，领子要立起来，斜襟指定手工琵琶盘扣。洗护听取工坊意见。',
      hard: [
        eq('businessType', 'private_couture', '给我个人订'), eq('quantity', 1, '一条'),
        eq('season', 'winter', '冬季'), eq('scene', 'formal_evening', '晚宴'), eq('category', 'dress', '连衣礼服'),
        eq('lengthRatio', 'floor', '裙摆拖地'), eq('color', 'crimson', '绛红'), eq('fabric', 'velvet', '丝绒'),
        eq('collar', 'stand', '领子要立起来'), eq('craft', 'crf-haipai-pipa-button', '手工琵琶盘扣'),
      ],
      unknowns: [{ field: 'care', reason: '客户尚未认可任何洗护方式。' }],
    }],
  },
  {
    id: 'HC02', group: 'catalog-no-match',
    catalog: {
      outcome: 'eligible',
      requiredIds: ['pat-minimal-unstructured-blazer', 'fab-demo-navy-washable-twill', 'crf-demo-washable-soft-seams'],
      source: 'src/data/patterns.ts#pat-minimal-unstructured-blazer 的夏季驳领西服；src/data/fabrics.ts#fab-demo-navy-washable-twill 与 src/data/crafts.ts#crf-demo-washable-soft-seams 的团队模拟洗护和面料兼容记录。',
    },
    turns: [{
      id: 't1',
      text: '导览队统一定制四十五套团体职业服，夏天用的西服套装。驳领，哑光，主料指定聚酯纤维，成衣一定要支持机洗。颜色等展馆确认。',
      hard: [
        eq('quantity', 45, '四十五套'), eq('businessType', 'corporate_uniform', '团体职业服'),
        eq('season', 'summer', '夏天用'), eq('category', 'suit', '西服套装'), eq('collar', 'lapel', '驳领'),
        eq('luster', 'low', '哑光'), eq('fabric', 'polyester', '指定聚酯纤维'), eq('care', 'machine_wash', '一定要支持机洗'),
      ],
      unknowns: [{ field: 'color', reason: '以展馆确认的颜色为准，面料建议不替代客户确认。' }],
    }],
  },
  {
    id: 'HC03', group: 'catalog-no-match',
    catalog: {
      outcome: 'no-match',
      source: 'src/data/fabrics.ts#fab-suzhou-moonlight-white 的月白 100% 桑蚕丝仅适用于私定，也未列明手洗。团队模拟可机洗、专业干洗不提供月白的纯丝团装手洗依据。',
      blockers: [
        { assetId: 'fab-suzhou-moonlight-white', field: 'businessType', kind: 'known-violation', source: '该面料 suitableBusiness 只有 private_couture。' },
        { assetId: 'fab-suzhou-moonlight-white', field: 'care', kind: 'unknown-attribute', source: '该面料 careAndMoqNote 只写专业丝绸护理。' },
      ],
    },
    turns: [{
      id: 't1',
      text: '宾客服务中心订五十二套统一工作服，必须用月白色，而且只能用纯桑蚕丝，洗护指定手洗。领型可以商量。',
      hard: [
        eq('quantity', 52, '五十二套'), eq('businessType', 'corporate_uniform', '统一工作服'),
        eq('color', 'ivory', '必须用月白色'), eq('fabric', 'silk', '只能用纯桑蚕丝'),
        eq('care', 'hand_wash', '洗护指定手洗'),
      ],
      unknowns: [{ field: 'collar', reason: '领型未锁定。' }],
    }],
  },
  {
    id: 'HC04', group: 'catalog-no-match',
    catalog: {
      outcome: 'no-match',
      source: 'src/data/patterns.ts#pat-haipai-gown-column 的曳地款使用改良立领和斜襟。青果领及平驳领位于外套/职业套装目录。src/data/cases.ts#case-hist-005 仅为晚宴历史参考。',
      blockers: [
        { assetId: 'pat-haipai-gown-column', field: 'collar', kind: 'known-violation', source: '该版型 collarType 为改良海派低立领和斜襟盘扣线。' },
        { assetId: 'case-hist-005', field: 'collar', kind: 'reference-only', source: '该历史案例只能检索参考，由版型 collarType 决定实际可用领型。' },
      ],
    },
    turns: [{
      id: 't1',
      text: '我想个人定做一条曳地连衣礼服，正式晚宴穿。领口必须是西服平驳领。主色由造型师复核。',
      hard: [
        eq('businessType', 'private_couture', '个人定做'), eq('quantity', 1, '一条'),
        eq('lengthRatio', 'floor', '曳地'), eq('category', 'dress', '连衣礼服'),
        eq('scene', 'formal_evening', '正式晚宴'), eq('collar', 'lapel', '必须是西服平驳领'),
      ],
      unknowns: [{ field: 'color', reason: '等待造型师确认色卡。' }],
    }],
  },
  {
    id: 'HC05', group: 'catalog-no-match',
    catalog: {
      outcome: 'no-match',
      source: 'src/data/fabrics.ts#fab-official-acetate-jacquard 是炭黑醋酸提花，目录护理为专业干洗。可机洗团队模拟料均另有成分及配色。',
      blockers: [{
        assetId: 'fab-official-acetate-jacquard', field: 'care', kind: 'known-violation',
        source: '该面料 careAndMoqNote 写常规专业干洗。',
      }],
    },
    turns: [{
      id: 't1',
      text: '我个人定制一件炭黑外套，面料锁定醋酸，必须能整件放进家用洗衣机。礼宾的时候穿，里衬由版师定。',
      hard: [
        eq('businessType', 'private_couture', '我个人定制'), eq('quantity', 1, '一件'),
        eq('color', 'obsidian', '炭黑'), eq('category', 'jacket', '外套'),
        eq('fabric', 'acetate', '锁定醋酸'), eq('care', 'machine_wash', '必须能整件放进家用洗衣机'),
      ],
      unknowns: [{ field: 'scene', reason: '礼宾可在室内或室外，客户尚未指定。' }],
    }],
  },
  {
    id: 'HC06', group: 'catalog-no-match',
    catalog: {
      outcome: 'no-match',
      source: 'src/data/crafts.ts#crf-suzhou-magnolia-embroidery 的适用业务为私定，兼容织法为宋锦、织锦和丝绒。团装聚酯缝制包不含此工艺。',
      blockers: [{
        assetId: 'crf-suzhou-magnolia-embroidery', field: 'businessType', kind: 'known-violation',
        source: '该工艺 suitableBusiness 只有 private_couture，且材料兼容表没有模拟聚酯高密斜纹。',
      }],
    },
    turns: [{
      id: 't1',
      text: '门店成批做三十二套团体职业服，面料必须涤纶，门襟工艺指定苏州暗纹玉兰手绣。用色暂且不要做决定。',
      hard: [
        eq('quantity', 32, '三十二套'), eq('businessType', 'corporate_uniform', '团体职业服'),
        eq('fabric', 'polyester', '必须涤纶'), eq('craft', 'crf-suzhou-magnolia-embroidery', '苏州暗纹玉兰手绣'),
      ],
      unknowns: [{ field: 'color', reason: '项目方未定颜色。' }],
    }],
  },
  {
    id: 'HR01', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '调度组统一定制团体职业服，32 套西服套装，夏天穿，必须能机洗。颜色统一但先不选。',
        hard: [...dispatch, eq('quantity', 32, '32 套')],
        unknowns: [{ field: 'color', reason: '尚未选择色系。' }],
      },
      {
        id: 't2',
        text: '再加一个硬标准，久坐后也得耐皱。',
        hard: [...dispatch, eq('quantity', 32, '32 套'), eq('wrinkleResistance', true, '也得耐皱', 't2')],
        unknowns: [{ field: 'color', reason: '只加抗皱条件，颜色仍待提供。' }],
        revision: { decision: 'apply', requestedFields: ['wrinkleResistance'], changedFields: ['wrinkleResistance'], invariantFields: ['businessType', 'quantity', 'category', 'season', 'care'] },
      },
      {
        id: 't3',
        text: '部门多来了几个人，数量以 46 套为准，其他要求照单执行。',
        hard: [...dispatch, eq('quantity', 46, '以 46 套为准', 't3'), eq('wrinkleResistance', true, '也得耐皱', 't2')],
        unknowns: [{ field: 'color', reason: '客户仅确认变更数量。' }],
        conflicts: ['quantity'],
        revision: { decision: 'apply', requestedFields: ['quantity'], changedFields: ['quantity'], invariantFields: ['businessType', 'category', 'season', 'care', 'wrinkleResistance'] },
      },
    ],
  },
  {
    id: 'HR02', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '给我本人定做一条正式晚宴的连衣礼服，冬天穿，裙摆曳地，绛红，只用丝绒。领子以后定。',
        hard: [...gala, eq('lengthRatio', 'floor', '裙摆曳地')],
        unknowns: [{ field: 'collar', reason: '未指定领型。' }],
      },
      {
        id: 't2',
        text: '现场有楼梯，长度改成裙摆及踝，其他照旧。',
        hard: [...gala, eq('lengthRatio', 'ankle', '裙摆及踝', 't2')],
        unknowns: [{ field: 'collar', reason: '只改衣长，领型仍待定。' }],
        conflicts: ['lengthRatio'],
        revision: { decision: 'apply', requestedFields: ['lengthRatio'], changedFields: ['lengthRatio'], invariantFields: ['businessType', 'quantity', 'scene', 'category', 'season', 'color', 'fabric'] },
      },
      {
        id: 't3',
        text: '造型师另提议把丝绒换成真丝。帮我预览，先别提交。',
        hard: [...gala, eq('lengthRatio', 'ankle', '裙摆及踝', 't2')],
        unknowns: [{ field: 'collar', reason: '取消材质预览，未指定领型。' }],
        conflicts: ['fabric'],
        revision: { decision: 'cancel', requestedFields: ['fabric'], changedFields: [], invariantFields: ['businessType', 'quantity', 'scene', 'category', 'season', 'color', 'fabric', 'lengthRatio'] },
      },
    ],
  },
  {
    id: 'HR03', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '室内正式接待的团队职业装，三十八套，定建筑暖灰，指定混纺。领型放到下一轮再看。',
        hard: tour,
        unknowns: [{ field: 'collar', reason: '先不选领型。' }],
      },
      {
        id: 't2',
        text: '版师补了一条，领口不用立领，别的照做。',
        hard: [...tour, neq('collar', 'stand', '不用立领', 't2')],
        unknowns: [{ field: 'collar', reason: '排除立领后，仍未选定其他领型。' }],
        revision: { decision: 'apply', requestedFields: ['collar'], changedFields: ['collar'], invariantFields: ['businessType', 'quantity', 'scene', 'color', 'fabric'] },
      },
      {
        id: 't3',
        text: '上一轮关于不用立领的限制取消，领型仍然待选，别动其他内容。',
        hard: tour,
        unknowns: [{ field: 'collar', reason: '撤回禁止项，领型继续待选。' }],
        revision: { decision: 'apply', requestedFields: ['collar'], changedFields: ['collar'], invariantFields: ['businessType', 'quantity', 'scene', 'color', 'fabric'] },
      },
    ],
  },
  {
    id: 'HR04', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '给公司统一做团装，48 套，室内正式会务用，秋天用。确定藏青，洗护一定是专业干洗。主料先不定。',
        hard: [...concierge, eq('quantity', 48, '48 套')],
        unknowns: [{ field: 'fabric', reason: '客户未选材质。' }],
      },
      {
        id: 't2',
        text: '采购说想改成可以用洗衣机洗，原来的干洗条件还没获准撤销，先问负责人。',
        hard: [...concierge, eq('quantity', 48, '48 套')],
        unknowns: [{ field: 'care', reason: '反馈暂挂，干洗硬条件仍留在当前版本。' }],
        conflicts: ['care'],
        revision: { decision: 'defer', requestedFields: ['care'], changedFields: [], invariantFields: ['businessType', 'quantity', 'scene', 'season', 'color', 'care'] },
      },
      {
        id: 't3',
        text: '负责人定了，洗护仍旧按原来的，只改发放量，最终订 52 套。',
        hard: [...concierge, eq('quantity', 52, '最终订 52 套', 't3')],
        unknowns: [{ field: 'fabric', reason: '仅确认改数量。' }],
        conflicts: ['quantity'],
        revision: { decision: 'apply', requestedFields: ['quantity'], changedFields: ['quantity'], invariantFields: ['businessType', 'scene', 'season', 'color', 'care'] },
      },
    ],
  },
  {
    id: 'HR05', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '我自己穿，走个人定制。定一件夏天的外套，茶褐色面料要哑光，立领定下了。怎么洗等裁缝建议。',
        hard: gallery,
        unknowns: [{ field: 'care', reason: '洗护尚未核定。' }],
      },
      {
        id: 't2',
        text: '朋友问要不要把立领换驳领。我还需要看一下可不可以。',
        hard: gallery,
        unknowns: [{ field: 'care', reason: '保留原来领型，洗护未提。' }],
        conflicts: ['collar'],
        revision: { decision: 'keep', requestedFields: ['collar'], changedFields: [], invariantFields: ['businessType', 'quantity', 'category', 'season', 'color', 'luster', 'collar'] },
      },
      {
        id: 't3',
        text: '我在发布会上需要举手展示样品，袖子必须能抬臂不受限，其他仍按原来定的做。',
        hard: [...gallery, eq('easeAllowance', 'arm_mobility', '必须能抬臂不受限', 't3')],
        unknowns: [{ field: 'care', reason: '洗护依旧未提。' }],
        revision: { decision: 'apply', requestedFields: ['easeAllowance'], changedFields: ['easeAllowance'], invariantFields: ['businessType', 'quantity', 'category', 'season', 'color', 'luster', 'collar'] },
      },
    ],
  },
  {
    id: 'HR06', group: 'multi-round-revisions', turns: [
      {
        id: 't1',
        text: '我个人定制一套秋季户外舞台用的演出衣，版型用两件式结构，裙摆及踝，袖子必须抬得开。色样跟导演确认。',
        hard: conductor,
        unknowns: [{ field: 'color', reason: '服装颜色仍待导演确认。' }],
      },
      {
        id: 't2',
        text: '添两项，颜色定成绯红，涤纶一定不要。原有结构和演出动作都照之前约定。',
        hard: [...conductor, eq('color', 'crimson', '定成绯红', 't2'), neq('fabric', 'polyester', '涤纶一定不要', 't2')],
        unknowns: [{ field: 'care', reason: '洗护方式暂无要求。' }],
        revision: { decision: 'apply', requestedFields: ['color', 'fabric'], changedFields: ['color', 'fabric'], invariantFields: ['businessType', 'quantity', 'scene', 'season', 'patternStructure', 'lengthRatio', 'easeAllowance'] },
      },
      {
        id: 't3',
        text: '导演把颜色换成米白撞亮粉。不要动材料的限制和原来的版式。',
        hard: [...conductor, eq('color', 'ivory_rose', '换成米白撞亮粉', 't3'), neq('fabric', 'polyester', '涤纶一定不要', 't2')],
        unknowns: [{ field: 'care', reason: '只更换配色，未指定洗护。' }],
        conflicts: ['color'],
        revision: { decision: 'apply', requestedFields: ['color'], changedFields: ['color'], invariantFields: ['businessType', 'quantity', 'scene', 'season', 'patternStructure', 'lengthRatio', 'easeAllowance', 'fabric'] },
      },
    ],
  },
];
