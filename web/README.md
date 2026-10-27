# 红果TV 网页复刻版（教学样本）

布局与功能对齐原生 Android App（首页推荐 + 海报墙 + 分类筛选、详情选集、MP4 播放 + 弹幕、搜索、我的收藏/历史）。
数据全部经由**同源 `/api`** 获取，由 `server.mjs` 代理到导师授权的桥接后端，或回退到内置演示数据。

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
# 接入导师授权的真实后端（同源代理，规避跨域）：
BRIDGE_BASE_URL=http://<后端地址>:<端口> npm start
# 若后端开启了 BRIDGE_TOKEN：
BRIDGE_BASE_URL=http://<后端地址>:<端口> BRIDGE_TOKEN=<口令> npm start
```
默认端口 `5173`，打开 http://127.0.0.1:5173 。

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
- 真实栏目 / 分类 / 海报 / 播放地址由导师授权后端提供；演示模式仅用于 UI 评审，不含任何第三方版权内容。
- 本目录随上游采用 **GPL-3.0-only** 许可。

## 上游与署名
- **上游公开源**：[N3urda/hongguoTV](https://github.com/N3urda/hongguoTV)（GPL-3.0，GitHub 公开可访问）。本网页版是其衍生作品，接口契约与上游 `server/` 完全一致。
- **署名与版权**：见仓库根目录 `NOTICE`；许可全文见 `LICENSE`。
- **内容授权**：真实栏目 / 分类 / 海报 / 播放地址由导师授权后端提供；影视内容源的版权与授权由指导教师负责，本仓库不涉及内容再分发。
