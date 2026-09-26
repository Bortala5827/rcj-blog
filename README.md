# rcj-blog

RCJ 生态的个人博客 / 记事本（Bortala の宝藏之地），Next.js 静态站部署在 Cloudflare Pages。

## 1. 简介与生态定位

- **对应站点**：<https://blog.955827.xyz>（自定义域，绑定 Cloudflare Pages 项目 `rcj-blog`）。
- **生态角色**：作者 Bortala 的个人博客 / 开发笔记 / 作品橱窗，**不是内容中枢**。RCJ 生态的内容中枢是 [exam.955827.xyz](https://exam.955827.xyz)（题库 + 知识卡 + 面试 + 教程）；本仓库只承载个人随笔、踩坑记录、项目展示与友链，不做题库 / 教程分发。
- **生态联动**：
  - 文章项目墙（`XHBlogs/data/projects.ts`）聚合展示 shop / support / dinner / facetalk / 主站 955827.xyz 等兄弟产品；
  - 站内 AI 助手（「团子」暹罗猫娘）通过主站全局 AI 网关 [`https://955827.xyz/api/ai-chat`](https://955827.xyz/api/ai-chat) 取答复，博客侧不持有任何模型密钥；
  - 评论前端已接入 Waline（`@waline/client`），后端地址在 `siteConfig.ts` 的 `walineConfig.serverURL` 配置，留空时评论区整体不渲染。
- **来源**：Fork 自 [heiehiehi/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)（原作者 XingHuiSama），署名与 **CC BY-NC 4.0** 许可原样保留，**禁止任何商业用途**。

## 2. 功能特性

- Markdown 文章写作（`posts/*.md`），支持 GFM、代码高亮（highlight.js / rehype-highlight）、LaTeX 公式（KaTeX / remark-math）。
- 说说 / 动态（`moments/*.md`）、光影画廊（`photowall` + `data/albums.ts`）、时间线归档（`/timeline`，旧 `/archive` 308 跳转）。
- 项目展示墙（`/projects`）、友链（`/friends`）、关于页（`/about`，含生态兄弟站介绍）。
- AI 聊天助手「团子」：前端 edge route `/api/chat` 转发到主站 AI 网关，人格由 `siteConfig.aiConfig.systemPrompt` 注入。
- 音乐挂件：默认曲「陪在你身边」同源托管于 `XHBlogs/public/soba-ni-iru-ne.webm`；网易云歌单 ID 可在后台导入，`/api/music/stream?id=` 仅做瞬时 302 跳转（网易云封禁 Cloudflare 出口 IP，不能直连）。
- 本地后台控制台（`my-blog-manager/`）：Tiptap 所见即所得编辑器、草稿箱、歌单 / 画廊 / 友链 / 设置管理、全息仪表盘；口令由服务端 `/api/admin/auth` 与 Pages 环境变量 `ADMIN_PASS` 比对。
- SEO：`metadataBase`、OG/Twitter 卡、`sitemap.ts`、`robots.ts`、JSON-LD、RSS `/feed.xml`。
- 主题：Tailwind 4 流光渐变背景、全局弹幕文案、React Three Fiber 3D 装饰。

## 3. 技术栈

| 类别 | 技术 |
| --- | --- |
| 前端框架 | Next.js 16.2.1（App Router）、React 19.2.4、TypeScript 5 |
| 样式 | Tailwind CSS 4、`@tailwindcss/typography`、Framer Motion |
| 渲染 / 部署 | Cloudflare Pages + `@cloudflare/next-on-pages` 1.13.16（edge runtime） |
| 内容 | Markdown（gray-matter / unified / remark / rehype）、KaTeX、highlight.js |
| 富文本编辑 | Tiptap v3（后台控制台） |
| 评论 | `@waline/client` v3.15（后端待部署 / 见 rcj-waline 仓库） |
| 3D / 动效 | three.js、@react-three/fiber、@react-three/drei |
| 本地控制台外壳 | Python 3.10+（FastAPI + Uvicorn + pywebview）作为启动器，前端仍是同一个 Next.js 应用 |
| AI | 不直连模型；统一调用主站 `POST /api/ai-chat`，场景 `scene=blog` |

## 4. 目录结构

```
rcj-blog/
├── XHBlogs/                  # Next.js 前端主体（Cloudflare Pages 的 Root directory）
│   ├── app/                  #   App Router 页面与 API 路由
│   │   ├── about/  admin/  friends/  music/  photowall/
│   │   ├── posts/[slug]/  projects/  timeline/
│   │   ├── api/
│   │   │   ├── chat/route.ts       # → 主站 /api/ai-chat 网关
│   │   │   ├── admin/auth/route.ts # 后台口令校验（对 ADMIN_PASS）
│   │   │   ├── music/{route,stream,ids,img}/  # 音乐相关
│   │   │   ├── weather/route.ts   # 天气挂件
│   │   │   └── test/route.ts
│   │   ├── feed.xml/  sitemap.ts  robots.ts  layout.tsx
│   ├── components/  lib/     # 通用组件与工具
│   ├── data/                 # albums.ts / friends.ts / projects.ts
│   ├── posts/                # Markdown 文章
│   ├── moments/              # 说说
│   ├── chatters/             # 杂谈 / 长文草稿
│   ├── public/               # 本地图片、封面、音乐、og-image
│   ├── siteConfig.ts         # 全站「控制中心」（标题 / 社交 / AI / Waline）
│   ├── next.config.ts        # /archive → /timeline 重定向等
│   └── package.json          # scripts: dev/build/start/lint/pages:build
├── my-blog-manager/          # 本地后台控制台（Next.js + Python 启动器）
│   ├── app/                  #   editor / drafts / settings / admin …
│   ├── cms_core/  context/   #   CMS 核心逻辑
│   ├── launcher.py  run_me.py  Start.bat   # 一键启动入口
│   └── package.json
├── scripts/
│   ├── checkConfig.mjs       # 上游升级后自动修补 siteConfig
│   └── og-generate.ps1       # 本地生成 OG 分享图
├── update.py / update.bat    # 上游无损更新器（git checkout 指定文件清单）
├── UpdateLog.md              # 上游更新日志（只读）
├── LICENSE                   # CC BY-NC 4.0
└── README.md / README_en.md
```

> 注意：`my-blog-manager/` 文件夹名**不要改**——`update.py` 的文件清单与启动脚本都按此路径硬编码，改名会崩。

## 5. 部署与运行

### 线上（Cloudflare Pages，已配置 git 自动构建）

| 设置项 | 值 |
| --- | --- |
| 项目名 | `rcj-blog` |
| Production branch | `main` |
| Root directory | `XHBlogs` |
| Build command | `npx --yes next-on-pages` |
| Build output directory | `.vercel/output/static` |
| 自定义域 | `blog.955827.xyz` |

push 到 `main` 即自动重新构建，无需手动上传。

### 本地开发

```powershell
cd XHBlogs
npm install
npm run dev          # http://localhost:3000
```

本地预演 Cloudflare Pages 产物：

```powershell
cd XHBlogs
npm run pages:build  # = next-on-pages，产物在 .vercel/output/static
```

### 本地后台控制台（Windows）

```powershell
cd my-blog-manager
.\Start.bat          # 自动检测 Python 3.10+ 与 Node，装好依赖后拉起 pywebview 窗口
```

### 环境变量（Cloudflare Pages → Settings → Environment variables）

| 变量 | 说明 |
| --- | --- |
| `ADMIN_PASS` | 后台口令，服务端 `/api/admin/auth` 校验；不配置则后台返回 503 |
| `AI_GATEWAY_URL` | 可选，默认 `https://955827.xyz/api/ai-chat`，一般无需覆盖 |
| `NEXT_PUBLIC_MUSIC_R2_URL` | 可选，把默认音乐切回 R2 直链；不设则用同源 `/soba-ni-iru-ne.webm` |
| `WEATHER_LAT` / `WEATHER_LON` / `WEATHER_CITY` | 可选，天气挂件坐标，默认北京 |

> 模型 / 渠道密钥**只存在主站 955827.xyz 的 Pages/Workers secrets 里**，本仓库不持有。

### 日常写作流程

1. `my-blog-manager\Start.bat` 起本地控制台；
2. 写文章 / 改设置 → 暂存到操作队列 → 更新本地 → 同步 Blog；
3. 控制台里「仅同步源码」push 到 `main`；
4. Cloudflare Pages 自动构建完成后线上刷新。

### 升级上游

双击 `update.bat`（或 `python update.py`）：脚本会 `git fetch origin main` 并按白名单 `git checkout` 覆盖前端 / 控制台核心文件，再 `npm install` 两端依赖、跑 `scripts/checkConfig.mjs` 修补本地 `siteConfig`。

## 6. 当前状态

- **已上线**：<https://blog.955827.xyz>，最近提交见 `git log`（SEO / 友链 / 项目卡 / Waline 迁移等持续打磨中）。
- **已知问题 / 备注**：
  - Waline 前端已接入，后端 `serverURL` 仍为空——评论区目前整体不渲染；待 rcj-waline 部署并把地址填入 `siteConfig.ts` 后生效。
  - 工作区有未提交改动（`layout.tsx`、`next.config.ts`、`siteConfig.ts`、`posts/first.md` 等）与未跟踪文件（`scripts/og-generate.ps1`、`public/og-image.png`、`app/feed.xml/`），属于在写状态，非 bug。
  - 本地 `next-on-pages` 在 Windows 偶发 `spawn npx ENOENT` / `.next` 清理失败，属本机沙箱问题，Cloudflare Linux 构建不受影响。
  - 网易云外链被 Cloudflare 出口 IP 封禁，音乐路由只能做瞬时 302，不能服务端流式。
- **待补充**：Waline 后端上线后的 `serverURL` 真实域名；博客内容更新频率 / 选题规划。

## 7. 参考与链接

- 线上博客：<https://blog.955827.xyz>
- 主站 AI 网关：<https://955827.xyz/api/ai-chat>
- 内容中枢（兄弟站）：<https://exam.955827.xyz>
- 上游项目：<https://github.com/heiehiehi/XinghuisamaBlogs>
- 部署文档：<https://developers.cloudflare.com/pages/> 与 <https://github.com/cloudflare/next-on-pages>
- 许可：[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
