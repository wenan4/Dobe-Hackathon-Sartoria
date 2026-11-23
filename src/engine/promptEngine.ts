import { CRAFTS } from '../data/crafts';
import { FABRICS } from '../data/fabrics';
import { PATTERNS } from '../data/patterns';
import { SCENES } from '../data/scenes';
import type {
  ConfigurationState,
  DeconstructedRequirement,
  RequirementInput,
  VisualPromptPack,
} from '../types/sartoria';

const COLOR_EN: Record<string, string> = {
  obsidian: 'deep obsidian charcoal black with subtle tonal jacquard',
  ivory: 'luminous moonlight ivory with pale misty celadon sheen',
  crimson: 'deep burgundy crimson velvet with dark floral jacquard luster',
  navy: 'deep Bund midnight navy worsted twill',
  stone_gray: 'warm misty silver-charcoal gray',
  pine_green: 'deep refined Shanghai pine-ink forest green worsted wool',
  champagne: 'luminous champagne pearl heavy silk crepe satin',
  mist_blue: 'tranquil dusk mist indigo blue silk jacquard',
  ivory_rose: 'ivory white jacquard jacket trimmed with vibrant rose-pink silk piping and matching vibrant rose-pink lustrous satin dress',
  earth_brown: 'authentic matte dark earth-brown Gambiered Canton silk (Xiangyunsha)',
};

const WEAVE_EN: Record<string, string> = {
  薄款醋酸提花锦: 'lightweight matte triacetate silk jacquard weave',
  宋锦重纬提花: 'Song Brocade silk jacquard weave',
  缎纹暗花织锦: 'Suzhou silk damask jacquard weave',
  香云纱自然肌理: 'authentic matte organic-crinkle Gambiered Canton silk (Xiangyunsha)',
  提花烂花丝绒: 'burnt-out floral silk velvet weave',
  精纺斜纹呢: 'fine diagonal worsted wool twill',
  平纹混纺精纺: 'fine worsted wool-mulberry silk blend',
  高密弹力斜纹: 'high-density stretch worsted twill',
  重磅精纺人字呢: 'heavyweight cashmere wool herringbone suiting',
};

const SCENE_EN: Record<string, string> = {
  'scene-studio-minimal':
    'minimalist architectural alabaster light-gray gallery studio, clean negative space, CRI 95 diffused museum lighting, Loro Piana editorial lookbook aesthetic',
  'scene-bund-protocol':
    'grand Shanghai neoclassical formal cultural reception hall, travertine limestone columns, warm architectural lighting',
  'scene-outdoor-stage':
    'atmospheric open-air Shanghai heritage garden concert stage at twilight, warm stage spotlights, lush greenery softly blurred in bokeh',
  'scene-jingan-salon':
    'minimalist contemporary Shanghai art gallery salon, warm architectural travertine walls, soft diffused daylight',
  'scene-bund-banquet':
    'grand historic Shanghai Bund heritage mansion banquet hall at night, warm crystal chandeliers, dark walnut paneling, Bund skyline in soft bokeh',
  'scene-lujiazui-summit':
    'grand modern Lujiazui Shanghai financial summit glass atrium, floor-to-ceiling windows with Pudong skyline daylight',
};

const PATTERN_EN: Record<string, string> = {
  jacket_h_low_collar:
    'dignified bespoke modern Chinese H-line straight-cut mid-hip jacket (no waist cinching, comfortable relaxed abdominal drape), low rounded Mandarin stand collar under 3cm, gently sloped clean shoulders',
  jacket_h_shawl:
    'refined bespoke relaxed H-line modern Chinese mid-hip jacket with subtle waist shaping and sleek narrow soft shawl lapel collar layered over an ivory silk blouse',
  stage_two_piece:
    'bespoke two-piece concert stage performance ensemble: cropped relaxed micro-H Chinese diagonal-placket jacket with generous sleeve allowance for effortless arm movement, layered over a sleeveless ankle-length wide A-line lustrous satin gown',
  jacket_h_dropped:
    'understated minimalist bespoke modern Chinese H-line straight mid-hip jacket with soft natural dropped shoulders, low rounded Mandarin collar under 3cm, generous relaxed front drape',
  gown_column: 'floor-length bespoke Haipai neo-Chinese evening gown, sleek elongated column-mermaid silhouette',
  gown_cape: 'floor-length bespoke Haipai couture evening gown with sculptural flowing capelet shoulder',
  suit_woman_stand: 'architectural tailored female executive suit with modified Haipai Mandarin stand collar',
  suit_man_double: 'full-canvas double-breasted peak-lapel bespoke Haipai tuxedo suit',
  suit_ensemble:
    'coordinated male and female bespoke Shanghai Haipai corporate tailored suits with refined Mandarin stand-lapel collar and crisp structured shoulders',
};

const CRAFT_EN_MAP: Record<string, string> = {
  'crf-low-collar-ergo': '3cm rounded low Mandarin stand collar and clean relaxed abdominal drape construction',
  'crf-plum-starlight-motif': 'tonal woven plum blossom floral jacquard accented with ultra-fine microscopic pinpoint starlight glints',
  'crf-contrast-piping-cuff': 'vibrant contrast 3mm silk piping trim along diagonal placket and wide comfortable concert cuffs',
  'crf-haipai-pipa-button': 'handmade silk pipa frog buttons along diagonal placket',
  'crf-suzhou-magnolia-embroidery': 'tonal split-thread Suzhou silk embroidery of white magnolia blossom',
  'crf-full-canvas-guiba': 'hand-shaped full-canvas horsehair chest structure and crisp lapel roll',
  'crf-hidden-mandarin-placket': 'minimalist hidden-placket modified Haipai Mandarin stand collar',
  'crf-milanese-cuff-label': 'working surgeon cuffs with handmade Milanese silk buttonholes',
};

export function generateVisualPromptPack(
  input: RequirementInput,
  deconstructed: DeconstructedRequirement,
  config: ConfigurationState
): VisualPromptPack {
  const pattern = PATTERNS.find((p) => p.id === config.patternId) ?? PATTERNS[0];
  const fabric = FABRICS.find((f) => f.id === config.fabricId) ?? FABRICS[0];
  const scene = SCENES.find((s) => s.id === config.sceneId) ?? SCENES[0];
  const crafts = CRAFTS.filter((c) => config.craftIds.includes(c.id));

  const colorEn = COLOR_EN[fabric.colorFamily] ?? fabric.colorName;
  const weaveEn = WEAVE_EN[fabric.weave] ?? 'fine luxury woven textile';
  const sceneEn = SCENE_EN[scene.id] ?? scene.name;
  const patternEn = PATTERN_EN[pattern.blueprintConfig.silhouetteType] ?? pattern.name;
  const craftEnList =
    crafts.length > 0
      ? crafts.map((c) => CRAFT_EN_MAP[c.id] ?? c.name).join(', ')
      : 'clean minimalist bespoke hand-finished seams';
  const craftCnList = crafts.length > 0 ? crafts.map((c) => c.name).join('、') : '极简高定净面精工';

  const isMensOfficial =
    pattern.blueprintConfig.silhouetteType === 'jacket_h_low_collar' ||
    pattern.blueprintConfig.silhouetteType === 'jacket_h_dropped';

  const subjectEn =
    pattern.businessType === 'corporate_uniform'
      ? 'poised Chinese executive man and woman models wearing coordinated bespoke corporate ensemble'
      : isMensOfficial
        ? 'poised dignified Chinese gentleman with a natural relaxed build'
        : 'poised elegant Chinese female model';
  const subjectCn =
    pattern.businessType === 'corporate_uniform'
      ? '气质挺拔的中国男女商务高管双人同框'
      : isMensOfficial
        ? '体态从容端庄的中国男士模特'
        : '仪态优雅的中国女士模特';

  const negEn =
    'lowres, blurry, tight fitting, wrinkled belly crease, high stiff collar, plastic shiny polyester, gaudy rhinestones, deformed hands, watermark, typography, text overlay';

  return {
    packTitle: `${input.projectName || pattern.name} · AI 视觉提示词包`,
    generatedAt: new Date().toISOString(),
    paletteSummary: `${fabric.colorName}（${fabric.pbr.baseColor}）× 光泽（${fabric.pbr.sheenColor}）｜${scene.lighting.colorTempLabel}`,
    shots: [
      {
        shotType: 'full_garment',
        shotTitle: '镜头 01 · 极简白棚全景定妆图',
        shotSubtitle: '无干扰审视领高比例、肩线落度、松弛余量与面料垂坠感',
        aspectRatio: '3:4',
        cameraSpec: '85mm 中长焦，f/4.0 全身清晰景深',
        lightingSpec: '5200K 画廊高显色柔光箱',
        prompts: {
          midjourney: `Full-length quiet-luxury studio lookbook photograph of ${subjectEn} wearing a ${patternEn}, crafted from ${colorEn} (${fabric.gsm}gsm ${weaveEn}), featuring ${craftEnList}. Clean soft warm alabaster studio background, crisp architectural drape without clinging, 85mm lens f/4, CRI 95 gallery lighting, Loro Piana editorial archive style --ar 3:4 --v 6.1 --style raw --stylize 160`,
          flux_sd: `Minimalist luxury fashion catalog photograph, ${subjectEn}, ${patternEn}, made of ${colorEn} (${fabric.gsm}gsm ${weaveEn}), refined details of ${craftEnList}, clean off-white gallery studio backdrop, balanced natural studio light showing authentic woven grain and comfortable drape, ultra sharp 8k photorealistic`,
          jimeng_cn: `静奢高定白棚全身定妆摄影，${subjectCn}，身着「${pattern.name}」（${pattern.silhouette}，${pattern.collarType}，${pattern.lengthRatio}，${pattern.easeAllowance}），面料采用${fabric.colorName}${fabric.weave}（${fabric.drape}、${fabric.luster}），呈现${craftCnList}。极简浅暖灰画廊白棚背景，高显色柔和棚拍光，真实织物肌理与自然垂感，无紧绷褶皱，无文字水印。`,
        },
        negativePrompt: negEn,
      },
      {
        shotType: 'craft_macro',
        shotTitle: '镜头 02 · 领型与织物工艺微距特写',
        shotSubtitle: '清晰呈现 3cm 低立领 / 青果领弧度、织纹肌理与手工细部',
        aspectRatio: '4:3',
        cameraSpec: '100mm 微距镜头，f/2.8 浅景深',
        lightingSpec: '45° 侧向柔光勾勒经纬与手工针脚',
        prompts: {
          midjourney: `Ultra-sharp 100mm macro textile close-up photograph focusing on collar, shoulder seam and fabric weave of a bespoke garment in ${colorEn} (${weaveEn}). Highlight ${craftEnList}. Visible woven threads, refined matte-to-silk luster, soft directional atelier lighting, luxury textile archive photography --ar 4:3 --v 6.1 --style raw --stylize 140`,
          flux_sd: `100mm macro bespoke tailoring detail photography, close-up of ${craftEnList} on ${colorEn} (${fabric.gsm}gsm ${weaveEn}), crisp woven fibers, delicate hand stitching, soft directional side light, shallow depth of field, ultra realistic editorial quality`,
          jimeng_cn: `100mm 超高清高定工艺微距特写，聚焦领口与面料经纬细节，材质为${fabric.colorName}${fabric.name}（${fabric.weave}，${fabric.luster}），精致呈现${craftCnList}。45度柔和侧向工坊光凸显真实丝线肌理与手工针脚，4:3 构图，无文字水印。`,
        },
        negativePrompt: negEn,
      },
      {
        shotType: 'scene_editorial',
        shotTitle: `镜头 03 · 设定场景氛围大片（${scene.shortName}）`,
        shotSubtitle: `直观预览成衣在「${scene.name}」真实光影下的气质与上镜效果`,
        aspectRatio: '4:3',
        cameraSpec: '50mm 人文镜头，f/2.0 建筑/舞台虚化',
        lightingSpec: `${scene.lighting.colorTempLabel}`,
        prompts: {
          midjourney: `Editorial quiet-luxury fashion photograph, wide 4:3 composition. ${subjectEn} standing poised inside ${sceneEn}. Wearing a ${patternEn} crafted from ${colorEn} (${weaveEn}), showcasing ${craftEnList}. Mood: ${deconstructed.emotionTags.slice(0, 3).join(', ')}. Authentic ${scene.lighting.colorTempLabel} lighting blending naturally across fabric highlights, 50mm f/2.0, Vogue China editorial quality --ar 4:3 --v 6.1 --style raw --stylize 200`,
          flux_sd: `Wide cinematic editorial fashion photograph, ${subjectEn} inside ${sceneEn}, wearing bespoke ${patternEn} in ${colorEn} (${weaveEn}) featuring ${craftEnList}, atmospheric bokeh, authentic ${scene.lighting.colorTempLabel} lighting, realistic drape and proportions, 8k magazine photography`,
          jimeng_cn: `杂志级场景穿搭氛围大片，4:3 横构图。${subjectCn}置身于「${scene.name}」（${scene.atmosphereKeywords.join('、')}），身着「${pattern.name}」（${pattern.collarType}，${pattern.easeAllowance}），选用${fabric.colorName}${fabric.weave}，呈现${craftCnList}。环境光线为${scene.lighting.colorTempLabel}，真实自然光影与面料质感，无文字水印。`,
        },
        negativePrompt: negEn,
      },
    ],
    deliveryBrief: [
      `推荐先生成「镜头 01 白棚定妆图」与客户确认领高/廓形/松量，再用「镜头 03 场景大片」确认实景氛围与上镜感。`,
      `实物色泽须以集团实体面料编号 ${fabric.code}（${fabric.shortName}）工坊米样核色为准。`,
    ],
  };
}
