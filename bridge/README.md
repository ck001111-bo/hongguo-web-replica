# 内容桥接后端（上游 `server/` 同源实现）

> 本目录是网页版 `web/` 的**内容来源**：它把上游 `N3urda/hongguoTV` 的接口契约在 Node 端实现，供 `web/server.mjs` 经 `BRIDGE_BASE_URL` 同源代理调用，从而规避浏览器跨域。
> 来源：上游公开仓 `N3urda/hongguoTV`（GPL-3.0-only），本目录同样以 GPL-3.0-only 发布。

## 它做什么
- 目录类（首页 / 详情 / 分类）：抓取上游自建站点 `hongguoduanju.com` 的 SSR `_ROUTER_DATA`（**无需签名**，公开可访问）。
- 播放类：调用字节跳动 App 私有接口 `multi_video_model/v1` 换取带签名的播放地址（**需要 x-gorgon / x-medusa 全套反爬签名**）。
- 暴露与 `web/` 一致的 REST 契约：`/health`、`/api/home`、`/api/search`、`/api/series/:id`、`/api/episodes/:id/stream`。

## 运行
```bash
cd bridge
npm install                 # 仅依赖 axios
node index.mjs             # 监听 127.0.0.1:8787
# 局域网/电视访问：
node index.mjs --lan       # 监听 0.0.0.0
# 指定端口：
PORT=8799 node index.mjs
```
然后在网页端指向它：
```bash
cd ../web
BRIDGE_BASE_URL=http://127.0.0.1:8787 npm start
```

## ⚠️ 已知限制（上游级，非本仓库引入）
1. **播放签名失效（核心）**：`multi_video_model/v1` 当前返回 `HTTP 200 + Code:110001 "未知异常"`。原因是上游纯 JS 重实现的 gorgon/medusa 签名，因字节服务端算法轮换而**被拒认**——属"逆向 vs 加固"的持续对抗，详见根目录报告 §7.2。此时 `web/` 会优雅回退到公共样例 MP4。
2. **搜索 502**：首路径 App 签名搜索被拒，回退的官网搜索 SSR 页面结构已漂移导致解析失败（与签名护城河无关，属上游页面变化）。
3. **出口代理拦截**：若本机设置了 `https_proxy` 且对 `fqnovel.com` 返回 4xx，须直连：
   ```bash
   env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY node index.mjs
   ```

## 合规红线
签名逆向属"对抗/安全研究"范畴，本目录仅作**学习记录与接口复现**；据此构造请求以获取未授权内容并进行再分发，超出 GPL-3.0 与学习目的边界。请严守"仅用于理解防御机制、不用于未授权内容分发"的底线。
