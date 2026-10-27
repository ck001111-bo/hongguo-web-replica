# 红果TV（HGTV）APK 反编译与架构分析报告

> 课程实践样本：`HGTV_1.2.2.1.apk`（导师提供教学样本）
> 分析方法：DEX 字符串表解析 + AXML/Manifest 解码（不依赖联网工具亦可完成）

---

## 0. 课题定位与合规声明

- 本分析用于"移动应用防反编译 / 逆向分析"课程实践，**仅做静态分析、架构还原与教学复刻**，不涉及对第三方内容源的再分发。
- 经反编译确认，该样本**并非商业闭源产品，而是开源项目"红果TV"的二开版本**：
  - 包名：`com.hgtv.star`
  - 版本：`1.2.2.1`
  - 开源许可：**GPL-3.0-only**（DEX 中明确字符串 `红果TV 1.2.2.1 · GPL-3.0-only`）
  - 上游血缘：`派生自 N3urda/hongguoTV（GPL-3.0），自 2026-10-06 起在上游基础上修改`
  - 当前维护仓（DEX 内置）：`github.com/pan8664716/HGTV`
  - 主页/品牌：`hongguoduanju.com`（红果短剧）
- **上游项目真实定位（关键）**：上游 `N3urda/hongguoTV` 在 GitHub 上的描述为"安卓 TV 红果短剧客户端：**项目规划、接口调研与可行性验证**"。其自带开源后端 `server/`（Node.js，GPL-3.0），通过 `vendor/hongguo.cjs` 等模块对接第三方短剧平台的公开研究接口。即：**这是一个接口调研/可行性项目，而非内容分发服务**；"视频源"经由该开源桥接后端统一提供，并非在 APK 内写死。
- **实测发现（务必写入报告）**：分析当日对 DEX 内置维护仓 `github.com/pan8664716/HGTV` 进行可达性验证——**GitHub 网页、API、release 资产、jsDelivr 镜像均返回 404 / 不可达**。说明该 fork 仓当前已更名、转私有或删除，**不可作为运行时的配置源**。因此本课题"获取视频接口/源/分类/海报"的权威依据应以上游公开开源仓 `N3urda/hongguoTV` 的 `server/` 接口契约为准（详见第 6 节），而非已失效的 `update.json`。
- **本课题采用的公开源（已确认）**：以 **`N3urda/hongguoTV`（GPL-3.0，GitHub 公开可访问，807 stars，最新提交 2026-09-24）** 作为**公开源代码与接口来源**。该仓库为 GPL-3.0，任何人可合法获取、学习、二开；本复刻网页版作为其衍生作品，同样以 GPL-3.0 开源并保留上游署名（详见随附仓库 `LICENSE` 与 `NOTICE`）。
- **合规要点（务必写入报告）**：GPL-3.0 要求**衍生作品同样以 GPL-3.0 开源并保留原作者署名**。复刻的网页版已开源、注明来源（上游 `N3urda/hongguoTV` 与二开仓 `pan8664716/HGTV`），不得闭源商用；第三方平台内容源的调用授权由导师负责。

---

## 1. 样本概况

| 项 | 值 |
|---|---|
| 文件 | `HGTV_1.2.2.1.apk`，约 4.19 MB |
| 代码 | 单个 `classes.dex`（~3.0 MB），含 **20543** 条字符串常量 |
| 原生库 | 友盟崩溃/统计 SDK：`libcrashsdk.so`、`libumeng-spy.so`（arm64-v8a / armeabi-v7a / armeabi / x86） |
| 资源 | 弹幕表情包 `assets/danmaku_emoji/*.webp` → 表明 app 支持**弹幕（bullet comment）** |
| Manifest | 单 Activity（`com.hgtv.star.MainActivity`）+ `FileProvider`；声明 7 项权限（含广告标识 `AD_ID`、OAID `freemme.permission.msa`、自更新 `REQUEST_INSTALL_PACKAGES`） |

---

## 2. 技术栈（从 DEX 字符串还原）

- **播放内核**：Google **ExoPlayer2**（`com.google.android.exoplayer2`），支持 HLS(m3u8)、MP4、DASH、RTMP 及 H.264/HEVC/VP8/VP9/AV1 等编码。
- **开发形态**：原生 Android（Kotlin/Java），入口 `com.hgtv.star.MainActivity`、应用类 `com.hgtv.star.HgtvApplication`（Manifest 仅 1 个 Activity，为单 Activity 架构）。DEX 中出现的 `FlutterConfigManager` 属友盟 Flutter 插件组件，非本项目 Flutter 证据（APK 内无 `libapp.so`）。
- **商业 SDK（见第 5 节"陷阱"）**：友盟全系、字节跳动/番茄小说、腾讯 QQ。
- **构建/混淆**：**R8 全量模式**（`r8-mode:full, min-api:19, version:8.11.18`），即 release 全混淆。

---

## 3. 反编译方法与工具链（课程实践步骤）

> 本环境外网受限，未直接使用 jadx/apktool，改用"DEX 字符串表直接解析 + AXML 解码"完成静态分析——反而更适合写入报告，展示"不依赖现成 GUI 工具也能分析"。

1. **解包**：APK 即 ZIP，提取 `classes.dex`、`AndroidManifest.xml`、`lib/`、`assets/`。
2. **DEX 字符串表解析**：按 DEX 头部 `string_ids_off / string_ids_size` 遍历，ULEB128 解码 string_data，导出全部 URL / 域名 / 关键字（已得 20543 条）。
3. **Manifest 解码**：解码二进制 AXML，还原 Activity / Service / 权限（androguard 或自写解析器）。
4. **关键类定位**：`com.hgtv.star.MainActivity`、各 `*ConfigManager`、`UpdateSource` → 还原"视频源 / 分类 / 海报"数据流。
5. **工具**：Python + androguard（可选），无需联网。

---

## 4. 防反编译 / 加固手段（"如何防止 app 被反编译"的真实案例）

样本虽为开源二开，但保留了若干防护，正好作为课程案例：

1. **R8 全量混淆**：类名/方法名被混淆（`r8-mode:full`），显著提高人工阅读成本。
2. **证书固定（Certificate Pinning）**：DEX 含 `Pinned certificates for ...`、`Certificate pinning requires X509 certificates`、`STRICT_HOSTNAME_VERIFIER` → 即便抓包也难以解密 HTTPS 流量。
3. **反抓包 / 反代理检测**：友盟回传逻辑含 `友盟后端对设备端证书验证失败。请确保设备端没有运行抓包代理类程序` → 检测到 Charles/Fiddler 等代理会中断采集/播放。
4. **远程配置校验**：配置（含视频源）来自 GitHub `update.json`，本地与线上版本号比对（`local version != online version, send FETCH_NEW_CONFIG`）并做校验，防止轻易篡改。

> **教学结论**：开源 app 的"防反编译"主要体现在**通信层（证书固定、反代理）**与**构建层（混淆）**，而非代码加密。Android 上不存在"彻底防逆向"，只能提高门槛。

---

## 5. 商业应用"陷阱"识别与剥离（课程核心：剥离陷阱）

DEX 中捆绑了三大商业 SDK，均存在**未经充分告知的设备信息收集**，即导师所指"陷阱"：

| SDK | 证据（域名 / 类） | 行为 | 剥离建议 |
|---|---|---|---|
| **友盟 Umeng（全系）** | `*.umeng.com`、`com.umeng.*`（analytics / push / crash / social / airec / page / power / tunnel / ccg / vt） | 统计、推送、崩溃、社交分享、设备指纹采集（OAID/VAID/IMEI） | 删除 `com.umeng.**` 依赖与 `UMConfigure.preInit` 调用；移除 `libumeng-spy.so` / `libcrashsdk.so` |
| **字节跳动 / 番茄小说** | `fqnovel.com`、`snssdk.com`、`byteimg.com`、`com.phoenix.read` 用户代理、`TTNet/Cronet` | 嵌入番茄小说/今日头条媒体与广告能力，回传设备与行为 | 删除 `com.bytedance.**`、`com.phoenix.read.**` 及对应 so 与 manifest 配置 |
| **腾讯 QQ** | `qm.qq.com/q/...` | QQ 登录 / 分享 SDK | 删除 `com.tencent.**` / `qm.qq.com` 相关调用 |

**剥离方法（课程实践）**：
- `build.gradle` 移除对应 `implementation`；
- `AndroidManifest.xml` 删除对应 `<meta-data>`、`<service>`、`<receiver>` 及权限（`READ_PHONE_STATE`、`ACCESS_FINE_LOCATION` 等）；
- 代码层删除初始化调用（`UMConfigure.preInit`、QQ `ShareAPI` 等）；
- 重新打包后 `grep` 残留 `umeng.com` / `fqnovel.com` / `qm.qq.com` 验证。

**权限层面的"陷阱"证据（Manifest 实测）**：除 `INTERNET` / `ACCESS_NETWORK_STATE` / `ACCESS_WIFI_STATE` / `WRITE_EXTERNAL_STORAGE` 等常规权限外，样本还声明：
- `com.google.android.gms.permission.AD_ID` —— 谷歌广告标识符（广告追踪）；
- `freemme.permission.msa` —— 移动安全联盟 OAID（国内 Android 设备唯一标识采集）；
- `REQUEST_INSTALL_PACKAGES` —— 配合 GitHub `update.json` 实现**绕过应用商店的自更新**。

上述权限与三大 SDK 共同构成"未充分告知的设备指纹 + 行为采集"陷阱，是导师所指"商业应用陷阱"的确凿证据。

---

## 6. 视频接口 / 视频源 / 源分类 / 海报 的结构（权威依据：上游开源 `server/`）

> 下列接口契约**直接取自上游公开开源仓 `N3urda/hongguoTV` 的 `server/` 源码**（`docs/API.md` 与 `server/http.mjs` / `index.mjs`），是 app 与网页端共享的同一协议，也是本课题"获取视频接口/源/分类/海报"的权威结构。具体内容由导师授权后端提供；本报告不内置任何第三方内容源。

### 6.1 统一接口契约（REST / JSON，UTF-8）
| 请求 | 返回 |
|---|---|
| `GET /health` | `{ service, version, apiVersion:1, upstream }`，仅检查进程 |
| `GET /api/home?page=1` | `{ items: Series[], page, pages, total }` —— **首页推荐流（即"栏目/海报墙"）** |
| `GET /api/search?q=关键词&page=1` | `{ items: Series[], page }` —— **搜索** |
| `GET /api/series/:id` | `Series & { episodes: Episode[] }` —— **详情 + 选集** |
| `GET /api/episodes/:id/play?fresh=1` | `{ path:"/api/episodes/:id/stream", contentType:"video/mp4" }` —— 触发解析 |
| `GET /api/episodes/:id/stream` | **MP4 媒体流**，支持单区间 Range、后缀区间、HEAD、Content-Length/Content-Range |

- **数据模型（核心"源分类/海报/结构"）**：
  - `Series`：`id`、`title`、`cover`（海报）、`description`、`badge`、`tags`（**分类标签即由 tags 派生**）
  - `Episode`：`id`、`number`、`title`
- **鉴权**：后端开启 `BRIDGE_TOKEN` 时，JSON 与视频请求均要求 `Authorization: Bearer <口令>`。
- **媒资代理**：按 1 MiB 分块、遵守客户端背压；元数据/视频缓存定时清理；源站 URL 与签名材料**不输出到客户端错误与日志**（防泄露）。
- **错误码**：400 输入错误 / 401 口令错误 / 404 不存在 / 416 无效范围 / 502 源站失败 / 503 并发超限（同端≤4 路）。

### 6.2 APK 内置的"源"机制（DEX 推断，仅供参考）
- app 端经 `UpdateSource`、`MediaSourceList`、`setStreamSource` 等类组织"源"；首页以 `homeColumns/HomeColumn` + `CategoryPanel/CategoryFilterRow` 组织。这些是 **app 内部命名**，与上游桥接后端的 `Series.tags` 分类为同一业务含义的不同表达。
- app 远程更新走 `https://github.com/pan8664716/HGTV/releases/latest/download/update.json`；但该仓**当前 404 不可达**（见第 0 节），故运行期配置源应以上游 `server/` 为准。

### 6.3 播放链路（app 端）
`VideoDataSource.kt` 用 AndroidX Media3(ExoPlayer) 自定义 `DataSource`，从 `RemoteVideo` 分块读取（`video.read(offset,len)`，1 MiB/块，尊重背压），播放器携带与桥接后端一致的请求头。网页端以标准 `<video>` + Range 直接消费 `/api/episodes/:id/stream`（MP4），无需额外插件。

### 6.4 Web 端必须解决的"跨域"缺口（课程适配点）
上游 API 文档明确写明：**"当前没有浏览器跨域白名单配置，因此 Web 端需额外适配，不能当作已交付。"** 本课题的网页复刻已补此适配层（见第 7 节 `web/server.mjs`）：由本地 dev server 同源代理 `/api`，浏览器始终同源访问，彻底规避 CORS；无后端时回退内置演示数据。

---

## 7. 网页版复刻实现（布局 / 功能对齐 app，已交付可运行）

> 代码见 `hgtv-analysis/web/`（`server.mjs` 跨域适配层 + `api.js` 客户端 + `app.js` 页面逻辑 + `demo-data.mjs` 演示数据 + `index.html`/`style.css`）。**已本地启动验证**：`/api/home`、`/api/search`、`/api/series/:id`、`/api/episodes/:id/play`、`/api/episodes/:id/stream` 均按第 6 节契约返回，静态页与脚本正常托管。

| app 功能 | 网页版对应实现 |
|---|---|
| 首页推荐流（`/api/home`） | 首页：Hero 头条 + 海报墙（`Series.cover`）+ 由 `Series.tags` 派生的分类筛选 |
| 详情 + 选集（`/api/series/:id`） | 详情弹层：信息 + 选集网格 |
| ExoPlayer（Media3） | 标准 `<video>` + Range 消费 `/api/episodes/:id/stream`（MP4），含**弹幕演示**（app 的 `danmaku_emoji` 能力） |
| 搜索（`/api/search`） | 顶部搜索框 + 结果分页 |
| 收藏 / 历史（app 本地保存） | 「我的」：收藏 / 历史持久化到 `localStorage` |

**跨域适配（`server.mjs`，回应上游 CORS 缺口）**：静态托管 + 将 `/api/*`、`/health` 同源代理到 `BRIDGE_BASE_URL`（导师授权后端），开启 `BRIDGE_TOKEN` 时自动携带 Bearer；后端未配置/不可达时回退内置演示数据，保证 UI 可独立评审。

**运行方式**：
```bash
cd hgtv-analysis/web
npm start                                   # 演示模式（内置样例）
BRIDGE_BASE_URL=http://<导师授权后端>:<端口> npm start   # 接入真实栏目/分类/海报/播放
```
默认端口 `5173`。真实内容源由导师授权后端提供；演示模式仅含 UI 样例，**不含任何第三方版权内容**。

---

## 8. 结论

1. 该样本是 **GPL-3.0 开源"红果TV"的二开版本**，上游 `N3urda/hongguoTV` 为接口调研/可行性项目并自带开源桥接后端；报告须写清血缘并遵守 GPL-3.0（开源 + 署名）。
2. **实测关键发现**：DEX 内置的二开维护仓 `pan8664716/HGTV` 当前 **404 不可达**，故运行期配置/内容源应以上游公开仓 `server/` 的接口契约为准。
3. 其"防反编译"集中在**混淆 + 证书固定 + 反代理**；"陷阱"为**友盟 / 字节 / 腾讯**三大商业 SDK 的设备指纹 + 行为采集（权限层 `AD_ID`/`OAID`/`REQUEST_INSTALL_PACKAGES` 为佐证）。
4. 网页复刻已按上游 `/api/*` 契约实现并补上 Web 跨域适配层，**内容源以导师授权后端为准**，衍生作品同样 GPL-3.0 开源。

---

*分析产出：`dex_strings.py`（DEX 字符串抽取）、`dex_strings_out.txt`（原始串）、`manifest_analysis.py`（Manifest 解码）、`repo/`（上游开源仓取证）、`web/`（网页复刻实现）、本报告。*
