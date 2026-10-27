// SPDX-License-Identifier: GPL-3.0-only
// 衍生作品，基于 N3urda/hongguoTV (GPL-3.0) — https://github.com/N3urda/hongguoTV
// 红果TV 网页复刻版前端：布局/功能对齐原生 App（首页推荐+海报墙+分类、详情选集、MP4 播放+弹幕、搜索、我的收藏/历史）。
// 数据全部经同源 /api 获取（dev server 代理到导师授权桥接后端，或回退内置演示数据）。
import { api } from "./api.js";

const $ = (s, r = document) => r.querySelector(s);
const view = $("#view");

const CATEGORIES = ["全部", "短剧", "都市", "逆袭", "甜宠", "古装", "悬疑", "战神", "神豪", "重生", "豪门", "虐恋", "婆媳"];

// ---- 本地存储：收藏 / 历史 ----
const LS_FAV = "hgtv_fav", LS_HIS = "hgtv_his";
const loadFav = () => { try { return JSON.parse(localStorage.getItem(LS_FAV)) || {}; } catch { return {}; } };
const saveFav = (o) => localStorage.setItem(LS_FAV, JSON.stringify(o));
const loadHis = () => { try { return JSON.parse(localStorage.getItem(LS_HIS)) || []; } catch { return []; } };
const saveHis = (a) => localStorage.setItem(LS_HIS, JSON.stringify(a.slice(0, 50)));
let fav = loadFav();
let history = loadHis();

const state = { tab: "home", category: "全部", page: 1, lastQuery: "" };

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function posterHTML(s) {
  const badge = s.badge ? `<span class="badge">${esc(s.badge)}</span>` : "";
  if (s.cover)
    return `<div class="poster"><img src="${esc(s.cover)}" alt=""><span class="badge">${esc(s.badge || "")}</span></div>`;
  return `<div class="poster"><div class="ph">${esc(s.title)}</div>${badge}</div>`;
}

function cardHTML(s) {
  const faved = fav[s.id] ? "★" : "☆";
  const sub = (s.tags || []).slice(0, 2).join(" · ");
  return `<div class="card" data-id="${esc(s.id)}">
    ${posterHTML(s)}
    <button class="fav-btn" data-fav="${esc(s.id)}" title="收藏">${faved}</button>
    <div class="meta"><div class="t">${esc(s.title)}</div><div class="s">${esc(sub)}</div></div>
  </div>`;
}

function heroHTML(h) {
  return `<div class="hero">
    ${posterHTML(h)}
    <div class="info">
      <h2>${esc(h.title)}</h2>
      <div>${(h.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <p>${esc(h.description || "")}</p>
      <button class="play" data-play="${esc(h.id)}">▶ 立即播放</button>
    </div>
  </div>`;
}

function pagerHTML(page, pages) {
  if (pages <= 1) return "";
  return `<div class="pager">
    <button data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>上一页</button>
    <span>第 ${page} / ${pages} 页</span>
    <button data-page="${page + 1}" ${page >= pages ? "disabled" : ""}>下一页</button>
  </div>`;
}

function setActiveTab(t) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
}

// ---- 首页 ----
async function renderHome() {
  state.tab = "home"; state.category = "全部"; state.page = 1;
  setActiveTab("home");
  view.innerHTML = `
    <div class="note">教学样本 · 网页版复刻（布局/功能对齐 App）。当前为<b>演示模式</b>：数据来自内置样例；在 <code>web/</code> 目录执行 <code>BRIDGE_BASE_URL=http://&lt;导师授权后端&gt;:端口 npm start</code> 即可接入真实栏目/分类/海报/播放。「分类」为前端演示筛选。</div>
    <div class="section-title">分类</div>
    <div class="chips" id="chips">${CATEGORIES.map((c) => `<span class="chip ${c === state.category ? "active" : ""}" data-cat="${c}">${c}</span>`).join("")}</div>
    <div id="feed"><div class="empty">加载中…</div></div>`;
  $("#chips").onclick = (e) => {
    const t = e.target.closest("[data-cat]");
    if (!t) return;
    state.category = t.dataset.cat; state.page = 1;
    document.querySelectorAll("#chips .chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === state.category));
    renderFeed();
  };
  await renderFeed();
}

async function renderFeed() {
  const feed = $("#feed");
  if (!feed) return;
  feed.innerHTML = `<div class="empty">加载中…</div>`;
  let data;
  try { data = await api.home(state.page); }
  catch (e) { feed.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  let items = (data.items || []).slice();
  if (state.category !== "全部") items = items.filter((s) => (s.tags || []).includes(state.category));
  let html = "";
  if (state.category === "全部" && state.page === 1 && items.length) {
    const h = items.shift();
    html += heroHTML(h);
  }
  if (!items.length) { feed.innerHTML = html + `<div class="empty">该分类暂无内容</div>`; return; }
  html += `<div class="grid">${items.map(cardHTML).join("")}</div>`;
  html += pagerHTML(state.page, data.pages || 1);
  feed.innerHTML = html;
}

// ---- 搜索 ----
async function doSearch(q, page = 1) {
  q = (q || "").trim();
  if (!q) return;
  state.tab = "search"; state.lastQuery = q; state.page = page;
  setActiveTab("search");
  view.innerHTML = `<div class="section-title">“${esc(q)}” 的搜索结果</div><div id="feed"><div class="empty">加载中…</div></div>`;
  const feed = $("#feed");
  let data;
  try { data = await api.search(q, page); }
  catch (e) { feed.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  const items = data.items || [];
  if (!items.length) { feed.innerHTML = `<div class="empty">未找到相关内容</div>`; return; }
  feed.innerHTML = `<div class="grid">${items.map(cardHTML).join("")}</div>` + pagerHTML(page, data.pages || 1);
}

// ---- 我的 ----
function renderMine() {
  state.tab = "mine";
  setActiveTab("mine");
  const favIds = Object.keys(fav);
  const favHTML = favIds.length
    ? `<div class="mine-grid">${favIds.map((id) => { const s = fav[id]; return cardHTML({ id, title: s.title, cover: s.cover, tags: s.tags || [], badge: "" }); }).join("")}</div>`
    : `<div class="mine-empty">还没有收藏，去首页挑一部吧。</div>`;
  const hisHTML = history.length
    ? `<div class="mine-grid">${history.map((h) => cardHTML({ id: h.seriesId, title: h.title, cover: h.cover, tags: [], badge: "" })).join("")}</div>`
    : `<div class="mine-empty">还没有观看记录。</div>`;
  view.innerHTML = `<div class="mine-section"><div class="section-title">我的收藏</div>${favHTML}</div>
    <div class="mine-section"><div class="section-title">观看历史</div>${hisHTML}</div>`;
}

// ---- 详情 ----
async function openDetail(id, opts = {}) {
  const modal = $("#detailModal");
  const body = $("#detailBody");
  body.innerHTML = `<div class="empty">加载中…</div>`;
  modal.classList.remove("hidden");
  let s;
  try { s = await api.series(id); }
  catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  const faved = fav[id] ? "★" : "☆";
  body.innerHTML = `
    <div class="detail-head">
      ${posterHTML(s)}
      <div><h2>${esc(s.title)}</h2>
        <div>${(s.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <p>${esc(s.description || "")}</p>
      </div>
    </div>
    <div class="detail-actions">
      <button id="playFirst">▶ 从第一集播放</button>
      <button class="ghost" id="favToggle">${faved} 收藏</button>
    </div>
    <div class="section-title">选集（${s.episodes.length}）</div>
    <div class="eps">${s.episodes.map((e) => `<div class="ep" data-ep="${esc(e.id)}">${e.number}</div>`).join("")}</div>`;
  $("#playFirst").onclick = () => play(s, s.episodes[0]);
  $("#favToggle").onclick = () => { toggleFav(s); $("#favToggle").textContent = `${fav[s.id] ? "★" : "☆"} 收藏`; };
  body.querySelectorAll("[data-ep]").forEach((el) => (el.onclick = () => play(s, s.episodes.find((e) => e.id === el.dataset.ep))));
  if (opts.autoplay && s.episodes[0]) play(s, s.episodes[0]);
}

function toggleFav(s) {
  if (fav[s.id]) delete fav[s.id];
  else fav[s.id] = { title: s.title, cover: s.cover, tags: s.tags || [] };
  saveFav(fav);
  // 同步卡片上的收藏图标
  document.querySelectorAll(`[data-fav="${CSS.escape(s.id)}"]`).forEach((b) => (b.textContent = fav[s.id] ? "★" : "☆"));
}

// ---- 播放器 + 弹幕 ----
let dmTimer = null;
const DM_MSGS = ["前方高能", "这剧情绝了", "哈哈哈考古", "泪目了", "催更！", "演技在线", "名场面", "又刷一遍", "这集封神", "弹幕护体"];
function startDanmaku() {
  stopDanmaku();
  dmTimer = setInterval(() => {
    if (!$("#dmToggle").checked) return;
    const v = $("#video");
    if (v.paused) return;
    const layer = $("#danmakuLayer");
    const d = document.createElement("div");
    d.className = "danmaku";
    d.textContent = DM_MSGS[Math.floor(Math.random() * DM_MSGS.length)];
    d.style.top = (8 + Math.random() * 70) + "%";
    const dur = 6 + Math.random() * 4;
    d.style.animationDuration = dur + "s";
    layer.appendChild(d);
    setTimeout(() => d.remove(), dur * 1000);
  }, 1200);
}
function stopDanmaku() {
  if (dmTimer) { clearInterval(dmTimer); dmTimer = null; }
  const layer = $("#danmakuLayer"); if (layer) layer.innerHTML = "";
}

function play(series, ep) {
  if (!series || !ep) return;
  const wrap = $("#playerWrap"), v = $("#video"), titleEl = $("#playerTitle");
  wrap.classList.remove("hidden");
  v.src = api.streamUrl(ep.id);
  v.play().catch(() => {});
  titleEl.textContent = `${series.title} · 第${ep.number}集`;
  history = history.filter((h) => !(h.seriesId === series.id && h.epId === ep.id));
  history.unshift({ seriesId: series.id, epId: ep.id, title: `${series.title} 第${ep.number}集`, cover: series.cover, ts: Date.now() });
  saveHis(history);
  startDanmaku();
}

// ---- 事件绑定 ----
document.querySelector(".tabs").addEventListener("click", (e) => {
  const t = e.target.closest(".tab"); if (!t) return;
  if (t.dataset.tab === "home") renderHome();
  else if (t.dataset.tab === "search") doSearchFromBox();
  else if (t.dataset.tab === "mine") renderMine();
});
function doSearchFromBox() { $("#searchInput").focus(); if ($("#searchInput").value.trim()) doSearch($("#searchInput").value); }

$("#searchBtn").onclick = () => { const q = $("#searchInput").value; if (q && q.trim()) doSearch(q); };
$("#searchInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { const q = $("#searchInput").value; if (q && q.trim()) doSearch(q); } });
$("#detailClose").onclick = () => $("#detailModal").classList.add("hidden");
$("#playerClose").onclick = () => { $("#playerWrap").classList.add("hidden"); const v = $("#video"); v.pause(); v.removeAttribute("src"); v.load(); stopDanmaku(); };

// 视图内事件委托
view.addEventListener("click", (e) => {
  const favBtn = e.target.closest("[data-fav]");
  if (favBtn) { e.stopPropagation(); const s = { id: favBtn.dataset.fav }; const card = favBtn.closest(".card"); if (card) { s.title = card.querySelector(".t")?.textContent; } toggleFav(s); return; }
  const playBtn = e.target.closest("[data-play]");
  if (playBtn) { openDetail(playBtn.dataset.play, { autoplay: true }); return; }
  const pageBtn = e.target.closest("[data-page]");
  if (pageBtn && !pageBtn.disabled) { state.page = Number(pageBtn.dataset.page); if (state.tab === "search") doSearch(state.lastQuery, state.page); else renderFeed(); return; }
  const card = e.target.closest(".card");
  if (card && card.dataset.id) openDetail(card.dataset.id);
});

// 启动
renderHome();
