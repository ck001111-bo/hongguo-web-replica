// SPDX-License-Identifier: GPL-3.0-only
// 衍生作品，基于 N3urda/hongguoTV (GPL-3.0) — https://github.com/N3urda/hongguoTV
// Web 端适配层（上游 API 文档明确指出："当前没有浏览器跨域白名单配置，因此 Web 端需额外适配"）
// 本服务做两件事：
//   1) 托管静态前端（index.html / app.js / style.css ...）
//   2) 将 /api/* 与 /health 代理到真实桥接后端 BRIDGE_BASE_URL，
//      从而让浏览器始终同源访问、绕开跨域；当后端未配置或不可达时回退到内置演示数据。
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { demoHandlers } from "./demo-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const BRIDGE_BASE_URL = (process.env.BRIDGE_BASE_URL || "").replace(/\/$/, "");
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || "";
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

// 代理到真实桥接后端（透传 method / Range / Authorization）
async function proxyToBridge(req, res, urlPath, urlQuery) {
  const target = `${BRIDGE_BASE_URL}${urlPath}${urlQuery}`;
  const headers = {};
  if (req.headers.range) headers["range"] = req.headers.range;
  if (BRIDGE_TOKEN) headers["authorization"] = `Bearer ${BRIDGE_TOKEN}`;
  const upstream = http.request(
    target,
    { method: req.method, headers },
    (upRes) => {
      res.writeHead(upRes.statusCode || 502, upRes.headers);
      upRes.pipe(res);
    }
  );
  upstream.on("error", () => {
    // 后端不可达：JSON 接口回退演示数据；流接口回退公共样例
    if (urlPath.startsWith("/api/episodes/") && urlPath.endsWith("/stream")) {
      // 浏览器 <video> 播放跨域 MP4 不需要 CORS，直接 302 到公共样例
      res.writeHead(302, {
        Location:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      });
      return res.end();
    }
    try {
      const out = demoHandlers(urlPath, urlQuery, req);
      if (out) return sendJson(res, out.status, out.body);
    } catch {}
    sendJson(res, 502, { error: "内容源暂不可用，且本地演示数据无法覆盖该请求" });
  });
  req.pipe(upstream);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const p = url.pathname;

  // 1) API / 健康检查
  if (p === "/health" || p.startsWith("/api/")) {
    if (BRIDGE_BASE_URL) return proxyToBridge(req, res, p, url.search);
    // 无后端：演示模式
    if (p === "/health")
      return sendJson(res, 200, {
        service: "hongguotv-web",
        version: "0.1.0",
        apiVersion: 1,
        upstream: "demo",
        note: "演示模式：未配置 BRIDGE_BASE_URL，返回内置样例数据。",
      });
    try {
      const out = demoHandlers(p, url.search, req);
      if (out && out.redirect)
        return (res.writeHead(302, { Location: out.redirect }), res.end());
      if (out) return sendJson(res, out.status, out.body);
    } catch (e) {
      return sendJson(res, 500, { error: String(e && e.message) });
    }
    return sendJson(res, 404, { error: "接口不存在" });
  }

  // 2) 静态文件
  let rel = decodeURIComponent(p);
  if (rel === "/") rel = "/index.html";
  const filePath = path.join(ROOT, path.normalize(rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) throw new Error("is dir");
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`红果TV Web 端：http://${HOST}:${PORT}`);
  if (BRIDGE_BASE_URL)
    console.log(`已接入桥接后端：${BRIDGE_BASE_URL}${BRIDGE_TOKEN ? "（含访问口令）" : ""}`);
  else
    console.log("演示模式：未配置 BRIDGE_BASE_URL，正在返回内置样例数据。");
  console.log("接入真实后端：BRIDGE_BASE_URL=http://<后端地址>:<端口> npm start");
});
