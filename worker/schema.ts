export const REQUIREMENT_SCHEMA_VERSION = 'sartoria_requirement_v1' as const;

export const OFFICIAL_SPEC_KEYS = [
  'category',
  'patternStructure',
  'collar',
  'fabric',
  'color',
  'motif',
  'lengthRatio',
  'easeAllowance',
] as const;

export type OfficialSpecKey = (typeof OFFICIAL_SPEC_KEYS)[number];
export type StructuredInfoStatus = 'explicit' | 'suggested' | 'unknown';
export type StructuredConstraintKind = 'hard' | 'soft' | 'excluded' | 'pending';

export interface StructuredSpecField {
  key: OfficialSpecKey;
  label: string;
  value: string;
  infoStatus: StructuredInfoStatus;
  constraintKind: StructuredConstraintKind;
  sourceQuote: string | null;
  rationale: string;
  ergonomicCue: string | null;
}

export interface StructuredRequirementV1 {
  schemaVersion: typeof REQUIREMENT_SCHEMA_VERSION;
  aestheticArchetype: string;
  emotionTags: string[];
  colorSpecifiedByUser: boolean;
  bodyErgonomics: string[];
  followUpQuestions: string[];
  officialSpecs: StructuredSpecField[];
  threeBuckets: {
    userExplicit: string[];
    systemSuggested: string[];
    needsHumanVerification: string[];
  };
}

/**
 * OpenAI Responses API Strict JSON Schema (text.format.type = "json_schema", strict = true).
 * Aligned with YOU-241 & YOU-238 contract: explicit/suggested/unknown separation + verbatim sourceQuote.
 */
export const SARTORIA_REQUIREMENT_V1_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion',
    'aestheticArchetype',
    'emotionTags',
    'colorSpecifiedByUser',
    'bodyErgonomics',
    'followUpQuestions',
    'officialSpecs',
    'threeBuckets',
  ],
  properties: {
    schemaVersion: {
      type: 'string',
      enum: [REQUIREMENT_SCHEMA_VERSION],
    },
    aestheticArchetype: {
      type: 'string',
    },
    emotionTags: {
      type: 'array',
      items: { type: 'string' },
    },
    colorSpecifiedByUser: {
      type: 'boolean',
    },
    bodyErgonomics: {
      type: 'array',
      items: { type: 'string' },
    },
    followUpQuestions: {
      type: 'array',
      items: { type: 'string' },
    },
    officialSpecs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'key',
          'label',
          'value',
          'infoStatus',
          'constraintKind',
          'sourceQuote',
          'rationale',
          'ergonomicCue',
        ],
        properties: {
          key: {
            type: 'string',
            enum: [...OFFICIAL_SPEC_KEYS],
          },
          label: { type: 'string' },
          value: { type: 'string' },
          infoStatus: {
            type: 'string',
            enum: ['explicit', 'suggested', 'unknown'],
          },
          constraintKind: {
            type: 'string',
            enum: ['hard', 'soft', 'excluded', 'pending'],
          },
          sourceQuote: {
            type: ['string', 'null'],
          },
          rationale: { type: 'string' },
          ergonomicCue: {
            type: ['string', 'null'],
          },
        },
      },
    },
    threeBuckets: {
      type: 'object',
      additionalProperties: false,
      required: ['userExplicit', 'systemSuggested', 'needsHumanVerification'],
      properties: {
        userExplicit: {
          type: 'array',
          items: { type: 'string' },
        },
        systemSuggested: {
          type: 'array',
          items: { type: 'string' },
        },
        needsHumanVerification: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
} as const;

export const SARTORIA_SYSTEM_PROMPT = [
  '你是上海服装集团 Sartoria AI 海派高定与团体职业服企划辅助专家。',
  '你的唯一职责是将客户口语化需求转化为严格符合 `sartoria_requirement_v1` JSON Schema 的结构化企划参数，供下游确定性规则引擎匹配静态模拟定制资产。',
  '',
  '【必须严格遵守的业务红线与校验规则】',
  '1. officialSpecs 必须且仅包含以下 8 个字段（按顺序，不可重复、不可缺失）：category(品类)、patternStructure(版型结构)、collar(领型)、fabric(面料)、color(色彩)、motif(装饰纹样)、lengthRatio(长度比例)、easeAllowance(松弛余量)。',
  '2. 信息状态 infoStatus 只能为 explicit（客户原话明确提到）、suggested（系统结合体态/场合给出的专业建议）、unknown（客户未说明或必须由线下人工核定）；严禁伪造“已人工确认”。',
  '3. 原文依据溯源：仅当 infoStatus 为 explicit 时填写 sourceQuote，且 sourceQuote 必须是客户原始需求文本中的逐字连续子串；若是 suggested 或 unknown，sourceQuote 必须为 null，并在 rationale 中写简短专业依据。',
  '4. 严禁代客定色：若客户原文未明确提到具体颜色或色系倾向，colorSpecifiedByUser 必须为 false，color 字段的 infoStatus 必须为 unknown，value 写明“无特殊需求（客户未指定颜色，系统不代客决定，须由顾问携实物色卡线下核定）”。',
  '5. 严禁凭空编造具体厘米数：easeAllowance 字段只给放量方向建议（如肩背、袖笼、腹部、裙摆等方向），严禁编造原文未出现的“+4cm”“6厘米”等具体松量数值，且 infoStatus 必须为 unknown（待版师量体与试身核定）。',
  '6. 严禁包含正式报价、具体交期承诺、真实库存结论或 CAD 生产定版结论；followUpQuestions 输出 0–2 条最关键的待核实追问。',
  '7. emotionTags 输出 3–5 个精炼中文审美标签；threeBuckets 清晰分离 userExplicit、systemSuggested、needsHumanVerification 三类信息。',
].join('\n');

const SPEC_DEFAULT_LABELS: Record<OfficialSpecKey, string> = {
  category: '品类',
  patternStructure: '版型结构',
  collar: '领型',
  fabric: '面料',
  color: '色彩',
  motif: '装饰纹样',
  lengthRatio: '长度比例',
  easeAllowance: '松弛余量',
};

function normalizeForQuoteMatch(text: string): string {
  return text.replace(/[\s，,。.、；;：:！!？?「」『』“”"'（）()]+/g, '').toLowerCase();
}

function quoteExistsInNarrative(quote: string, rawNarrative: string): boolean {
  const cleanQuote = quote.trim();
  if (!cleanQuote) return false;
  if (rawNarrative.includes(cleanQuote)) return true;
  const normQuote = normalizeForQuoteMatch(cleanQuote);
  const normNarrative = normalizeForQuoteMatch(rawNarrative);
  return normQuote.length >= 2 && normNarrative.includes(normQuote);
}

const VALID_INFO_STATUS = new Set<string>(['explicit', 'suggested', 'unknown']);
const VALID_CONSTRAINT_KIND = new Set<string>(['hard', 'soft', 'excluded', 'pending']);

export type ValidationOutcome =
  | {
      ok: true;
      data: StructuredRequirementV1;
      warnings: string[];
    }
  | {
      ok: false;
      reason: string;
    };

/**
 * Structural + Semantic validation of GPT-6.2 Astra Structured Output (YOU-241 / YOU-246).
 * Verifies exact schema shape, verbatim source quote grounding, unspecified-color guardrail,
 * and anti-fabricated-centimeters guardrail.
 */
export function validateStructuredRequirement(
  rawParsed: unknown,
  rawNarrative: string
): ValidationOutcome {
  if (!rawParsed || typeof rawParsed !== 'object') {
    return { ok: false, reason: '模型输出不是合法 JSON 对象' };
  }

  const obj = rawParsed as Record<string, unknown>;
  if (obj.schemaVersion !== REQUIREMENT_SCHEMA_VERSION) {
    return { ok: false, reason: 'schemaVersion 不匹配 sartoria_requirement_v1' };
  }

  if (typeof obj.aestheticArchetype !== 'string' || !obj.aestheticArchetype.trim()) {
    return { ok: false, reason: '缺少 aestheticArchetype' };
  }

  if (typeof obj.colorSpecifiedByUser !== 'boolean') {
    return { ok: false, reason: '缺少 colorSpecifiedByUser 布尔标记' };
  }

  if (!Array.isArray(obj.officialSpecs) || obj.officialSpecs.length !== 8) {
    return { ok: false, reason: 'officialSpecs 必须包含完整的 8 项专业字段' };
  }

  const warnings: string[] = [];
  const seenKeys = new Set<OfficialSpecKey>();
  const validatedSpecs: StructuredSpecField[] = [];
  const rawHasCm = /\d+(?:\.\d+)?\s*(?:cm|厘米)/i.test(rawNarrative);

  for (const item of obj.officialSpecs) {
    if (!item || typeof item !== 'object') {
      return { ok: false, reason: 'officialSpecs 存在非法条目' };
    }
    const spec = item as Record<string, unknown>;
    const key = spec.key as OfficialSpecKey;
    if (!OFFICIAL_SPEC_KEYS.includes(key) || seenKeys.has(key)) {
      return { ok: false, reason: `officialSpecs 字段键非法或重复: ${String(spec.key)}` };
    }
    seenKeys.add(key);

    if (typeof spec.value !== 'string' || !spec.value.trim()) {
      return { ok: false, reason: `字段 ${key} 缺少 value` };
    }
    if (typeof spec.infoStatus !== 'string' || !VALID_INFO_STATUS.has(spec.infoStatus)) {
      return { ok: false, reason: `字段 ${key} infoStatus 非法` };
    }
    if (
      typeof spec.constraintKind !== 'string' ||
      !VALID_CONSTRAINT_KIND.has(spec.constraintKind)
    ) {
      return { ok: false, reason: `字段 ${key} constraintKind 非法` };
    }

    let infoStatus = spec.infoStatus as StructuredInfoStatus;
    let constraintKind = spec.constraintKind as StructuredConstraintKind;
    let value = spec.value.trim();
    let sourceQuote =
      typeof spec.sourceQuote === 'string' && spec.sourceQuote.trim()
        ? spec.sourceQuote.trim()
        : null;
    const rationale =
      typeof spec.rationale === 'string' ? spec.rationale.trim() : '';
    const ergonomicCue =
      typeof spec.ergonomicCue === 'string' && spec.ergonomicCue.trim()
        ? spec.ergonomicCue.trim()
        : null;

    // Semantic check 1: verbatim quote grounding for explicit fields
    if (infoStatus === 'explicit') {
      if (!sourceQuote || !quoteExistsInNarrative(sourceQuote, rawNarrative)) {
        warnings.push(`字段 ${key} 原文摘录未命中原话，已降级为系统建议`);
        infoStatus = 'suggested';
        if (constraintKind === 'hard') constraintKind = 'soft';
        sourceQuote = null;
      }
    } else {
      // Never retain fabricated quotes on suggested/unknown fields
      sourceQuote = null;
    }

    // Semantic check 2: enforce unspecified color guardrail
    if (key === 'color' && !obj.colorSpecifiedByUser) {
      infoStatus = 'unknown';
      constraintKind = 'pending';
      sourceQuote = null;
      if (!value.includes('不代客') && !value.includes('待') && !value.includes('未指定')) {
        value = '无特殊需求（客户未指定颜色，系统不代客决定，须由顾问携实物色卡线下核定）';
        warnings.push('客户未指定颜色，已强制保留待人工核色边界');
      }
    }

    // Semantic check 3: never allow fabricated specific ease cm numbers
    if (key === 'easeAllowance') {
      infoStatus = 'unknown';
      constraintKind = 'pending';
      if (!rawHasCm && /\d+(?:\.\d+)?\s*(?:cm|厘米)/i.test(value)) {
        value = value.replace(/\d+(?:\.\d+)?\s*(?:cm|厘米)/gi, '适度余量');
        if (!value.includes('版师') && !value.includes('量体')) {
          value = `${value}（具体松量数值须由版师量体与试身核定，AI 不凭空报数）`;
        }
        warnings.push('已拦截并清除模型生成的具体松量厘米数');
      }
    }

    validatedSpecs.push({
      key,
      label:
        typeof spec.label === 'string' && spec.label.trim()
          ? spec.label.trim()
          : SPEC_DEFAULT_LABELS[key],
      value,
      infoStatus,
      constraintKind,
      sourceQuote,
      rationale,
      ergonomicCue,
    });
  }

  // Order canonically
  const orderedSpecs = OFFICIAL_SPEC_KEYS.map(
    (k) => validatedSpecs.find((s) => s.key === k)!
  );

  const rawBuckets = obj.threeBuckets as Record<string, unknown> | undefined;
  if (
    !rawBuckets ||
    !Array.isArray(rawBuckets.userExplicit) ||
    !Array.isArray(rawBuckets.systemSuggested) ||
    !Array.isArray(rawBuckets.needsHumanVerification)
  ) {
    return { ok: false, reason: '缺少完整的 threeBuckets 三分栏信息' };
  }

  const cleanStrArray = (arr: unknown, max: number): string[] =>
    Array.isArray(arr)
      ? arr
          .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          .map((x) => x.trim())
          .slice(0, max)
      : [];

  const emotionTags = cleanStrArray(obj.emotionTags, 5);
  const bodyErgonomics = cleanStrArray(obj.bodyErgonomics, 6);
  const followUpQuestions = cleanStrArray(obj.followUpQuestions, 2);
  const userExplicit = cleanStrArray(rawBuckets.userExplicit, 8);
  const systemSuggested = cleanStrArray(rawBuckets.systemSuggested, 8);
  const needsHumanVerification = cleanStrArray(rawBuckets.needsHumanVerification, 8);

  if (emotionTags.length === 0) {
    return { ok: false, reason: 'emotionTags 不能为空' };
  }

  if (
    !obj.colorSpecifiedByUser &&
    !needsHumanVerification.some((line) => line.includes('色'))
  ) {
    needsHumanVerification.unshift(
      '色彩确认：客户未指定颜色，须由顾问携实物色卡线下确认，AI 不代客定色'
    );
  }
  if (!needsHumanVerification.some((line) => line.includes('量体') || line.includes('松量'))) {
    needsHumanVerification.push('精确净体尺寸与松量厘米数须由版师实测与试穿核定');
  }

  return {
    ok: true,
    warnings,
    data: {
      schemaVersion: REQUIREMENT_SCHEMA_VERSION,
      aestheticArchetype: obj.aestheticArchetype.trim(),
      emotionTags,
      colorSpecifiedByUser: obj.colorSpecifiedByUser,
      bodyErgonomics,
      followUpQuestions,
      officialSpecs: orderedSpecs,
      threeBuckets: {
        userExplicit,
        systemSuggested,
        needsHumanVerification,
      },
    },
  };
}
