// SPDX-License-Identifier: GPL-3.0-only
// 衍生作品，基于 N3urda/hongguoTV (GPL-3.0) — https://github.com/N3urda/hongguoTV
// 内置演示数据：严格对齐上游 server/ 的 Series / Episode 字段定义。
//   Series: id, title, cover, description, badge, tags
//   Episode: id, number, title
// 仅用于"未接入真实桥接后端"时的 UI 评审；真实内容由导师授权后端提供。
const SAMPLE_MP4 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const TAGS = ["短剧", "都市", "逆袭", "甜宠", "古装", "悬疑", "战神", "神豪", "重生", "豪门", "虐恋", "婆媳"];

const RAW = [
  ["1001", "总裁的隐藏娇妻", "落难千金伪装身份嫁入豪门，却在生日宴上被当众揭穿……", "热播", ["豪门", "甜宠", "逆袭"]],
  ["1002", "重生八零之逆袭人生", "一觉醒来回到1983，她握紧了前世错过的机遇。", "推荐", ["重生", "逆袭", "都市"]],
  ["1003", "战神归来当赘婿", "隐世战神入赘三年，今日亮出身份，全场哗然。", "爆款", ["战神", "豪门", "逆袭"]],
  ["1004", "神豪从签到开始", "绑定神豪系统，每天签到就送一栋楼。", "上新", ["神豪", "都市", "搞笑"]],
  ["1005", "深宫秘爱：冷帝的囚妃", "她本是罪臣之女，却成了他无法放下的执念。", "热播", ["古装", "虐恋", "宫廷"]],
  ["1006", "婆婆来了", "新婚夜，婆婆搬进了主卧，这场战争谁会赢？", "热议", ["婆媳", "都市", "家庭"]],
  ["1007", "侦探日记：消失的证人", "一桩十年悬案，因一个证人重现而重启。", "烧脑", ["悬疑", "都市", "推理"]],
  ["1008", "甜婚密令：大佬轻轻宠", "协议结婚三年，假戏真做，他比谁都认真。", "甜宠", ["甜宠", "豪门", "都市"]],
  ["1009", "逆天改命：我成了首富", "从负债到首富，他只用了三个月。", "逆袭", ["逆袭", "神豪", "都市"]],
  ["1010", "凰权：女帝登基路", "从宫女到女帝，她踩着血与火走上来。", "古装", ["古装", "逆袭", "权谋"]],
  ["1011", "闪婚后老公他不对劲", "闪婚老公温柔体贴，可他手机里的秘密却……", "热播", ["都市", "悬疑", "甜宠"]],
  ["1012", "重生之农门医女", "穿成农门弃女，一手金针救活整村人。", "推荐", ["重生", "古装", "逆袭"]],
  ["1013", "豪门错爱：替身新娘", "她只是替身，却让他动了真心。", "虐恋", ["豪门", "虐恋", "都市"]],
  ["1014", "暗夜枭雄", "白道敬他，黑道怕他，唯独她看穿了他的孤独。", "爆款", ["战神", "都市", "逆袭"]],
  ["1015", "宠冠后宫", "一碗汤药，让她从答应一路宠到贵妃。", "古装", ["古装", "甜宠", "宫廷"]],
  ["1016", "神医下山", "师父说，下山先救三个人，否则不许回来。", "热播", ["都市", "逆袭", "神豪"]],
];

function buildSeries() {
  return RAW.map(([id, title, description, badge, tags]) => ({
    id,
    title,
    cover: null, // 前端以渐变占位渲染，避免外链依赖
    description,
    badge,
    tags,
  }));
}

const SERIES = buildSeries();
const BY_ID = new Map(SERIES.map((s) => [s.id, s]));

function episodesFor(seriesId) {
  const s = BY_ID.get(String(seriesId));
  if (!s) return null;
  const n = 24 + (Number(seriesId) % 7) * 6; // 24~66 集
  const eps = [];
  for (let i = 1; i <= n; i++) {
    eps.push({
      id: `${seriesId}-${i}`,
      number: i,
      title: `第${i}集`,
    });
  }
  return eps;
}

function paginate(items, page, size = 12) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(1, page || 1), pages);
  const start = (p - 1) * size;
  return { items: items.slice(start, start + size), page: p, pages, total };
}

export function demoHandlers(urlPath, urlQuery, req) {
  const u = new URL(urlQuery || "", "http://localhost");
  const page = Number(u.searchParams.get("page") || 1);

  if (urlPath === "/api/home") {
    return { status: 200, body: paginate(SERIES, page) };
  }
  if (urlPath === "/api/search") {
    const q = (u.searchParams.get("q") || "").trim().toLowerCase();
    const hit = !q
      ? SERIES
      : SERIES.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some((t) => t.toLowerCase().includes(q))
        );
    return { status: 200, body: paginate(hit, page) };
  }
  const detail = /^\/api\/series\/(\d{1,30})$/.exec(urlPath);
  if (detail) {
    const s = BY_ID.get(detail[1]);
    if (!s) return { status: 404, body: { error: "剧集不存在" } };
    return { status: 200, body: { ...s, episodes: episodesFor(s.id) } };
  }
  const play = /^\/api\/episodes\/([^/]+)\/(play|stream)$/.exec(urlPath);
  if (play) {
    if (play[2] === "play") {
      return {
        status: 200,
        body: { path: `/api/episodes/${play[1]}/stream`, contentType: "video/mp4" },
      };
    }
    // 演示流：浏览器 <video> 跨域播放 MP4 不需要 CORS，302 到公共样例
    return { redirect: SAMPLE_MP4 };
  }
  return null;
}

export { TAGS };
