# 参赛版决策数据合同

对照基线固定为 [`4e0d95921683fd04cf7834b754b02687d73d56a6`](https://github.com/zicheng-yu/Dobe-Hackathon-Sartoria/tree/4e0d95921683fd04cf7834b754b02687d73d56a6)。开发分支接在上游现有界面之上。集成顺序为共享合同 → 访谈和目录 → 改稿与交接 → 同集对照和浏览器回归。

`src/types/decisions.ts` 定义跨模块合同。`src/data/decisionFixtures.ts` 提供秋季会务团装和官方案例六的联调样例，录像简报及改口文本单独留存。

| 合同 | 约定 |
| --- | --- |
| `DecisionRequirement` | `turns` 保存原话。显式要求用 `sourceTurnId` 和逐字 `quote` 回查；`confirmed` 保存 `verifiedBy`。`neq` 表示排除。字段值缺失或冲突时为 `null`，进入 `pending`。未裁决的硬条件带 `blocking: true`，人工核定后再生成可选组合。系统建议是偏好或待核。 |
| `AssetEvidence` | `assetId` 和 `assetCode` 对应目录。每条证据有字段、结构化属性、来源和 `simulated: true`；历史案例只能作为参考。硬条件违约归入 `rejected`，关键属性未知归入 `needs_review`。 |
| `MatchResult` | `recommended` 和 `alternative` 只放通过硬筛的组合。无合格项返回 `no_match`，保留可追溯的待核或拒绝项。 |
| `Revision` / `Version` | 预览列出字段差异和连带影响。明确撤回某条要求时，用 `withdraws` 指向对应条件。同字段的其他条件仍独立生效。仅确认后推进项目版本，版本 ID 由项目 ID 和递增序号生成，并记录前版。可保存待核版，保留当时的筛选依据。无合格组合时 `candidate`、`proposal`、`promptPack` 为 `null`。 |
| `DecisionExport` | 固定 `sartoria_handoff_v1`。导出读取同一个已选版本，包含原话、证据、变化、待核负责人和模拟声明。 |
