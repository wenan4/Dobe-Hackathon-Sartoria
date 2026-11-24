import { CRAFTS } from '../data/crafts';
import { FABRICS } from '../data/fabrics';
import { PATTERNS } from '../data/patterns';
import { SCENES } from '../data/scenes';
import type { ConfigurationState, CraftHotspot } from '../types/sartoria';

export interface ResolvedStageVisual {
  heroImage: string;
  craftCloseupImage: string;
  isExactPhotographicVariant: boolean;
  previewBadge: string;
  ambientFilter: string;
  fabricTintOverlay: string;
  hotspots: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    hotspot: CraftHotspot;
    closeupImage: string;
  }>;
}

export function resolveStageVisual(config: ConfigurationState): ResolvedStageVisual {
  const pattern = PATTERNS.find((p) => p.id === config.patternId) ?? PATTERNS[0];
  const fabric = FABRICS.find((f) => f.id === config.fabricId) ?? FABRICS[0];
  const scene = SCENES.find((s) => s.id === config.sceneId) ?? SCENES[0];
  const crafts = CRAFTS.filter((c) => config.craftIds.includes(c.id));

  const silhouette = pattern.blueprintConfig.silhouetteType;
  const isUniform = pattern.businessType === 'corporate_uniform';
  const isOfficialMensJacket =
    silhouette === 'jacket_h_cross_collar' ||
    silhouette === 'jacket_h_low_collar' ||
    silhouette === 'jacket_h_dropped';
  const isOfficialShawl = silhouette === 'jacket_h_shawl';
  const isStageTwoPiece = silhouette === 'stage_two_piece';

  let heroImage = scene.fallbackImage;
  let isExact = false;

  // Every scene selection resolves to its genuine scene photography,
  // refined by garment silhouette & color-family photographic variants.
  if (scene.id === 'scene-studio-minimal') {
    if (isStageTwoPiece) {
      heroImage = '/assets/courtyard-garden-soiree.jpg';
      isExact = fabric.id === 'fab-official-ivory-rose-stage';
    } else if (isOfficialShawl) {
      if (fabric.id === 'fab-suzhou-moonlight-white') {
        heroImage = '/assets/case1-bund-moonlight-white.jpg';
        isExact = true;
      } else if (fabric.id === 'fab-xiangyun-crimson-velvet') {
        heroImage = '/assets/case1-bund-crimson-velvet.jpg';
        isExact = true;
      } else {
        heroImage = '/assets/case1-salon-obsidian-gold.jpg';
        isExact = fabric.id === 'fab-official-plum-song';
      }
    } else if (isUniform) {
      heroImage =
        fabric.colorFamily === 'stone_gray'
          ? '/assets/case2-lujiazui-stonegray.jpg'
          : fabric.colorFamily === 'pine_green'
            ? '/assets/case2-lujiazui-pinegreen.jpg'
            : '/assets/case2-lujiazui-navy.jpg';
      isExact = ['fab-bund-navy-wool130', 'fab-shikumen-stone-gray', 'fab-shanghai-pine-green'].includes(
        fabric.id
      );
    } else if (silhouette === 'gown_column') {
      heroImage =
        fabric.id === 'fab-suzhou-moonlight-white'
          ? '/assets/case1-bund-moonlight-white.jpg'
          : fabric.id === 'fab-xiangyun-crimson-velvet'
            ? '/assets/case1-bund-crimson-velvet.jpg'
            : '/assets/case1-bund-obsidian-gold.jpg';
      isExact = [
        'fab-song-obsidian-gold',
        'fab-suzhou-moonlight-white',
        'fab-xiangyun-crimson-velvet',
      ].includes(fabric.id);
    } else {
      // Official jackets in minimal studio
      heroImage = '/assets/official1-studio-jacket.jpg';
      isExact = fabric.id === 'fab-official-silk-jacquard-subtle';
    }
  } else if (scene.id === 'scene-bund-protocol') {
    heroImage =
      fabric.colorFamily === 'stone_gray'
        ? '/assets/case2-lujiazui-stonegray.jpg'
        : fabric.colorFamily === 'pine_green'
          ? '/assets/case2-lujiazui-pinegreen.jpg'
          : '/assets/case2-protocol-navy.jpg';
    isExact = fabric.id === 'fab-bund-navy-wool130';
  } else if (scene.id === 'scene-outdoor-stage') {
    heroImage = '/assets/courtyard-garden-soiree.jpg';
    isExact = fabric.id === 'fab-official-ivory-rose-stage';
  } else if (scene.id === 'scene-jingan-salon') {
    if (fabric.id === 'fab-suzhou-moonlight-white') {
      heroImage = '/assets/case1-bund-moonlight-white.jpg';
      isExact = true;
    } else if (fabric.id === 'fab-xiangyun-crimson-velvet') {
      heroImage = '/assets/case1-bund-crimson-velvet.jpg';
      isExact = true;
    } else {
      heroImage = '/assets/case1-salon-obsidian-gold.jpg';
      isExact = fabric.id === 'fab-official-plum-song' || fabric.id === 'fab-song-obsidian-gold';
    }
  } else if (scene.id === 'scene-bund-banquet') {
    if (fabric.id === 'fab-suzhou-moonlight-white') {
      heroImage = '/assets/case1-bund-moonlight-white.jpg';
      isExact = true;
    } else if (fabric.id === 'fab-xiangyun-crimson-velvet') {
      heroImage = '/assets/case1-bund-crimson-velvet.jpg';
      isExact = true;
    } else {
      heroImage = '/assets/case1-bund-obsidian-gold.jpg';
      isExact = fabric.id === 'fab-song-obsidian-gold';
    }
  } else if (scene.id === 'scene-lujiazui-summit') {
    heroImage =
      fabric.colorFamily === 'stone_gray'
        ? '/assets/case2-lujiazui-stonegray.jpg'
        : fabric.colorFamily === 'pine_green'
          ? '/assets/case2-lujiazui-pinegreen.jpg'
          : '/assets/case2-lujiazui-navy.jpg';
    isExact = [
      'fab-bund-navy-wool130',
      'fab-shikumen-stone-gray',
      'fab-shanghai-pine-green',
    ].includes(fabric.id);
  }

  if (isUniform && pattern.blueprintConfig.collarStyle === 'notch_lapel') isExact = false;
  const previewBadge = `${scene.shortName} · ${fabric.shortName}`;

  const craftCloseupImage =
    crafts.length > 0
      ? crafts[0].closeupImage
      : isUniform || isOfficialMensJacket
        ? '/assets/case2-craft-detail.jpg'
        : '/assets/case1-craft-detail.jpg';

  // Perceptible, tasteful material lighting response when exploring fabrics on shared studio photography
  const fabricFilterByFamily: Record<string, string> = {
    earth_brown: 'sepia(0.16) contrast(1.03) brightness(0.96)',
    stone_gray: 'saturate(0.86) brightness(1.04) contrast(0.98)',
    ivory: 'brightness(1.06) contrast(0.97)',
    ivory_rose: 'saturate(1.08) brightness(1.03)',
    crimson: 'saturate(1.12) contrast(1.04)',
    pine_green: 'hue-rotate(-8deg) saturate(1.08)',
    navy: 'contrast(1.04) saturate(1.04)',
    obsidian: 'contrast(1.05) brightness(0.97)',
    neutral_silk: 'none',
  };

  const baseFilter = scene.lighting.cssFilter === 'none' ? '' : scene.lighting.cssFilter;
  const fabricFilter = isExact ? '' : fabricFilterByFamily[fabric.colorFamily] ?? '';
  const ambientFilter = [baseFilter, fabricFilter].filter((x) => x && x !== 'none').join(' ') || 'none';

  const fabricTintOverlay = isExact
    ? scene.lighting.overlayGradient
    : `linear-gradient(145deg, ${fabric.pbr.baseColor}36 0%, transparent 55%, ${fabric.pbr.sheenColor}2b 100%)`;

  const isRightFramedStudio = heroImage === '/assets/official1-studio-jacket.jpg';
  const isRightFramedStage = heroImage === '/assets/courtyard-garden-soiree.jpg';

  const collarPin = isRightFramedStudio
    ? { x: 66, y: 29, zoomScale: 2.0, label: pattern.collarType }
    : isRightFramedStage
      ? { x: 68, y: 37, zoomScale: 2.0, label: pattern.collarType }
      : isUniform
        ? { x: 42, y: 48, zoomScale: 2.0, label: pattern.collarType }
        : { x: 50, y: 41, zoomScale: 2.0, label: pattern.collarType };

  const fabricPin = isRightFramedStudio
    ? { x: 65, y: 46, zoomScale: 2.0, label: `${fabric.shortName} · ${fabric.gsm}g/m²` }
    : isRightFramedStage
      ? { x: 67, y: 58, zoomScale: 2.0, label: `${fabric.shortName} · ${fabric.gsm}g/m²` }
      : isUniform
        ? { x: 45, y: 62, zoomScale: 2.0, label: `${fabric.shortName} · ${fabric.gsm}g/m²` }
        : { x: 51, y: 58, zoomScale: 2.0, label: `${fabric.shortName} · ${fabric.gsm}g/m²` };

  const easePin = isRightFramedStudio
    ? { x: 69, y: 54, zoomScale: 2.0, label: pattern.easeAllowance }
    : isRightFramedStage
      ? { x: 63, y: 48, zoomScale: 2.0, label: pattern.easeAllowance }
      : isUniform
        ? { x: 58, y: 55, zoomScale: 2.0, label: pattern.easeAllowance }
        : { x: 53, y: 69, zoomScale: 2.0, label: pattern.easeAllowance };

  const hotspots: ResolvedStageVisual['hotspots'] = [
    {
      id: `hs-collar-${pattern.id}`,
      title: pattern.collarType,
      subtitle: pattern.silhouette,
      badge: '领型与廓形',
      hotspot: collarPin,
      closeupImage: craftCloseupImage,
    },
    {
      id: `hs-fabric-${fabric.id}`,
      title: `${fabric.name}（${fabric.gsm}g/m²）`,
      subtitle: `${fabric.composition} · ${fabric.drape}`,
      badge: '核心面料',
      hotspot: fabricPin,
      closeupImage: craftCloseupImage,
    },
    {
      id: `hs-ease-${pattern.id}`,
      title: crafts[0]?.name ?? '体态松弛与工艺细节',
      subtitle: pattern.easeAllowance,
      badge: crafts[0]?.heritageLevel ?? '松弛余量',
      hotspot: easePin,
      closeupImage: crafts[0]?.closeupImage ?? craftCloseupImage,
    },
  ];

  return {
    heroImage,
    craftCloseupImage,
    isExactPhotographicVariant: isExact,
    previewBadge,
    ambientFilter,
    fabricTintOverlay,
    hotspots,
  };
}
