# Sartoria AI — 海派高定与团体职业服 AI 企划辅助 Agent

> **赛道与命题**：FDE 赛道 · 上海服装集团 · 服装板块｜海派高定与团体职业服 AI 企划辅助  
> **在线访问（Cloudflare Workers × GitHub 自动同步构建）**：
> - **官网总览**：https://sartoria.zichengyu.com
> - **在线 Demo 工作台**：https://sartoria.zichengyu.com/demo
> - **3 分钟演示视频页**：https://sartoria.zichengyu.com/video（兼容 `/vedio`）
> - **在线项目介绍文档**：https://sartoria.zichengyu.com/docs
> - **GitHub 仓库**：https://github.com/zicheng-yu/Dobe-Hackathon-Sartoria

---

## 核心交付闭环

1. **需求拆解与三类信息分离（`/demo`）**：将客户自然语言拆解为官方 **8 项专业定制参数** + **6 维审美雷达**，严格分离「**用户明确说的 / 系统建议的 / 还要人工核实的**」——客户未指定颜色绝不代客定色，松弛余量不凭空报具体厘米数。
2. **静态模拟目录与选配**（`/demo/configurator`、`/demo/knowledge`）按客户硬条件筛选 36 条在用记录，含 9 款版型、13 款面料、11 项工艺与 3 个参考案例。选配提供场景参考图、Three.js 面料光泽预览、SVG 结构图以及逐项证据。其余历史案例可在知识库查阅。
3. **带资源依据的方案初稿与三镜头视觉需求包（`/demo/proposal`）**：输出含四类资产编码依据、面料三维判断依据（风格适配 / 体感适配 / 体型适配）、六步人机分工与人工终审清单的方案初稿（支持导出 Markdown / 打印），以及成衣 / 细节 / 上身氛围三镜头 Midjourney / Flux / 即梦提示词包（不接外部绘图 API）。
4. **可编辑、可回看、可导出业务台账（`/demo/ledger`）**：回看原始需求、四类匹配静态资产与全流程修改前后 `diffSummary`，支持人工编辑状态与备注并一键导出 UTF-8 BOM CSV / JSON / 打印报告。
5. **完整项目说明与独立《Agent 能力边界清单》**：详见 [docs/Sartoria-AI-Solution-Architecture.md](./docs/Sartoria-AI-Solution-Architecture.md)（已同步在线渲染于 `/docs`）。

---

## 快速启动与验证

环境要求：Node.js `>= 22`

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器
npm run dev

# 3. 运行核心引擎与路由自动化测试
npm test

# 4. 代码检查与生产构建
npm run lint
npm run build
```

> 默认开启 **零 Key 本地领域语义引擎**，离线即可稳定完整演示；如需体验自由文案大模型增强解析，可在 `/demo` 右上角 **「本地引擎」** 临时配置 OpenAI 兼容 API。

---

## Cloudflare Workers 部署与 GitHub 同步

- 配置文件：[wrangler.jsonc](./wrangler.jsonc)（Workers Static Assets + `not_found_handling: "single-page-application"`）。
- 构建与发布命令：`npm run build` → `npx wrangler deploy`。
- 已接入 Cloudflare Workers Builds，监听本仓库 `main` 分支：每次合并或推送 `main` 后自动构建并同步上线至 `https://sartoria.zichengyu.com`。
- 更新 3 分钟 Demo 视频：录制上传至 B 站 / 腾讯视频 / YouTube（公开无密码直链）后，编辑 [src/data/siteConfig.ts](./src/data/siteConfig.ts) 中的 `video.externalUrl` / `video.embedUrl` 并推送 `main` 即可自动生效。
