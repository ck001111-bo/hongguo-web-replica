# 红果TV 网页复刻版（教学样本）

布局与功能对齐原生 Android App（首页推荐 + 海报墙 + 分类筛选、详情选集、MP4 播放 + 弹幕、搜索、我的收藏/历史）。
数据全部经由**同源 `/api`** 获取，由 `server.mjs` 代理到上游桥接后端（导师已授权直接沿用上游开源内容），或回退到内置演示数据。

## 目录
- `index.html` / `style.css` — 页面与样式
- `api.js` — 接口客户端（契约与上游 `server/` 完全一致）
- `app.js` — 前端逻辑（首页 / 分类 / 搜索 / 详情选集 / 播放+弹幕 / 我的）
- `demo-data.mjs` — 内置演示数据（符合 `Series`/`Episode` 字段）
- `server.mjs` — Web 跨域适配层：静态托管 + `/api` 代理 + 演示兜底

## 运行
```bash
cd web
npm start                 # 演示模式：返回内置样例数据
# 接入上游桥接后端，获取真实栏目/分类/海报/选集（同源代理，规避跨域）：
BRIDGE_BASE_URL=http://<上游桥接后端>:<端口> npm start
# 若后端开启了 BRIDGE_TOKEN：
BRIDGE_BASE_URL=http://<上游桥接后端>:<端口> BRIDGE_TOKEN=<口令> npm start
```
默认端口 `5173`，默认监听 `0.0.0.0`（便于本地预览面板/容器访问），打开 http://127.0.0.1:5173 。

> **健壮性**：`server.mjs` 对上游桥接的代理设有 `BRIDGE_TIMEOUT`（默认 8s）超时。若上游接口偶发挂起无响应，会在超时后**自动回退内置演示数据**，避免网页永久停留在"加载中"；前端 `api.js` 另设 10s `fetch` 超时兜底。可通过 `BRIDGE_TIMEOUT=12000` 调整窗口。

> **上游桥接后端**：来自上游开源仓 `N3urda/hongguoTV` 的 `server/`（`node index.mjs`，默认 8787）。
> 其真实播放流依赖字节跳动带签名视频接口；若该接口失效（上游常见现象），网页端会自动回退到公共样例 MP4 以保证播放器可用。
> **本地代理注意**：若本机存在出口代理（如 `https_proxy=127.0.0.1:xxxx`），上游 API 域名可能被拦截返回 4xx；启动桥接后端时请用 `env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY node index.mjs` 直连。

## 接口契约（与上游 server/ 一致）
| 请求 | 说明 |
| --- | --- |
| `GET /api/home?page=1` | 首页推荐 `{ items: Series[], page, pages, total }` |
| `GET /api/search?q=关键词&page=1` | 搜索 `{ items: Series[], page }` |
| `GET /api/series/:id` | 详情 `Series & { episodes: Episode[] }` |
| `GET /api/episodes/:id/play?fresh=1` | 触发解析 `{ path, contentType }` |
| `GET /api/episodes/:id/stream` | MP4 媒体流（支持 Range） |
| `GET /health` | 健康检查 |

`Series`: `id, title, cover, description, badge, tags`；`Episode`: `id, number, title`。

## 说明
- 上游 API 文档明确指出"当前没有浏览器跨域白名单配置，因此 Web 端需额外适配"——本 `server.mjs` 即该适配层。
- 真实栏目 / 分类 / 海报 / 选集由上游桥接后端提供（导师已授权直接沿用上游开源内容）；真实视频播放因上游签名接口可能失效，会回退公共样例 MP4；演示模式仅用于 UI 评审，不含任何第三方版权内容。
- 本目录随上游采用 GPL-3.0-only 许可。
