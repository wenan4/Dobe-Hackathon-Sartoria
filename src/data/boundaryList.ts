export interface BoundaryMatrixRow {
  domain: string;
  agentCanDo: string;
  agentMustNotDo: string;
  humanOwner: string;
  uiGuardrail: string;
}

export const AGENT_BOUNDARY_MATRIX: BoundaryMatrixRow[] = [
  {
    domain: '需求理解与审美转化',
    agentCanDo: '将感性描述解构为六大专业维度参数清单与客户情绪审美标签报告',
    agentMustNotDo: '不替代人工与客户做最终设计需求签字确认',
    humanOwner: '定制业务专员 / 高定企划人员',
    uiGuardrail: '需求解构结果标注「AI 解析草稿」，允许人工修订参数后再进入方案',
  },
  {
    domain: '资产检索与方案初稿',
    agentCanDo: '基于集团存量静态模拟资产库进行版型/面料/工艺匹配、生成参考方案初稿与可行性风险提示',
    agentMustNotDo: '不执行最终版型定稿、不跳过版师确认直接锁定工艺单、不擅自承诺交期',
    humanOwner: '职业服方案设计师 / 资深版师',
    uiGuardrail: '企划方案纸面显式加盖「AI 辅助参考初稿 · 非终审定稿」印章与人工复核清单',
  },
  {
    domain: '可视化选配与绘图辅助',
    agentCanDo: '提供设定场景下的车企式选配预览、3D 面料光泽参考、版型图纸与标准化 AI 绘图提示词包',
    agentMustNotDo: '不以 AI 效果图替代实物面料米样色卡核对与真实毛样试身',
    humanOwner: '高定企划人员 / 门店顾问',
    uiGuardrail: '视觉包附带提示：实物色泽以工坊高显色光源下米样实测为准',
  },
  {
    domain: '商务报价与合同签订',
    agentCanDo: '记录参考工期提示、面料护理及起订量规范供内部测算参考',
    agentMustNotDo: '严禁生成对外正式报价单、执行折扣审批、签订商务合同或触发收款动作',
    humanOwner: '业务专员 / 商务经理',
    uiGuardrail: '全系统无自动报价、无下单、无合同签署及支付入口',
  },
  {
    domain: '数据边界与系统集成',
    agentCanDo: '使用集团存量静态模拟定制数据完成端到端企划演示、留痕与台账导出',
    agentMustNotDo: '不对接真实 ERP/MES/PLM 生产系统，不触碰真实客户隐私数据或自动下发生产指令',
    humanOwner: '集团信息安全与业务管理团队',
    uiGuardrail: '顶部与台账页明示「静态模拟资产库 · 零生产系统直连」，流转终点止于人工复核归档',
  },
];
