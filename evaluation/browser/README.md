# Chromium 回归

先在仓库根目录运行 `npm run build`。运行器需要 Playwright 和 Chromium，可通过环境中已有的安装使用。

```powershell
# 若 Playwright 或 Chromium 安装在仓库之外，设置各自的入口。
$env:SARTORIA_PLAYWRIGHT_MODULE = 'C:/path/to/playwright/index.mjs'
$env:SARTORIA_CHROMIUM_PATH = 'C:/path/to/chromium.exe'
node evaluation/browser/run.mjs
```

默认将 `dist/` 的实际构建文件提供给 Chromium，加载首屏后禁用浏览器网络并验证 `navigator.onLine === false`。测试禁止外部请求，通过浏览器界面完成两轮改稿、独立项目重开和历史导出。无合格组合的独立案例验证待核 V1/V2、空的选配与方案、重新打开后逐字节一致的 JSON。这个模式也通过文件路由验证刷新后的浏览器存储。

若要走实际的本地 HTTP 路由，在另一终端运行 `npm run preview -- --host localhost --port 4175 --strictPort`，再运行 `node evaluation/browser/run.mjs --http`。公开入口另外用 `node evaluation/browser/run.mjs --public` 查验。公开模式只读取已发布页面。

运行 `node evaluation/browser/run.mjs --faults` 可验证非法 JSON、模拟上游 HTTP 504 和旧版密钥设置的清理。请求全部由 Chromium 测试拦截，回退到本地后应仍能列出两套候选。

导出文件及失败截图保存在 `node_modules/.cache/sartoria-browser/results/`。可用 `SARTORIA_BROWSER_OUTPUT` 改写该目录。
