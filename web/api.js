// SPDX-License-Identifier: GPL-3.0-only
// 衍生作品，基于 N3urda/hongguoTV (GPL-3.0) — https://github.com/N3urda/hongguoTV
// 与上游 server/ 完全一致的接口契约（同源经由 dev server 代理，规避跨域）。
//   GET /api/home?page=      -> { items: Series[], page, pages?, total? }
//   GET /api/search?q=&page=  -> { items: Series[], page }
//   GET /api/series/:id       -> Series & { episodes: Episode[] }
//   GET /api/episodes/:id/play?fresh=1 -> { path, contentType }
//   GET /api/episodes/:id/stream      -> video/mp4（支持 Range）
const BASE = ""; // 同源

async function getJSON(path) {
  const r = await fetch(BASE + path, { headers: { Accept: "application/json" } });
  if (!r.ok) {
    let msg = `请求失败 ${r.status}`;
    try { msg = (await r.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

export const api = {
  home: (page = 1) => getJSON(`/api/home?page=${page}`),
  search: (q, page = 1) => getJSON(`/api/search?q=${encodeURIComponent(q)}&page=${page}`),
  series: (id) => getJSON(`/api/series/${id}`),
  // 触发解析并返回流地址（同源于 dev server，浏览器直接播放）
  streamUrl: (epId, fresh = true) =>
    `${BASE}/api/episodes/${epId}/stream${fresh ? "?fresh=1" : ""}`,
};
