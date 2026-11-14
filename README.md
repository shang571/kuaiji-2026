# 基础会计学 · 会计与财务管理基础

26 章交互式学习页，覆盖会计学原理与财务管理两条主线。

- **在线访问**：https://shang571.github.io/kuaiji-2026/ （公开版，无登录门禁）
- **离线版本**：本地单文件母版 `基础会计学_课件对齐版.html`（约 950 KB，插图 base64 内嵌，双击即开；离线版不含登录门禁，仅自用）

---

## 内容

### 章节（26 章）

| 卷 | 主题 | 章数 |
|---|---|---|
| 一 | 会计总论 | 会计概念 / 对象 / 要素 / 基本前提 / 信息质量要求 |
| 二 | 核算方法 | 会计科目与账户 / 复式记账 / 凭证 / 账簿 / 财产清查 |
| 三 | 主要经济业务核算 | 筹资 / 采购 / 生产 / 销售 / 利润形成与分配 |
| 四 | 财务报告 | 资产负债表 / 利润表 / 现金流量表 / 附注 / 列报要求 |
| 五 | 财务管理 | 资本成本与杠杆 / 资本预算 / 报表分析 / 筹资 / 股利 |
| 六 | 备考 | 真题全解 / 题库 / 公式速查 / 易错点 |

其中第 15 章「润叶家具：一笔订单走完全流程」为综合案例，串联采购 → 入库 → 领料 → 人工 → 制造费用 → 入库 → 销售全链条。

### 学习工具

- **24251 真题全解** — 10 道单选 + 6 道简答 + 3 道计算，含完整步骤与答案
- **题库** — 56 题，按卷与题型筛选，点选即判、附解析
- **公式速查** — 44 条公式、18 组分录模板、20 个易错点、42 条符号与英文缩写对照
- **知识点网络** — 95 个知识点、113 条关联
  - **2D**：双环放射圆，全部知识点上环，标签沿半径朝外，点选显示关联
  - **3D**：椭球云团布局，可拖拽旋转（带惯性）、选中自动转向、星空空间感
- **说明插图** — 7 张矢量示意图 + 3 张 AI 水彩插画

## 项目结构

线上为多文件结构，本地母版为单文件：

```
index.html          骨架 + loader + 登录门禁 DOM
app.css             全站样式（含门禁样式）
app.js              交互 / 图表 / 题库 / 知识图谱
auth.js             微信扫码登录门禁（WorkBuddy 云服务）
chapters/
  vol1.js  vol2.js  vol3.js  vol4.js  vol5.js  vol6.js    按卷切分的章节 HTML
assets/
  fig-01.jpg  fig-02.jpg  fig-03.jpg                      AI 插画
```

`chapters/volN.js` 各自导出 `window.__CH_VOLN`，由 `index.html` 的 `window.__bootStudyApp()` 用 `DocumentFragment` 在原位插入；该函数由 `auth.js` 在鉴权通过后调用一次，所以未登录时章节不会进入 DOM。

## 登录门禁

进入站点前需要微信扫码登录（WorkBuddy 云服务 · 微信网站授权）。

- SDK 走 CDN：`@tencent-ai/workbuddy-cloud-sdk`，全局 `WorkBuddyCloud`，无构建步骤
- 配置写在 `auth.js` 顶部：`endpoint` / `publishableKey` / `oauthRelayBaseUrl`（三者缺一不可，微信授权依赖 `oauthRelayBaseUrl`）
- 流程：启动时先处理 URL 上的 `code/state/provider` 回调 → `handleWechatWebCallback()` 换会话 → 成功则清掉这三个参数并进入站点；否则 `getSession()` 恢复会话，无会话显示登录卡
- `redirectTo` 只能是站点根（`location.origin`）：静态托管下回调落到子路径会先 404，code 会丢
- 退出登录调用 `signOut()`，`onAuthStateChange` 的 `SIGNED_OUT` 会重新盖上门禁
- 本地 `file://` 打开无法完成微信授权（平台边界，不做 mock 降级）

## 技术要点

**零构建** — 无框架、无打包器。全部图表由 Canvas 2D 手绘，知识图谱为自研力导向 + 环形布局。唯一外部脚本是登录用的云服务 SDK（CDN 引入，不参与构建）。

**图表响应式** — `prep()` 测宽读父容器并扣除 padding，canvas 宽度完全由 JS 内联控制。设 `MINW = 620` 作为可读性下限：窄屏宁可横向滑动，也不把字号压到 5px。`.cv-scroll` 包裹层保证图注不被 `scrollLeft` 推走。

**无痕设计** — 学习痕迹不落盘：题库作答、错题、背诵勾选只存内存，刷新即清空。唯一的持久化数据是云 SDK 自己维护的登录会话。

**旧内核兼容** — 避免 `inset`、CSS Grid、`padStart`、`clamp()` 等较新特性（门禁样式同样用 top/right/bottom/left 定位），改用 flex + 手写补零，以适配微信内置浏览器。

## 本地开发

母版是单文件 `基础会计学_课件对齐版.html`，改完后需拆分再推：

```bash
# 1. 改母版（单文件，含 base64 插图）
# 2. 拆分到部署目录
python _split.py
# 3. 同步到 .deploy/changshi/
python _sync_master.py
# 4. 推送
cd .deploy/changshi && git add -A && git commit -m "..." && git push origin main
```

Pages 约 40 秒后自动重建。

> **注意**：任何按章节下标分发的逻辑（`drawFor`、`BANK.ch`、`NODES.ch`）在插入新章节后必须整体核对。2026-10-31 曾因插章后 `drawFor` 下标未跟上，导致财务各章图表画到空 canvas。

## 授权

代码以 [MIT License](LICENSE) 发布。课件、真题等原始教学资料版权归原作者所有，本仓库仅作个人复习用途，未包含原始 PDF/PPTX。
