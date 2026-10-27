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
├── HGTV_反编译与架构分析报告.md   # 对导师教学样本 APK 的静态分析与合规说明
├── LICENSE                        # GPL-3.0-only 全文
├── NOTICE                         # 署名与版权声明
└── web/                           # 网页版视频站（前端 + Web 适配层）
    └── README.md                  # 网页站运行与接口说明
```

## 功能（对齐 App）
首页推荐 + 海报墙 + 分类筛选 · 详情选集 · MP4 播放 + 弹幕演示 · 搜索 · 我的（收藏/历史）

## 运行
```bash
cd web
npm start                  # 演示模式：返回内置样例数据
BRIDGE_BASE_URL=http://<导师授权后端>:<端口> npm start   # 接入真实内容
```
默认端口 5173，打开 http://127.0.0.1:5173 。

## 许可与署名
- 本仓库以 **GPL-3.0-only** 发布（见 `LICENSE`）。
- 署名与版权见 `NOTICE`。
- 第三方影视内容源的调用授权由指导教师负责，本仓库不涉及内容再分发。
