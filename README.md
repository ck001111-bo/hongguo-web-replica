# 红果TV 网页复刻版（教学 / 逆向分析课程实践）

> 布局与功能对齐原生 Android App 的网页版视频站，作为《移动应用防反编译 / 逆向分析》课程实践成果。
> **衍生作品，基于 [N3urda/hongguoTV](https://github.com/N3urda/hongguoTV)（GPL-3.0）**，同样以 GPL-3.0-only 发布。

## 上游公开源（本课题采用的公开源代码与接口来源）
- 仓库：[N3urda/hongguoTV](https://github.com/N3urda/hongguoTV)
- 许可：GPL-3.0-only（GitHub 公开可访问，807 stars）
- 定位：安卓 TV 红果短剧客户端——项目规划、接口调研与可行性验证
- 本网页版复刻其接口契约（`/api/*`），并补充了上游缺失的 Web 跨域适配层。

## 仓库结构
```
.
├── HGTV_反编译与架构分析报告.md   # 对导师教学样本 APK 的静态分析与合规说明（含 §7.2 播放签名逆向）
├── LICENSE                        # GPL-3.0-only 全文
├── NOTICE                         # 署名与版权声明
├── 剥离陷阱改造方案.md             # 代码级剥离商业 SDK 陷阱方案
├── web/                           # 网页版视频站（前端 + Web 跨域适配层）
│   └── README.md                  # 网页站运行与接口说明
└── bridge/                        # 内容桥接后端（上游 server/ 同源实现，web/ 的真实内容来源）
    └── README.md                  # 桥接后端运行与已知限制说明
```

## 功能（对齐 App）
首页推荐 + 海报墙 + 分类筛选 · 详情选集 · MP4 播放 + 弹幕演示 · 搜索 · 我的（收藏/历史）

## 运行（两件套：先起桥接，再起网页）
```bash
# 1) 内容桥接后端（提供真实栏目/详情/选集；播放签名当前失效，网页端会回退样例）
cd bridge && npm install && node index.mjs        # 监听 127.0.0.1:8787
# 2) 网页站（同源代理到桥接，规避跨域）
cd ../web
BRIDGE_BASE_URL=http://127.0.0.1:8787 npm start   # 接入真实内容
# 或演示模式（无需桥接）：
npm start
```
网页默认端口 5173，打开 http://127.0.0.1:5173 。

> 若本机 `https_proxy` 对上游 API 域名返回 4xx，桥接须直连：`env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY node index.mjs`。

## 许可与署名
- 本仓库以 **GPL-3.0-only** 发布（见 `LICENSE`）。
- 署名与版权见 `NOTICE`。
- 第三方影视内容源的调用授权由指导教师负责，本仓库不涉及内容再分发。
