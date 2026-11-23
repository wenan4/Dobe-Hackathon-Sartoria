import { PRESET_DEMO_CASES } from '../data/presetDemos';
import { SCENES } from '../data/scenes';
import type {
  DeconstructedRequirement,
  DimensionItem,
  LlmSettings,
  OfficialSpecItem,
  RequirementInput,
} from '../types/sartoria';

const SEASON_LABELS: Record<RequirementInput['season'], string> = {
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
  winter: '冬季',
  all_season: '四季通用',
};

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

export function buildOfficialEightSpecs(input: RequirementInput): {
  officialSpecs: OfficialSpecItem[];
  bodyErgonomics: string[];
} {
  // Exact official translation when matching an unmodified official preset
  if (input.presetDemoId) {
    const preset = PRESET_DEMO_CASES.find((p) => p.id === input.presetDemoId);
    if (preset?.officialSpecOverride && preset.input.rawNarrative === input.rawNarrative) {
      const cues = preset.officialSpecOverride
        .map((s) => s.ergonomicCue)
        .filter((v): v is string => Boolean(v));
      return { officialSpecs: preset.officialSpecOverride, bodyErgonomics: cues };
    }
  }

  const text = `${input.projectName} ${input.rawNarrative}`.toLowerCase();
  const isUniform = input.businessType === 'corporate_uniform';
  const isTwoPieceStage = hasAny(text, ['演出', '演奏', '两件', '舞台', '连衣裙和一件外套', '坐奏']);
  const isGown = !isTwoPieceStage && hasAny(text, ['晚礼服', '礼服', '旗袍', '晚宴']);

  const shortNeck = hasAny(text, ['脖子短', '领子不能太高', '领子不要太高', '显脖子长', '显得脖子长']);
  const slimNeck = hasAny(text, ['脖子细', '领子窄', '窄一点', '青果']);
  const hasBelly = hasAny(text, ['肚腩', '小肚子', '腹部', '藏肉', '微胖']);
  const slopedShoulder = hasAny(text, ['溜肩', '窄肩']);
  const needLayering = hasAny(text, ['内搭', '叠穿', '里面穿']);
  const needArmLift = hasAny(text, ['抬手', '演奏', '坐奏', '活动方便', '舒展']);

  const bodyErgonomics: string[] = [];
  if (shortNeck) bodyErgonomics.push('短颈修饰 → 领高严格控于 3cm 内');
  if (slimNeck) bodyErgonomics.push('显颈部纤细 → 窄青果西装领拉长 V 区');
  if (hasBelly) bodyErgonomics.push('腹部藏肉 → H 型无收腰 + 前片腹部充足松量');
  if (slopedShoulder) bodyErgonomics.push('溜肩友好 → 自然落肩柔和肩斜线');
  if (needLayering) bodyErgonomics.push('预留内搭层叠空间 → 围度宽松舒展');
  if (needArmLift) bodyErgonomics.push('动作工学 → 宽袖笼抬臂放量 + 坐姿大摆舒展');

  // 1. 品类
  const category = isTwoPieceStage
    ? '两件式套装（短外套 + 无袖连衣裙）'
    : isUniform
      ? '团体职业套装（男女同源正装上衣 + 西裤/套裙）'
      : isGown
        ? '高端海派定制长礼服'
        : '中式定制外套';

  // 2. 版型结构
  let patternStructure = 'H 型直身结构，无收腰；肩型采用微落平肩，线条简约利落';
  if (isTwoPieceStage) {
    patternStructure =
      '外套：短款微 H 型，肩型自然平肩不压肩；连衣裙：收腰大 A 摆结构，腰腹保留松量，裙摆舒展';
  } else if (isUniform) {
    patternStructure = '建筑感微收腰正装廓形（男女套系），轻薄马尾衬立体肩型，久穿不塌';
  } else if (isGown) {
    patternStructure = '修身直筒微鱼尾廓形（H-X 比例拉长），立体胸腰省道收拢';
  } else if (slopedShoulder) {
    patternStructure = 'H 型直身结构，无收腰；肩型采用自然落肩，线条柔和松弛';
  } else if (slimNeck || needLayering) {
    patternStructure = 'H 型直身结构，微微收腰；肩型采用微落平肩，线条简约利落';
  }

  // 3. 领型
  let collar = '低立领（领高控制在 3cm 以内），领线条圆润';
  if (isTwoPieceStage) {
    collar = '外套：中式斜襟领，线条柔和；连衣裙：简约小圆领，贴合颈部不卡肩';
  } else if (slimNeck) {
    collar = '青果西装领，领型线条柔和舒展，视觉拉长并显颈部纤细';
  } else if (isUniform) {
    collar = '男款暗门襟海派小立领 / 驳领；女款改良一字弧立领';
  } else if (isGown && !shortNeck) {
    collar = '3.2cm 改良海派立体低立领，贴合颈线';
  }

  // 4. 面料
  let fabric = '优选垂感适中、手感柔和的醋酸或薄款提花锦，挺而不硬，穿着舒适不易贴身';
  if (isTwoPieceStage) {
    fabric = '外套：暗纹宋锦 + 真丝里布，穿着舒适；连衣裙：高垂感亮面缎面，顺滑有光泽';
  } else if (isUniform) {
    fabric = '澳洲 Super 130s 精纺羊毛 / 羊毛桑蚕丝混纺（245–260g/m²），抗皱回弹挺括';
  } else if (hasAny(text, ['香云纱']) || (hasAny(text, ['低调', '内敛']) && hasAny(text, ['溜肩', '简约']))) {
    fabric = '香云纱面料，自带自然肌理，哑光温润，挺而不硬，垂感柔和';
  } else if (hasAny(text, ['梅花', '宋锦', '暗纹'])) {
    fabric = '优选垂感适中、手感柔和的提花宋锦面料，垂感顺滑，自带柔和光泽，挺而不硬';
  } else if (hasAny(text, ['丝绒', '酒红', '绯红'])) {
    fabric = '非遗香云纱真丝丝绒（265g/m²），深邃微光垂坠显贵';
  }

  // 5. 色彩
  let color = '无特殊需求';
  if (isTwoPieceStage || hasAny(text, ['明快', '活力', '亮粉', '米白'])) {
    color = '米白底色外套，搭配亮粉色滚边与撞色袖口；连衣裙同亮粉色';
  } else if (hasAny(text, ['藏青', '暖灰', '松墨绿'])) {
    color = '主推外滩午夜藏青，同步备选石库门建筑暖灰 / 申城松墨绿';
  } else if (hasAny(text, ['墨黑', '黑金', '深色'])) {
    color = '深邃墨黛黑底配低饱和古金暗纹';
  } else if (hasAny(text, ['月白', '浅色', '清冷'])) {
    color = '月白烟青浅色系';
  }

  // 6. 装饰纹样
  let motif = '无特殊需求';
  if (hasAny(text, ['梅花', '星光'])) {
    motif = '衣身植物梅花暗花纹样，点缀细碎点状星光装饰，含蓄富有层次';
  } else if (hasAny(text, ['玉兰', '刺绣', '盘扣'])) {
    motif = '领口斜襟手工琵琶盘扣 + 局部劈丝白玉兰暗纹苏绣';
  } else if (isUniform) {
    motif = '袖口末粒企业定制色真丝锁眼 + 内里专属暗纹织标';
  }

  // 7. 长度比例
  const lengthRatio = isTwoPieceStage
    ? '外套衣长至臀中位置；连衣裙裙长至脚踝'
    : isGown
      ? '曳地晚宴长款比例，膝下 8cm 优雅侧开衩'
      : '衣长至臀中位置';

  // 8. 松弛余量
  let easeAllowance = '前片腹部区域预留充足松量，整体围度宽松，穿着无束缚';
  if (isTwoPieceStage) {
    easeAllowance =
      '外套袖管放量充足，抬臂演奏无束缚；连衣裙腰部适度收束，裙摆放量大，坐奏舒展不紧绷';
  } else if (needLayering && !hasBelly) {
    easeAllowance = '整体围度宽松，预留内搭层叠空间，活动自在无紧绷感';
  } else if (isUniform) {
    easeAllowance = '按 S–4XL 团单归码体系，针对久坐与高频礼宾接待预留后背及袖笼活动余量';
  } else if (isGown && !hasBelly) {
    easeAllowance = '腰省立体贴合，侧开衩与下摆预留从容步幅余量';
  }

  const officialSpecs: OfficialSpecItem[] = [
    { key: 'category', label: '品类', value: category },
    {
      key: 'patternStructure',
      label: '版型结构',
      value: patternStructure,
      ergonomicCue: slopedShoulder
        ? '修饰溜肩'
        : hasBelly
          ? '修饰肚腩'
          : isTwoPieceStage
            ? '兼顾坐奏'
            : undefined,
    },
    {
      key: 'collar',
      label: '领型',
      value: collar,
      ergonomicCue: shortNeck ? '对应「脖子短」' : slimNeck ? '窄领显脖细' : undefined,
    },
    { key: 'fabric', label: '面料', value: fabric },
    {
      key: 'color',
      label: '色彩',
      value: color,
      ergonomicCue: isTwoPieceStage ? '明快上镜' : undefined,
    },
    {
      key: 'motif',
      label: '装饰纹样',
      value: motif,
      ergonomicCue: hasAny(text, ['梅花']) ? '对应「梅花暗纹」' : undefined,
    },
    { key: 'lengthRatio', label: '长度比例', value: lengthRatio },
    {
      key: 'easeAllowance',
      label: '松弛余量',
      value: easeAllowance,
      ergonomicCue: needArmLift
        ? '抬手/坐奏放量'
        : hasBelly
          ? '腹部舒适放量'
          : needLayering
            ? '预留内搭松量'
            : undefined,
    },
  ];

  return { officialSpecs, bodyErgonomics };
}

export function deconstructLocally(input: RequirementInput): DeconstructedRequirement {
  const text = `${input.projectName} ${input.clientName} ${input.rawNarrative}`.toLowerCase();
  const scene = SCENES.find((s) => s.id === input.targetSceneId) ?? SCENES[0];
  const isUniform = input.businessType === 'corporate_uniform';
  const { officialSpecs, bodyErgonomics } = buildOfficialEightSpecs(input);

  const emotionTags = new Set<string>();
  const extractedKeywords = new Set<string>();

  if (hasAny(text, ['端庄', '正式', '气质'])) emotionTags.add('端庄气度');
  if (hasAny(text, ['舒适', '宽松', '不紧绷', '自在', '松弛'])) emotionTags.add('松弛舒适');
  if (hasAny(text, ['中式', '海派', '香云纱', '宋锦', '梅花', '盘扣'])) emotionTags.add('当代东方韵味');
  if (hasAny(text, ['优雅', '含蓄', '低调', '内敛', '简约'])) emotionTags.add('克制静奢');
  if (hasAny(text, ['舞台', '演出', '明快', '活力', '上镜'])) emotionTags.add('明快舞台张力');
  if (hasAny(text, ['金融', '投行', '权威', '礼宾', '团队', '峰会'])) emotionTags.add('专业权威辨识');
  if (hasAny(text, ['电影', '晚宴', '鎏金'])) emotionTags.add('鎏金晚宴氛围');

  if (emotionTags.size < 3) {
    emotionTags.add(isUniform ? '现代职业识别' : '东方风骨当代演绎');
    emotionTags.add('体态友好剪裁');
    emotionTags.add('场景高适配');
  }

  for (const cue of bodyErgonomics) {
    extractedKeywords.add(cue);
  }

  const specByKey = (k: OfficialSpecItem['key']) =>
    officialSpecs.find((s) => s.key === k)?.value ?? '';

  const sceneFitScore = scene.suitableBusiness.includes(input.businessType) ? 96 : 86;

  const dimensions: DimensionItem[] = [
    {
      key: 'styleTone',
      label: '风格调性',
      value: Array.from(emotionTags).slice(0, 3).join(' · '),
      detail: `结合「${specByKey('category')}」定位，兼顾文化辨识度与当代极简审美。`,
      score: 95,
    },
    {
      key: 'silhouetteReq',
      label: '廓形要求',
      value: specByKey('patternStructure'),
      detail: `${specByKey('lengthRatio')}；${specByKey('easeAllowance')}`,
      score: 96,
    },
    {
      key: 'fabricTexture',
      label: '面料质感',
      value: specByKey('fabric'),
      detail: `匹配「${SEASON_LABELS[input.season]}」穿着体感，兼顾垂坠骨感与贴肤舒适度。`,
      score: input.season === 'summer' ? 90 : 95,
    },
    {
      key: 'craftDetail',
      label: '工艺细节',
      value: `${specByKey('collar')}｜${specByKey('motif')}`,
      detail:
        bodyErgonomics.length > 0
          ? `重点落实人体工学细节：${bodyErgonomics.slice(0, 2).join('；')}。`
          : '以克制精工细节强化成衣品质与近赏记忆点。',
      score: 94,
    },
    {
      key: 'colorSystem',
      label: '色彩体系',
      value: specByKey('color'),
      detail: `适配 ${scene.lighting.colorTempLabel}，保证自然显白与空间和谐。`,
      score: 92,
    },
    {
      key: 'sceneFit',
      label: '场景适配度',
      value: `${scene.name}（${scene.formality}）`,
      detail: scene.backdropHint,
      score: sceneFitScore,
    },
  ];

  const aestheticArchetype = hasAny(text, ['舞台', '演出'])
    ? '「明快华彩 · 舞台演奏两件式东方美学」'
    : hasAny(text, ['香云纱', '低调', '内敛'])
      ? '「素雅本真 · 香云纱松弛静奢美学」'
      : hasAny(text, ['梅花', '青果'])
        ? '「疏影雅韵 · 宋锦暗花柔和静奢」'
        : isUniform
          ? '「摩登金融海派 · 建筑秩序美学」'
          : '「端庄海派 · 体型友好现代中式正装」';

  const targetAudienceInsight =
    bodyErgonomics.length > 0
      ? `已自动识别客户体态与动作诉求：${bodyErgonomics.join('；')}。`
      : `面向「${input.clientName || '定制客户'}」，聚焦「${Array.from(emotionTags).slice(0, 3).join('、')}」核心情绪诉求。`;

  return {
    engineUsed: 'local_semantic',
    summary: `已将原始需求精准转译为官方 8 项定制工艺语言与 6 维审美参数，可直接带入场景选配。`,
    officialSpecs,
    bodyErgonomics,
    dimensions,
    emotionTags: Array.from(emotionTags).slice(0, 5),
    aestheticArchetype,
    targetAudienceInsight,
    extractedKeywords: Array.from(extractedKeywords),
    timestamp: new Date().toISOString(),
  };
}

export async function deconstructRequirement(
  input: RequirementInput,
  llmSettings: LlmSettings
): Promise<DeconstructedRequirement> {
  const localResult = deconstructLocally(input);

  if (!llmSettings.enabled || !llmSettings.apiKey.trim() || !llmSettings.baseUrl.trim()) {
    return localResult;
  }

  try {
    const endpoint = `${llmSettings.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const systemPrompt = [
      '你是上海服装集团 Sartoria AI 定制企划专家。请将客户口语需求转化为严格 JSON，仅输出 JSON 对象。',
      '字段：{ "aestheticArchetype": string, "emotionTags": string[3-5], "officialSpecs": [{ "key": "category"|"patternStructure"|"collar"|"fabric"|"color"|"motif"|"lengthRatio"|"easeAllowance", "label": string, "value": string, "ergonomicCue"?: string }] }',
      '所有输出仅为企划草稿，严禁包含价格报价或承诺生产交期。',
    ].join('\n');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmSettings.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: llmSettings.model || 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input.rawNarrative },
        ],
      }),
    });

    if (!response.ok) return localResult;
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = payload.choices?.[0]?.message?.content ?? '';
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return localResult;

    const parsed = JSON.parse(jsonMatch[0]) as Partial<DeconstructedRequirement>;
    if (!Array.isArray(parsed.officialSpecs) || parsed.officialSpecs.length !== 8) {
      return localResult;
    }

    return {
      ...localResult,
      engineUsed: 'llm_api',
      aestheticArchetype: parsed.aestheticArchetype || localResult.aestheticArchetype,
      emotionTags:
        Array.isArray(parsed.emotionTags) && parsed.emotionTags.length > 0
          ? parsed.emotionTags.slice(0, 5)
          : localResult.emotionTags,
      officialSpecs: parsed.officialSpecs,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return localResult;
  }
}
