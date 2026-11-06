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

## 1.5 核心原理速览（How it works）

- **站是静态的，AI 是借的**：Next.js 静态站跑 Cloudflare Pages（`next-on-pages` edge runtime），零服务器；站内 AI 助手「团子」不直连任何模型，统一转发主站全局网关 `https://955827.xyz/api/ai-chat`（`scene=blog`），**模型密钥只存在主站**，博客侧 `siteConfig.ts` 只注入人格 System Prompt。
- **音乐 = R2 自托管，不走网易云**：`siteConfig.ts` 的 `localTracks` 内置 45 首私有音源，音频存 R2 桶 `blog-media`、经 `cdn.955827.xyz` 分发（`/music/*.m4a` + `/covers/*.jpg`，缓存一年）；歌词优先读仓库内 `/music/lyrics/*.lrc`（whisper 听写打轴），缺省时 `/api/music/lrc` 回退 lrclib。网易云外链模式已弃用（`cloudMusicIds: []`）。
- **评论等 Waline**：前端 `@waline/client` 已接，后端 `serverURL` 留空时评论区整体不渲染（待评论后端上线后填入 `siteConfig.ts` 生效）。
- **后台 = 线上 `/admin` + 本地控制台**：线上 `/admin` 用 Pages 环境变量 `ADMIN_PASS` 比对（`/api/admin/auth`），管理歌单 / 便签 / 画廊 / 设置；便签与歌单走 D1（绑定 `DB`）。`my-blog-manager/` 是可选的本地写作外壳（Tiptap 编辑器 + 草稿箱）。
- **内容非中枢**：blog 只承载个人随笔 / 作品橱窗；内容分发中枢是 exam（题库/知识卡/面试/教程），变现是 shop——各司其职。

## 2. 功能特性

- Markdown 文章写作（`posts/*.md`），支持 GFM、代码高亮（highlight.js / rehype-highlight）、LaTeX 公式（KaTeX / remark-math）。
- 说说 / 动态（`moments/*.md`）、光影画廊（`photowall` + `data/albums.ts`）、时间线归档（`/timeline`，旧 `/archive` 308 跳转）。
- 项目展示墙（`/projects`）、友链（`/friends`）、关于页（`/about`，含生态兄弟站介绍）。
- 音乐页 `/music`：45 首 R2 自托管曲目 + 封面 + 逐行滚动歌词，支持播放/切歌/歌词跳转；音乐挂件在各页常驻。
- AI 聊天助手「团子」：前端 edge route `/api/chat` 转发到主站 AI 网关，人格由 `siteConfig.aiConfig.systemPrompt` 注入。
- 线上管理后台 `/admin`：Dashboard / Playlist / Notes / Gallery / Settings 五个页签；便签支持增删改（`GET/POST /api/notes` 公开、`PATCH/DELETE` 需 `x-rcj-pass`），Playlist 可维护歌单 ID，Gallery / Settings 管理画廊与站点配置。
- 本地后台控制台（`my-blog-manager/`，可选）：Tiptap 所见即所得编辑器、草稿箱、歌单 / 画廊 / 友链 / 设置管理、全息仪表盘。
- SEO：`metadataBase`、OG/Twitter 卡、`sitemap.ts`、`robots.ts`、JSON-LD、RSS `/feed.xml`。
- 主题：Tailwind 4 流光渐变背景、全局弹幕文案、React Three Fiber 3D 装饰。

## 3. 技术栈

| 类别 | 技术 |
| --- | --- |
| 前端框架 | Next.js 16.2.1（App Router）、React 19.2.4、TypeScript 5 |
| 样式 | Tailwind CSS 4、`@tailwindcss/typography`、Framer Motion |
| 渲染 / 部署 | Cloudflare Pages + `@cloudflare/next-on-pages` 1.13.16（edge runtime） |
| 数据 | Cloudflare D1（绑定 `DB`：便签、歌单 ID、限频） |
| 媒体 | Cloudflare R2（桶 `blog-media`，`cdn.955827.xyz` 分发音频与封面） |
| 内容 | Markdown（gray-matter / unified / remark / rehype）、KaTeX、highlight.js |
| 富文本编辑 | Tiptap v3（本地后台控制台） |
| 评论 | `@waline/client` v3.15（后端待部署，`serverURL` 为空时不渲染） |
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
│   │   │   ├── notes/route.ts      # 便签墙：GET/POST 公开，PATCH/DELETE 需口令
│   │   │   ├── music/{route,stream,ids,img,lrc}/  # 歌单 / 播放 / 歌词
│   │   │   ├── weather/route.ts   # 天气挂件
│   │   │   └── test/route.ts
│   │   ├── feed.xml/  sitemap.ts  robots.ts  layout.tsx
│   ├── components/  lib/     # 通用组件与工具
│   ├── data/                 # albums.ts / friends.ts / projects.ts
│   ├── posts/                # Markdown 文章
│   ├── moments/              # 说说
│   ├── chatters/             # 杂谈 / 长文草稿
│   ├── public/               # 本地图片、封面、歌词（music/lyrics/）、og-image
│   ├── siteConfig.ts         # 全站「控制中心」（标题 / 社交 / AI / 音乐 / Waline）
│   ├── next.config.ts        # /archive → /timeline 重定向等
│   └── package.json          # scripts: dev/build/start/lint/pages:build
├── my-blog-manager/          # 可选的本地写作控制台（Next.js + Python 启动器）
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

### 本地后台控制台（Windows，可选）

```powershell
cd my-blog-manager
.\Start.bat          # 自动检测 Python 3.10+ 与 Node，装好依赖后拉起 pywebview 窗口
```

> 后台也可以直接用线上 `/admin`，无需本地控制台。

### 环境变量 / 绑定（Cloudflare Pages → Settings）

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `ADMIN_PASS` | 环境变量 | 后台口令，服务端 `/api/admin/auth` 校验；不配置则后台返回 503 |
| `DB` | D1 绑定 | 便签 + 歌单 ID + 限频表，页面会懒建表 |
| `AI_GATEWAY_URL` | 环境变量 | 可选，默认 `https://955827.xyz/api/ai-chat`，一般无需覆盖 |
| `NEXT_PUBLIC_MUSIC_R2_URL` | 环境变量 | 可选，音乐地址前缀覆盖（默认走 `siteConfig.localTracks` 的 `cdn.955827.xyz`） |
| `WEATHER_LAT` / `WEATHER_LON` / `WEATHER_CITY` | 环境变量 | 可选，天气挂件坐标，默认北京 |

> 模型 / 渠道密钥**只存在主站 955827.xyz 的 Pages/Workers secrets 里**，本仓库不持有。

### 加歌（R2 自托管）

1. 音频传 R2：`wrangler r2 object put blog-media/music/<slug>.m4a --file <本地文件>`；封面放 `blog-media/covers/<slug>.jpg`。
2. 歌词放 `XHBlogs/public/music/lyrics/<slug>.lrc`（可空，空则 `/api/music/lrc` 走 lrclib）。
3. 在 `siteConfig.ts` 的 `localTracks` 追加一条 `{ id, lrcPath, title, artist, duration, src, cover }`，`id` 用 `local-` 前缀。

### 日常写作流程

1. 本地 `XHBlogs` 写文章 / 改配置，或线上 `/admin` 管便签与歌单；
2. 需要本地所见即所得时用 `my-blog-manager\Start.bat`；
3. push 到 `main`；
4. Cloudflare Pages 自动构建完成后线上刷新。

### 升级上游

双击 `update.bat`（或 `python update.py`）：脚本会 `git fetch origin main` 并按白名单 `git checkout` 覆盖前端 / 控制台核心文件，再 `npm install` 两端依赖、跑 `scripts/checkConfig.mjs` 修补本地 `siteConfig`。

## 6. 当前状态

- **已上线**：<https://blog.955827.xyz>，最近提交见 `git log`（R2 歌单迁移、`/admin` 便签增删改、SEO / 友链 / 项目卡等持续打磨中）。
- **已知问题 / 备注**：
  - Waline 前端已接入，后端 `serverURL` 仍为空——评论区目前整体不渲染；待评论后端部署并把地址填入 `siteConfig.ts` 后生效。
  - 线上 `/admin` 的便签编辑 / 删除依赖 `ADMIN_PASS` 与 D1 绑定 `DB`，二者缺一即返回 503。
  - 网易云外链已弃用；音频全部走 R2，仓库不存音频二进制。
  - 本地 `next-on-pages` 在 Windows 偶发 `spawn npx ENOENT` / `.next` 清理失败，属本机沙箱问题，Cloudflare Linux 构建不受影响。
- **待补充**：Waline 后端上线后的 `serverURL` 真实域名；博客内容更新频率 / 选题规划。

## 7. 参考与链接

- 线上博客：<https://blog.955827.xyz>
- 主站 AI 网关：<https://955827.xyz/api/ai-chat>
- 内容中枢（兄弟站）：<https://exam.955827.xyz>
- 上游项目：<https://github.com/heiehiehi/XinghuisamaBlogs>
- 部署文档：<https://developers.cloudflare.com/pages/> 与 <https://github.com/cloudflare/next-on-pages>
- 许可：[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
