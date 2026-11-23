import type { AssetSource } from '../types/decisions';
import { HISTORICAL_CASES } from './cases';
import { CRAFTS } from './crafts';
import { FABRICS } from './fabrics';
import { PATTERNS } from './patterns';

export const ASSET_SOURCE_LABELS: Record<AssetSource['kind'], string> = {
  official_case: '官方案例参考',
  public_reference: '公开资料参考',
  team_simulation: '团队合成属性',
};

type CareMethod = 'machine_wash' | 'dry_clean' | 'hand_wash';
type BatchRange = readonly [min: number, max: number];

interface PatternProfile {
  category: 'jacket' | 'two_piece' | 'suit' | 'dress';
  patternStructure?: 'h_line' | 'two_piece';
  collars: readonly ('cross_open' | 'stand' | 'lapel' | 'diagonal')[];
  lengthRatio: 'mid_hip' | 'ankle' | 'floor' | 'tailored_suit';
  easeAllowance?: 'arm_mobility' | 'standard';
  style: 'new_chinese' | 'traditional_uniform' | 'modern';
  quantity: BatchRange;
  craftPackages: readonly (readonly string[])[];
  officialCase?: number;
}

interface FabricProfile {
  fabric: 'silk' | 'blend' | 'wool' | 'polyester' | 'acetate' | 'velvet';
  motif: 'subtle_jacquard' | 'plain';
  luster: 'low' | 'medium' | 'high';
  care?: CareMethod;
  wrinkleResistance?: boolean;
  quantity: BatchRange;
  compatiblePatternIds: readonly string[];
  officialCase?: number;
  publicReferences?: readonly AssetSource[];
}

interface CraftProfile {
  care?: CareMethod;
  compatiblePatternIds: readonly string[];
  officialCase?: number;
}

const crossJacket = 'pat-official-cross-collar-silk';
const lowCollarJacket = 'pat-official-h-low-collar';
const shawlJacket = 'pat-official-shawl-plum';
const stageSet = 'pat-official-stage-twopiece';
const droppedJacket = 'pat-official-xiangyun-dropped';
const uniform = 'pat-haipai-suit-ensemble';
const gown = 'pat-haipai-gown-column';
const softSuit = 'pat-minimal-unstructured-blazer';

const patterns: Record<string, PatternProfile | undefined> = {
  [crossJacket]: {
    category: 'jacket', patternStructure: 'h_line', collars: ['cross_open'], lengthRatio: 'mid_hip',
    easeAllowance: 'arm_mobility', style: 'new_chinese', quantity: [1, 8], officialCase: 6,
    craftPackages: [['crf-cross-collar-no-button'], ['crf-demo-washable-satin-seams'], []],
  },
  [lowCollarJacket]: {
    category: 'jacket', patternStructure: 'h_line', collars: ['stand'], lengthRatio: 'mid_hip',
    style: 'new_chinese', quantity: [1, 8], officialCase: 1,
    craftPackages: [['crf-low-collar-ergo', 'crf-hidden-mandarin-placket'], ['crf-low-collar-ergo'], []],
  },
  [shawlJacket]: {
    category: 'jacket', patternStructure: 'h_line', collars: ['lapel'], lengthRatio: 'mid_hip',
    style: 'new_chinese', quantity: [1, 8], officialCase: 2,
    craftPackages: [['crf-plum-starlight-motif'], []],
  },
  [stageSet]: {
    category: 'two_piece', patternStructure: 'two_piece', collars: ['diagonal'], lengthRatio: 'ankle',
    easeAllowance: 'arm_mobility', style: 'new_chinese', quantity: [1, 16], officialCase: 3,
    craftPackages: [['crf-contrast-piping-cuff', 'crf-haipai-pipa-button'], ['crf-contrast-piping-cuff'], ['crf-haipai-pipa-button'], []],
  },
  [droppedJacket]: {
    category: 'jacket', patternStructure: 'h_line', collars: ['stand'], lengthRatio: 'mid_hip',
    style: 'new_chinese', quantity: [1, 8], officialCase: 4,
    craftPackages: [['crf-low-collar-ergo', 'crf-hidden-mandarin-placket'], ['crf-low-collar-ergo'], []],
  },
  [uniform]: {
    category: 'suit', patternStructure: 'two_piece', collars: ['stand'], lengthRatio: 'tailored_suit',
    easeAllowance: 'arm_mobility', style: 'traditional_uniform', quantity: [20, 200],
    craftPackages: [['crf-full-canvas-guiba', 'crf-hidden-mandarin-placket', 'crf-milanese-cuff-label'], ['crf-hidden-mandarin-placket'], ['crf-full-canvas-guiba'], ['crf-milanese-cuff-label'], []],
  },
  [gown]: {
    category: 'dress', collars: ['stand', 'diagonal'], lengthRatio: 'floor', easeAllowance: 'standard',
    style: 'new_chinese', quantity: [1, 8],
    craftPackages: [['crf-haipai-pipa-button', 'crf-suzhou-magnolia-embroidery'], ['crf-haipai-pipa-button'], ['crf-suzhou-magnolia-embroidery'], []],
  },
  [softSuit]: {
    category: 'suit', patternStructure: 'two_piece', collars: ['lapel'], lengthRatio: 'tailored_suit',
    easeAllowance: 'arm_mobility', style: 'modern', quantity: [8, 200],
    craftPackages: [['crf-demo-washable-soft-seams'], ['crf-demo-washable-satin-seams'], ['crf-milanese-cuff-label'], []],
  },
};

const washReference: AssetSource = {
  kind: 'public_reference',
  reference: 'GINETEX 洗护标识 https://www.ginetex.net/article/GB/care-symbols',
  simulated: true,
};

const satinReference: AssetSource = {
  kind: 'public_reference',
  reference: 'CottonWorks 缎纹与织物表面光泽 https://cottonworks.com/encyclopedia-item/satin/',
  simulated: true,
};

const fabrics: Record<string, FabricProfile | undefined> = {
  'fab-official-silk-jacquard-subtle': {
    fabric: 'silk', motif: 'subtle_jacquard', luster: 'medium', care: 'dry_clean',
    quantity: [1, 8], compatiblePatternIds: [crossJacket, shawlJacket], officialCase: 6,
  },
  'fab-official-acetate-jacquard': {
    fabric: 'acetate', motif: 'subtle_jacquard', luster: 'medium', care: 'dry_clean',
    quantity: [1, 80], compatiblePatternIds: [lowCollarJacket, crossJacket, shawlJacket, droppedJacket, uniform], officialCase: 1,
  },
  'fab-official-plum-song': {
    fabric: 'blend', motif: 'subtle_jacquard', luster: 'medium', care: 'dry_clean',
    quantity: [1, 8], compatiblePatternIds: [shawlJacket, crossJacket, gown], officialCase: 2,
  },
  'fab-official-ivory-rose-stage': {
    fabric: 'silk', motif: 'subtle_jacquard', luster: 'high',
    quantity: [1, 16], compatiblePatternIds: [stageSet], officialCase: 3,
  },
  'fab-official-xiangyun-matte': {
    fabric: 'silk', motif: 'plain', luster: 'low', wrinkleResistance: false,
    quantity: [1, 8], compatiblePatternIds: [droppedJacket, lowCollarJacket, crossJacket], officialCase: 4,
  },
  'fab-song-obsidian-gold': {
    fabric: 'blend', motif: 'subtle_jacquard', luster: 'high', care: 'dry_clean',
    quantity: [1, 8], compatiblePatternIds: [gown, shawlJacket],
  },
  'fab-xiangyun-crimson-velvet': {
    fabric: 'velvet', motif: 'subtle_jacquard', luster: 'medium',
    quantity: [1, 8], compatiblePatternIds: [gown],
  },
  'fab-bund-navy-wool130': {
    fabric: 'wool', motif: 'plain', luster: 'medium', care: 'dry_clean', wrinkleResistance: true,
    quantity: [1, 200], compatiblePatternIds: [uniform, softSuit], publicReferences: [washReference],
  },
  'fab-demo-navy-washable-twill': {
    fabric: 'polyester', motif: 'plain', luster: 'low', care: 'machine_wash', wrinkleResistance: true,
    quantity: [8, 160], compatiblePatternIds: [softSuit], publicReferences: [washReference],
  },
  'fab-demo-navy-lustrous-blend': {
    fabric: 'blend', motif: 'plain', luster: 'high', care: 'machine_wash', wrinkleResistance: true,
    quantity: [8, 120], compatiblePatternIds: [softSuit], publicReferences: [satinReference, washReference],
  },
  'fab-demo-navy-silk-satin': {
    fabric: 'silk', motif: 'plain', luster: 'high', wrinkleResistance: true,
    quantity: [1, 80], compatiblePatternIds: [softSuit, crossJacket], publicReferences: [satinReference, washReference],
  },
};

const crafts: Record<string, CraftProfile | undefined> = {
  'crf-cross-collar-no-button': { compatiblePatternIds: [crossJacket], officialCase: 6 },
  'crf-low-collar-ergo': { compatiblePatternIds: [lowCollarJacket, droppedJacket], officialCase: 1 },
  'crf-plum-starlight-motif': { care: 'dry_clean', compatiblePatternIds: [shawlJacket], officialCase: 2 },
  'crf-contrast-piping-cuff': { compatiblePatternIds: [stageSet], officialCase: 3 },
  'crf-haipai-pipa-button': { compatiblePatternIds: [stageSet, gown] },
  'crf-suzhou-magnolia-embroidery': { care: 'dry_clean', compatiblePatternIds: [gown] },
  'crf-full-canvas-guiba': { care: 'dry_clean', compatiblePatternIds: [uniform] },
  'crf-hidden-mandarin-placket': { compatiblePatternIds: [lowCollarJacket, droppedJacket, uniform] },
  'crf-milanese-cuff-label': { care: 'dry_clean', compatiblePatternIds: [uniform, softSuit] },
  'crf-demo-washable-soft-seams': { care: 'machine_wash', compatiblePatternIds: [softSuit] },
  'crf-demo-washable-satin-seams': { care: 'machine_wash', compatiblePatternIds: [softSuit, crossJacket] },
};

const historicalOfficialCases: Record<string, number | undefined> = {
  'case-hist-001': 1,
  'case-hist-002': 2,
  'case-hist-003': 3,
  'case-hist-006': 6,
};

export const SIMULATED_CARE_LABELS: Record<CareMethod, string> = {
  machine_wash: '可机洗',
  dry_clean: '专业干洗',
  hand_wash: '手洗',
};

export function simulationSource(kind: 'pattern' | 'fabric' | 'craft' | 'case', code: string): AssetSource {
  return { kind: 'team_simulation', reference: `团队模拟目录 src/data/decisionCatalog.ts · ${kind} · ${code}`, simulated: true };
}

function catalogSource(kind: 'pattern' | 'fabric' | 'craft' | 'case', code: string, officialCase?: number): AssetSource {
  if (officialCase === undefined) return simulationSource(kind, code);
  return {
    kind: 'official_case',
    reference: `上海服装集团命题案例 ${officialCase} · 静态复原记录 · src/data/presetDemos.ts#official-case-${officialCase}`,
    simulated: true,
  };
}

export const DECISION_CATALOG = {
  patterns: PATTERNS.flatMap((asset) => {
    const profile = patterns[asset.id];
    return profile ? [{ asset, profile, source: catalogSource('pattern', asset.code, profile.officialCase) }] : [];
  }),
  fabrics: FABRICS.flatMap((asset) => {
    const profile = fabrics[asset.id];
    return profile ? [{ asset, profile, source: catalogSource('fabric', asset.code, profile.officialCase) }] : [];
  }),
  crafts: CRAFTS.flatMap((asset) => {
    const profile = crafts[asset.id];
    return profile ? [{ asset, profile, source: catalogSource('craft', asset.code, profile.officialCase) }] : [];
  }),
  cases: HISTORICAL_CASES.map((asset) => ({
    asset,
    source: catalogSource('case', asset.code, historicalOfficialCases[asset.id]),
  })),
};
