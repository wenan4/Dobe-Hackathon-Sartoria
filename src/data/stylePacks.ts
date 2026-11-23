import type { StylePack } from '../types/sartoria';

export const STYLE_PACKS: StylePack[] = [
  {
    id: 'shanghai-haipai',
    name: '上海服装集团 · 海派高定与职业服风格包',
    enterprise: '上海服装集团（存量静态模拟资产库）',
    tagline: '摩登海派 · 东方风骨 · 国际剪裁',
    description:
      '归集海派经典改良立领/西装版型、宋锦/香云纱/精纺羊毛等特色面料、盘扣/镶滚宕条/苏绣/全毛衬归拔等经典及非遗工艺，覆盖高端私定与金融/涉外团体职业服全场景。',
    signatureElements: ['海派改良立领', '手工琵琶盘扣', '真丝镶滚宕条', '建筑感西装归拔', '暗门襟东方意象'],
    accentHex: '#C5A467',
    isDefault: true,
  },
  {
    id: 'minimal-executive',
    name: '可扩展风格包示例 · 新锐极简国际商务体系',
    enterprise: 'Sartoria AI 企业扩展风格包（演示架构扩展性）',
    tagline: '极简建筑廓形 · 高机能精纺 · 跨企业快速复用',
    description:
      '展示 Sartoria AI 的多企业风格包扩展能力：仅需替换静态 JSON/知识库资产包，即可将同一套六维解构、选配、护栏与台账引擎无缝切换至其他定制品牌或垂直职业装赛道。',
    signatureElements: ['无结构柔肩廓形', '极简暗扣前襟', '三防抗皱精纺', '低饱和中性建筑色'],
    accentHex: '#7A96A8',
    isDefault: false,
  },
];
