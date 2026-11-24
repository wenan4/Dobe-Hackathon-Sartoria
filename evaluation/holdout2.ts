import type { Fixture, FixtureTurn, Triple } from './fixtures';

type Hard = FixtureTurn['hard'][number];

function eq(field: Triple['field'], value: Triple['value'], quote: string, sourceTurnId = 't1'): Hard {
  return { field, op: 'eq', value, quote, sourceTurnId };
}

function neq(field: Triple['field'], value: Triple['value'], quote: string): Hard {
  return { field, op: 'neq', value, quote, sourceTurnId: 't1' };
}

const pineSuit = [
  eq('businessType', 'corporate_uniform', '员工团订'),
  eq('category', 'suit', '西服'),
  eq('color', 'pine_green', '松墨绿'),
  eq('collar', 'stand', '立领'),
];

const redGownBase = [eq('category', 'dress', '连衣礼服'), eq('quantity', 2, '两件')];
const blackGown = [...redGownBase, eq('color', 'obsidian', '炭黑'), eq('luster', 'high', '必须用亮面')];
const brownJacketBase = [eq('quantity', 3, '三件'), eq('category', 'jacket', '外套')];
const brownJacket = [...brownJacketBase, eq('color', 'earth_brown', '古茶墨褐'), eq('luster', 'low', '必须哑光')];
const brownJacketUnknowns = [{ field: 'care', reason: '顾客明确说洗护暂未确定。' }];

const graySuit = [
  eq('businessType', 'corporate_uniform', '团体采购'),
  eq('category', 'suit', '西服'),
  eq('quantity', 27, '二十七套'),
  eq('color', 'stone_gray', '暖灰'),
];

const patternedGown = [
  eq('category', 'dress', '连身礼服'),
  eq('quantity', 4, '四件'),
  eq('motif', 'subtle_jacquard', '一定要有织出来的暗花'),
  eq('color', 'obsidian', '墨黛鎏金黑'),
];

const woolSuitBase = [
  eq('businessType', 'corporate_uniform', '接待组员工团订'),
  eq('category', 'suit', '西服'),
  eq('quantity', 14, '十四套'),
  eq('style', 'modern', '风格定为现代商务'),
];

const dryClean = eq('care', 'dry_clean', '只能专业干洗');
const woolSuitUnknowns = [{ field: 'color', reason: '未收到品牌同事的色号。' }];

export const HOLDOUT2_FIXTURES: readonly Fixture[] = [
  {
    id: 'H2-S01', group: 'synonyms-omissions', turns: [{
      id: 't1', text: '门店给领班团体订做三十四套西服。能少点反光更好；颜色和用料等采购签样后再填。',
      hard: [eq('businessType', 'corporate_uniform', '给领班团体订做'), eq('quantity', 34, '三十四套'), eq('category', 'suit', '西服')],
      unknowns: [{ field: 'color', reason: '等采购签样。' }, { field: 'fabric', reason: '等采购签样。' }],
    }],
  },
  {
    id: 'H2-S02', group: 'synonyms-omissions', turns: [{
      id: 't1', text: '录颁奖短片要一条连衣礼服，领口一定走斜襟，下摆长度等试穿再定。冷色我比较喜欢。',
      hard: [eq('quantity', 1, '一条'), eq('category', 'dress', '连衣礼服'), eq('collar', 'diagonal', '一定走斜襟')],
      unknowns: [{ field: 'lengthRatio', reason: '裙长留到试穿时确认。' }],
    }],
  },
  {
    id: 'H2-S03', group: 'synonyms-omissions', turns: [{
      id: 't1', text: '这批员工团购订三十六套西服，成衣一定得能进洗衣机。颜色待品牌部签字，黑色现在只是参考。',
      hard: [eq('businessType', 'corporate_uniform', '员工团购订'), eq('quantity', 36, '三十六套'), eq('category', 'suit', '西服'), eq('care', 'machine_wash', '一定得能进洗衣机')],
      unknowns: [{ field: 'color', reason: '品牌部尚未签字，黑色只是参考。' }],
    }],
  },
  {
    id: 'H2-S04', group: 'synonyms-omissions', turns: [{
      id: 't1', text: '场地确认了，都在剧场里面演出。服装做哪一类还得等导演回话，面料已经定用涤纶。领口我个人比较喜欢平驳领。',
      hard: [eq('scene', 'indoor_performance', '都在剧场里面演出'), eq('fabric', 'polyester', '已经定用涤纶')],
      unknowns: [{ field: 'category', reason: '服装类别由导演确认。' }],
    }],
  },
  {
    id: 'H2-S05', group: 'synonyms-omissions', turns: [{
      id: 't1', text: '物业给值班人员团体订购二十六套，明确只在冬天上岗时穿。做成哪一类衣服还没定，洗护方式也等样衣出来再定。',
      hard: [eq('businessType', 'corporate_uniform', '给值班人员团体订购'), eq('quantity', 26, '二十六套'), eq('season', 'winter', '只在冬天')],
      unknowns: [{ field: 'category', reason: '服装类别尚未确定。' }, { field: 'care', reason: '等待样衣后确定洗护方式。' }],
    }],
  },
  {
    id: 'H2-S06', group: 'synonyms-omissions', turns: [{
      id: 't1', text: '我个人定制外套，料子指定醋酸，必须有织进去的暗花。色号由我另行确认，光泽倾向微亮。',
      hard: [eq('businessType', 'private_couture', '我个人定制'), eq('category', 'jacket', '外套'), eq('fabric', 'acetate', '指定醋酸'), eq('motif', 'subtle_jacquard', '必须有织进去的暗花')],
      unknowns: [{ field: 'color', reason: '顾客保留色号确认权。' }],
    }],
  },
  {
    id: 'H2-N01', group: 'negation-conflicts', turns: [{
      id: 't1', text: '我给自己定制一件外套，领口别做立领。平驳领可以摆在备选里。面料先留空，我要摸过样再选。',
      hard: [eq('businessType', 'private_couture', '给自己定制'), eq('quantity', 1, '一件'), eq('category', 'jacket', '外套'), neq('collar', 'stand', '别做立领')],
      unknowns: [{ field: 'fabric', reason: '顾客明确保留试样后选料。' }],
    }],
  },
  {
    id: 'H2-N02', group: 'negation-conflicts', turns: [{
      id: 't1', text: '采购文件写明面料必须是羊毛，门店合同却写面料必须是涤纶。两份文件都有效，等采购和门店确认用哪种。',
      hard: [eq('fabric', 'wool', '必须是羊毛'), eq('fabric', 'polyester', '必须是涤纶')],
      unknowns: [], conflicts: ['fabric'], followUpFields: ['fabric'],
    }],
  },
  {
    id: 'H2-N03', group: 'negation-conflicts', turns: [{
      id: 't1', text: '先订一件外套。不能拿去干洗，颜色也避开炭黑。面料我还没定，等这周看完小样。',
      hard: [eq('quantity', 1, '一件'), eq('category', 'jacket', '外套'), neq('care', 'dry_clean', '不能拿去干洗'), neq('color', 'obsidian', '避开炭黑')],
      unknowns: [{ field: 'fabric', reason: '等看完小样确认料子。' }],
    }],
  },
  {
    id: 'H2-N04', group: 'negation-conflicts', turns: [{
      id: 't1', text: '合同上要求成衣必须能手洗，但护理师的新签样又要求严禁手洗。暂时两边都没撤回，得先核对。',
      hard: [eq('care', 'hand_wash', '必须能手洗'), neq('care', 'hand_wash', '严禁手洗')],
      unknowns: [], conflicts: ['care'], followUpFields: ['care'],
    }],
  },
  {
    id: 'H2-N05', group: 'negation-conflicts', turns: [{
      id: 't1', text: '这回做西服，不用真丝，也不要织进去的暗花。领型下次试样时定。',
      hard: [eq('category', 'suit', '西服'), neq('fabric', 'silk', '不用真丝'), neq('motif', 'subtle_jacquard', '不要织进去的暗花')],
      unknowns: [{ field: 'collar', reason: '领型等待试样确认。' }],
    }],
  },
  {
    id: 'H2-N06', group: 'negation-conflicts', turns: [{
      id: 't1', text: '排期单要求十七件连身礼服，签收表却要求十六件。现在两张单据都有效，等制片人核对数量。',
      hard: [eq('quantity', 17, '十七件'), eq('quantity', 16, '十六件'), eq('category', 'dress', '连身礼服')],
      unknowns: [], conflicts: ['quantity'], followUpFields: ['quantity'],
    }],
  },
  {
    id: 'H2-C01', group: 'catalog-no-match', turns: [{
      id: 't1', text: '镜头排练要提前出六套舞台两件套演出服。外套定斜襟，裙长要求及踝，必须用真丝。',
      hard: [
        eq('quantity', 6, '六套'), eq('category', 'two_piece', '舞台两件套演出服'), eq('patternStructure', 'two_piece', '两件套'),
        eq('collar', 'diagonal', '外套定斜襟'), eq('lengthRatio', 'ankle', '裙长要求及踝'), eq('fabric', 'silk', '必须用真丝'),
      ],
      unknowns: [],
      catalog: {
        outcome: 'eligible', requiredIds: ['pat-official-stage-twopiece', 'fab-official-ivory-rose-stage'],
        source: 'decisionCatalog.ts · 两件式 SFG-PT-103 为斜襟、及踝，兼容真丝 SFG-FB-003，二者均覆盖六套。',
      },
    }],
  },
  {
    id: 'H2-C02', group: 'catalog-no-match', turns: [{
      id: 't1', text: '演出赞助方要三件绛红连衣礼服，必须用丝绒，裙摆拖地，领口是立领。',
      hard: [
        eq('quantity', 3, '三件'), eq('color', 'crimson', '绛红'), eq('category', 'dress', '连衣礼服'),
        eq('fabric', 'velvet', '必须用丝绒'), eq('lengthRatio', 'floor', '裙摆拖地'), eq('collar', 'stand', '领口是立领'),
      ],
      unknowns: [],
      catalog: {
        outcome: 'eligible', requiredIds: ['pat-haipai-gown-column', 'fab-xiangyun-crimson-velvet'],
        source: 'decisionCatalog.ts · SFG-PT-202 允许立领和拖地裙长，SFG-FB-103 丝绒与其兼容，均支持三件。fabrics.ts · SFG-FB-103 的色系为 crimson。',
      },
    }],
  },
  {
    id: 'H2-C03', group: 'catalog-no-match', turns: [{
      id: 't1', text: '要给红毯礼宾做九件拖地连衣礼服，统一用丝绒，也不能拆成两批。',
      hard: [eq('quantity', 9, '九件'), eq('lengthRatio', 'floor', '拖地'), eq('category', 'dress', '连衣礼服'), eq('fabric', 'velvet', '统一用丝绒')],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'decisionCatalog.ts · 连衣礼服 SFG-PT-202 和兼容丝绒 SFG-FB-103 均仅覆盖 1–8 件，九件超出目录模拟区间。',
        blockers: [
          { assetId: 'pat-haipai-gown-column', field: 'quantity', kind: 'known-violation', source: 'decisionCatalog.ts · SFG-PT-202 的 quantity 为 [1, 8]。' },
        ],
      },
    }],
  },
  {
    id: 'H2-C04', group: 'catalog-no-match', turns: [{
      id: 't1', text: '订三件炭黑外套，把领口做成立领，成衣必须允许机洗。',
      hard: [eq('quantity', 3, '三件'), eq('color', 'obsidian', '炭黑'), eq('category', 'jacket', '外套'), eq('collar', 'stand', '做成立领'), eq('care', 'machine_wash', '必须允许机洗')],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'decisionCatalog.ts · 立领外套 SFG-PT-101、SFG-PT-104 兼容的炭黑模拟材料 SFG-FB-001 标为专业干洗；目录无炭黑可机洗配套。',
        blockers: [{ assetId: 'fab-official-acetate-jacquard', field: 'care', kind: 'known-violation', source: 'decisionCatalog.ts · SFG-FB-001 的 care 为 dry_clean。' }],
      },
    }],
  },
  {
    id: 'H2-C05', group: 'catalog-no-match', turns: [{
      id: 't1', text: '外套订三件，色号选古茶墨褐，布面要纯色无花，打包出差必须抗皱。',
      hard: [eq('category', 'jacket', '外套'), eq('quantity', 3, '三件'), eq('color', 'earth_brown', '古茶墨褐'), eq('motif', 'plain', '纯色无花'), eq('wrinkleResistance', true, '必须抗皱')],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'fabrics.ts · 古茶墨褐对应 SFG-FB-004。decisionCatalog.ts · 该资产明确为 wrinkleResistance: false。',
        blockers: [{ assetId: 'fab-official-xiangyun-matte', field: 'wrinkleResistance', kind: 'known-violation', source: 'decisionCatalog.ts · SFG-FB-004 的 wrinkleResistance 为 false。' }],
      },
    }],
  },
  {
    id: 'H2-C06', group: 'catalog-no-match', turns: [{
      id: 't1', text: '前台员工团订二十四套暖灰西服，后勤明确要求整件可以手洗，想按这个要求找货。',
      hard: [eq('businessType', 'corporate_uniform', '员工团订'), eq('quantity', 24, '二十四套'), eq('color', 'stone_gray', '暖灰'), eq('category', 'suit', '西服'), eq('care', 'hand_wash', '整件可以手洗')],
      unknowns: [],
      catalog: {
        outcome: 'no-match',
        source: 'decisionCatalog.ts · SFG-FB-202 在数量区间内并可配团装西服，资料将洗护留待核验，无法证实可手洗。',
        blockers: [{ assetId: 'fab-shikumen-stone-gray', field: 'care', kind: 'unknown-attribute', source: 'decisionCatalog.ts · SFG-FB-202 未记录 care，legacyAssetSources 注明洗护待核。' }],
      },
    }],
  },
  {
    id: 'H2-R01', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '员工团订四十二套西服，做立领，颜色松墨绿。',
        hard: [...pineSuit, eq('quantity', 42, '四十二套')], unknowns: [],
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-suit-ensemble', 'fab-shanghai-pine-green'], source: 'decisionCatalog.ts · SFG-PT-201 立领 20–200 套，兼容松墨绿 SFG-FB-203 的 20–60 套范围。' },
      },
      {
        id: 't2', text: '第二班的人也要纳进来，把数量改成六十四套，确认。其他要求照旧。',
        hard: [...pineSuit, eq('quantity', 64, '六十四套', 't2')], unknowns: [],
        revision: { decision: 'apply', requestedFields: ['quantity'], changedFields: ['quantity'], invariantFields: ['businessType', 'category', 'collar', 'color'] },
        catalog: {
          outcome: 'no-match', source: 'decisionCatalog.ts · 松墨绿 SFG-FB-203 的模拟数量 20–60 套。',
          blockers: [{ assetId: 'fab-shanghai-pine-green', field: 'quantity', kind: 'known-violation', source: 'decisionCatalog.ts · SFG-FB-203 的 quantity 为 [20, 60]。' }],
        },
      },
      {
        id: 't3', text: '第二班改用库存，这单改回四十二套，以四十二套为准。',
        hard: [...pineSuit, eq('quantity', 42, '四十二套', 't3')], unknowns: [],
        revision: { decision: 'apply', requestedFields: ['quantity'], changedFields: ['quantity'], invariantFields: ['businessType', 'category', 'collar', 'color'] },
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-suit-ensemble', 'fab-shanghai-pine-green'], source: 'decisionCatalog.ts · SFG-PT-201 与 SFG-FB-203 的模拟数量区间均覆盖四十二套。' },
      },
    ],
  },
  {
    id: 'H2-R02', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '给拍摄订两件连衣礼服，颜色炭黑，打灯效果要求必须用亮面。',
        hard: blackGown, unknowns: [],
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-gown-column', 'fab-song-obsidian-gold'], source: 'decisionCatalog.ts · SFG-PT-202 可配高光泽 SFG-FB-101，二者支持两件。fabrics.ts · SFG-FB-101 的色系为 obsidian。' },
      },
      {
        id: 't2', text: '摄影师提议改成绛红。我决定保留原方案的炭黑，这次改色不采纳。',
        hard: blackGown, unknowns: [],
        revision: { decision: 'keep', requestedFields: ['color'], changedFields: [], invariantFields: ['category', 'quantity', 'color', 'luster'] },
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-gown-column', 'fab-song-obsidian-gold'], source: 'decisionCatalog.ts · 保留炭黑、高光泽和两件时，SFG-PT-202 与 SFG-FB-101 可搭配。' },
      },
      {
        id: 't3', text: '现在用另一组灯，确认改成绛红。光泽从亮面改成柔和微光，两件连衣礼服照旧。',
        hard: [...redGownBase, eq('color', 'crimson', '改成绛红', 't3'), eq('luster', 'medium', '改成柔和微光', 't3')], unknowns: [],
        revision: { decision: 'apply', requestedFields: ['color', 'luster'], changedFields: ['color', 'luster'], invariantFields: ['category', 'quantity'] },
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-gown-column', 'fab-xiangyun-crimson-velvet'], source: 'decisionCatalog.ts · SFG-FB-103 为中光泽，与 SFG-PT-202 兼容，数量均覆盖两件。fabrics.ts · SFG-FB-103 的色系为 crimson。' },
      },
    ],
  },
  {
    id: 'H2-R03', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '做三件外套，颜色古茶墨褐，料面必须哑光。洗护方法暂未确定。',
        hard: brownJacket, unknowns: brownJacketUnknowns,
        catalog: { outcome: 'eligible', requiredIds: ['fab-official-xiangyun-matte'], source: 'decisionCatalog.ts · SFG-FB-004 低光泽、覆盖三件，可配 SFG-PT-101 或 SFG-PT-104。fabrics.ts · SFG-FB-004 为古茶墨褐。' },
      },
      {
        id: 't2', text: '有人提议把专业干洗列成硬条件。这条洗护变更先暂缓，等护理方回信后再决定。',
        hard: brownJacket, unknowns: brownJacketUnknowns,
        revision: { decision: 'defer', requestedFields: ['care'], changedFields: [], invariantFields: ['category', 'quantity', 'color', 'luster', 'care'] },
        catalog: { outcome: 'eligible', requiredIds: ['fab-official-xiangyun-matte'], source: 'decisionCatalog.ts · 未确认洗护条件时，SFG-FB-004 可满足现有颜色、光泽、数量。' },
      },
      {
        id: 't3', text: '先下版，确认颜色改炭黑，光泽改柔和微光，洗护仍然待定。',
        hard: [...brownJacketBase, eq('color', 'obsidian', '颜色改炭黑', 't3'), eq('luster', 'medium', '光泽改柔和微光', 't3')], unknowns: brownJacketUnknowns,
        revision: { decision: 'apply', requestedFields: ['color', 'luster'], changedFields: ['color', 'luster'], invariantFields: ['category', 'quantity', 'care'] },
        catalog: { outcome: 'eligible', requiredIds: ['fab-official-acetate-jacquard'], source: 'decisionCatalog.ts · 中光泽 SFG-FB-001 兼容多款外套并覆盖三件。fabrics.ts · SFG-FB-001 墨曜炭黑。' },
      },
    ],
  },
  {
    id: 'H2-R04', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '园区团体采购二十七套西服，领口做平驳领，颜色暖灰。',
        hard: [...graySuit, eq('collar', 'lapel', '平驳领')], unknowns: [],
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-suit-ensemble-lapel', 'fab-shikumen-stone-gray'], source: 'decisionCatalog.ts · SFG-PT-201-L 平驳领可配 SFG-FB-202，二者涵盖二十七套。fabrics.ts · SFG-FB-202 为暖灰。' },
      },
      {
        id: 't2', text: '领子改成立领，这个变更确认了。其余照前一版。',
        hard: [...graySuit, eq('collar', 'stand', '改成立领', 't2')], unknowns: [],
        revision: { decision: 'apply', requestedFields: ['collar'], changedFields: ['collar'], invariantFields: ['businessType', 'category', 'quantity', 'color'] },
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-suit-ensemble', 'fab-shikumen-stone-gray'], source: 'decisionCatalog.ts · 立领 SFG-PT-201 同样可配暖灰 SFG-FB-202。' },
      },
      {
        id: 't3', text: '行政原本想换回平驳领。取消这次换回去的改动，继续按已经确认的立领做。',
        hard: [...graySuit, eq('collar', 'stand', '改成立领', 't2')], unknowns: [],
        revision: { decision: 'cancel', requestedFields: ['collar'], changedFields: [], invariantFields: ['businessType', 'category', 'quantity', 'color', 'collar'] },
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-suit-ensemble', 'fab-shikumen-stone-gray'], source: 'decisionCatalog.ts · 保留立领时，SFG-PT-201 与暖灰 SFG-FB-202 继续兼容。' },
      },
    ],
  },
  {
    id: 'H2-R05', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '晚宴要四件连身礼服，选墨黛鎏金黑，面料一定要有织出来的暗花。',
        hard: [...patternedGown, eq('scene', 'formal_evening', '晚宴')], unknowns: [],
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-gown-column', 'fab-song-obsidian-gold'], source: 'decisionCatalog.ts · SFG-FB-101 为暗纹提花，可配 SFG-PT-202，数量覆盖四件。fabrics.ts · SFG-FB-101 墨黛鎏金黑，适合晚宴。' },
      },
      {
        id: 't2', text: '舞监刚补充了控光要求，确认加一条，布面必须哑光。',
        hard: [...patternedGown, eq('scene', 'formal_evening', '晚宴'), eq('luster', 'low', '必须哑光', 't2')], unknowns: [],
        revision: { decision: 'apply', requestedFields: ['luster'], changedFields: ['luster'], invariantFields: ['category', 'quantity', 'motif', 'color', 'scene'] },
        catalog: {
          outcome: 'no-match', source: 'decisionCatalog.ts · 能配 SFG-PT-202 的黑色暗花 SFG-FB-101 为高光泽。',
          blockers: [{ assetId: 'fab-song-obsidian-gold', field: 'luster', kind: 'known-violation', source: 'decisionCatalog.ts · SFG-FB-101 的 luster 为 high。' }],
        },
      },
      {
        id: 't3', text: '舞台灯换了，把哑光要求改成亮面，确认这样定。',
        hard: [...patternedGown, eq('scene', 'formal_evening', '晚宴'), eq('luster', 'high', '改成亮面', 't3')], unknowns: [],
        revision: { decision: 'apply', requestedFields: ['luster'], changedFields: ['luster'], invariantFields: ['category', 'quantity', 'motif', 'color', 'scene'] },
        catalog: { outcome: 'eligible', requiredIds: ['pat-haipai-gown-column', 'fab-song-obsidian-gold'], source: 'decisionCatalog.ts · SFG-PT-202 与高光泽暗纹 SFG-FB-101 可配。fabrics.ts · SFG-FB-101 可用于晚宴。' },
      },
    ],
  },
  {
    id: 'H2-R06', group: 'multi-round-revisions', turns: [
      {
        id: 't1', text: '会议接待组员工团订十四套西服，风格定为现代商务。面料必须是羊毛，只能专业干洗，色号等品牌同事给。',
        hard: [...woolSuitBase, eq('fabric', 'wool', '必须是羊毛'), dryClean], unknowns: woolSuitUnknowns,
        catalog: { outcome: 'eligible', requiredIds: ['pat-minimal-unstructured-blazer', 'fab-bund-navy-wool130'], source: 'decisionCatalog.ts · 现代商务 SFG-PT-301 支持 8–200 套，兼容可专业干洗的羊毛 SFG-FB-201。' },
      },
      {
        id: 't2', text: '为控制预算，确认把料子换成涤纶。原来的专业干洗暂时照旧。',
        hard: [...woolSuitBase, eq('fabric', 'polyester', '换成涤纶', 't2'), dryClean], unknowns: woolSuitUnknowns,
        revision: { decision: 'apply', requestedFields: ['fabric'], changedFields: ['fabric'], invariantFields: ['businessType', 'category', 'quantity', 'style', 'care', 'color'] },
        catalog: {
          outcome: 'no-match', source: 'decisionCatalog.ts · 可搭配 SFG-PT-301 的涤纶模拟资产 SFG-FB-211 记录的洗护方式为机洗。',
          blockers: [{ assetId: 'fab-demo-navy-washable-twill', field: 'care', kind: 'known-violation', source: 'decisionCatalog.ts · SFG-FB-211 的 care 为 machine_wash。' }],
        },
      },
      {
        id: 't3', text: '后勤同意把专业干洗改成可机洗，确认这个洗护变更。',
        hard: [...woolSuitBase, eq('fabric', 'polyester', '换成涤纶', 't2'), eq('care', 'machine_wash', '改成可机洗', 't3')], unknowns: woolSuitUnknowns,
        revision: { decision: 'apply', requestedFields: ['care'], changedFields: ['care'], invariantFields: ['businessType', 'category', 'quantity', 'style', 'fabric', 'color'] },
        catalog: { outcome: 'eligible', requiredIds: ['pat-minimal-unstructured-blazer', 'fab-demo-navy-washable-twill'], source: 'decisionCatalog.ts · 可机洗涤纶 SFG-FB-211 与 SFG-PT-301 兼容，二者涵盖十四套。' },
      },
    ],
  },
];
