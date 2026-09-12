# rcj-blog

我自己的博客 / 记事本，Next.js 写的，跑在 Cloudflare Pages 上。

- 线上：<https://blog.955827.xyz>
- 仓库：<https://github.com/Bortala5827/rcj-blog>（Private）

> **来源与许可**
> Fork 自 [heiehiehi/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)，
> 原作者 **XingHuiSama（[@heiehiehi](https://github.com/heiehiehi)）**，许可 **CC BY-NC 4.0**（署名 + 非商用）。
> 署名与许可原样保留，不做商业用途。

---

## 我改了什么

| 项 | 原作者 | 我这边 |
| --- | --- | --- |
| 部署平台 | Vercel | **Cloudflare Pages**（`@cloudflare/next-on-pages`，git 绑定自动构建） |
| 音乐挂件 | 网易云外链 | **R2 自托管音频**为主，网易云 ID 仍可通过后台导入 |
| 图床 / 封面 | 外链图床 | 本地 `public/` 资源 + 本地 `cover-default.svg` 默认封面 |
| 图片依赖 | README 满屏截图（`picture/`） | **全删**，文档纯文字 |
| 个人定位 | 原作者信息 | `siteConfig.ts` / `about` 改为 RCJ Lab 口径 |
| 友链 | 原作者列表 | 只留自己的 |

其余功能（Markdown 写作、后台控制台、AI 猫猫、评论、说说）沿用原作。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `XHBlogs/` | **Next.js 前端主体**，部署的就是这个目录（Root directory） |
| `my-blog-manager/` | 本地后台控制台（`Start.bat` 启动，Python 环境）⚠️ **不要改这个文件夹名**，改路径解析会崩 |
| `update.py` / `update.bat` | 原作者的无损更新器，保留未改 |
| `LICENSE` | CC BY-NC 4.0 |
| `UpdateLog.md` | 原作者的更新日志 |

## 我的部署参数

Cloudflare Pages → 项目 **`rcj-blog`** → Connect to Git（`Bortala5827/rcj-blog`）：

| 设置项 | 值 |
| --- | --- |
| Production branch | `main` |
| Root directory | `XHBlogs` |
| Build command | `npx --yes next-on-pages` |
| Build output | `.vercel/output/static` |
| 自定义域 | `blog.955827.xyz` |

**push 到 `main` 就会自动重新构建**，不需要手动上传。

## 日常写东西的流程

1. `my-blog-manager/Start.bat` 起本地控制台
2. 写文章 / 改设置 → **暂存到操作队列** → **更新本地** → **同步 Blog**
3. 控制台里 **仅同步源码**（push 到 `main`）
4. Cloudflare Pages 自动构建完成，线上刷新即可

## 后台与音乐

- 后台口令：`199527`（只在当前浏览器会话内有效）——见 `XHBlogs/app/admin/page.tsx`
- 后台可干的事：歌单管理（贴网易云 ID 导入）、光影画廊、系统配置、全息仪表盘
- 音乐播放：`siteConfig.music.source === 'r2'`，走 R2 公开域名 `pub-33cbba9a540847778b48cbc906aea2ad.r2.dev`
- 网易云那两首外链歌：`/api/music/stream?id=X` 只做**瞬时 302** 跳到解析地址（原因见下）

## 踩过的坑（备忘）

- **网易云封了 Cloudflare 边缘 IP**：`music.163.com/song/media/outer/url` 从 CF 请求会被 302 到 `/404`，所以服务端既不能直连也不能流式透传；现在改成路由瞬时 302 到解析 API，音频交给浏览器自己缓冲。
- **别给流式响应加 `Content-Length`**：长度对不上 Cloudflare 会掐断，返回 502 播放失败。
- **AI 猫猫**要线上生效，得在 Pages 的环境变量里放 `GEMINI_API_KEY`。
- 本地 `next-on-pages` 构建在 Windows 下偶发 `spawn npx ENOENT` / `.next` 清理失败，属本机沙箱问题，Cloudflare 的 Linux 构建不受影响。

## 许可

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) —— 可自由学习、分享、二次修改（二次开源需提及原作者），**禁止任何商业用途**。
