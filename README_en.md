# rcj-blog

Personal blog / notebook of the RCJ ecosystem ("Bortala の宝藏之地"). A Next.js static site deployed on Cloudflare Pages.

## 1. Overview & ecosystem role

- **Live site**: <https://blog.955827.xyz> (custom domain bound to the Cloudflare Pages project `rcj-blog`).
- **Role in RCJ**: Bortala's personal blog, dev notes and project showcase. It is **not** the content hub — that is [exam.955827.xyz](https://exam.955827.xyz) (question banks + knowledge cards + interviews + tutorials). This repo only hosts personal essays, post-mortems, project cards and friend links; no question-bank or tutorial distribution here.
- **Ecosystem links**:
  - The project wall (`XHBlogs/data/projects.ts`) surfaces sibling products: shop / support / dinner / facetalk / the main site 955827.xyz.
  - The in-site AI assistant ("Tuanzi", a tsundere Siamese-cat persona) calls the main-site gateway [`https://955827.xyz/api/ai-chat`](https://955827.xyz/api/ai-chat). The blog holds **no** model API keys.
  - Comments already wire up Waline on the client (`@waline/client`). The backend URL is configured via `walineConfig.serverURL` in `siteConfig.ts`; when empty, the comment block is not rendered at all.
- **Origin**: Forked from [heiehiehi/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) by **XingHuiSama**, kept under **CC BY-NC 4.0** (attribution + non-commercial). No commercial use.

## 2. Features

- Markdown posts (`posts/*.md`) with GFM, code highlighting (highlight.js / rehype-highlight) and LaTeX math (KaTeX / remark-math).
- Moments / short updates (`moments/*.md`), photo wall (`photowall` + `data/albums.ts`), timeline archive (`/timeline`; old `/archive` 308-redirects).
- Project showcase (`/projects`), friend links (`/friends`), about page (`/about`, introducing sibling sites).
- AI chat assistant "Tuanzi": edge route `/api/chat` forwards to the main-site AI gateway; persona injected via `siteConfig.aiConfig.systemPrompt`.
- Music widget: default track "陪在你身边" served same-origin from `XHBlogs/public/soba-ni-iru-ne.webm`. NetEase playlist IDs can still be imported from the admin panel; `/api/music/stream?id=` only issues an instant 302 (NetEase blocks Cloudflare egress IPs, so server-side streaming is impossible).
- Local admin console (`my-blog-manager/`): Tiptap WYSIWYG editor, drafts, playlist / gallery / friend-link / settings management, dashboard. Passcode is verified server-side at `/api/admin/auth` against the Pages env var `ADMIN_PASS`.
- SEO: `metadataBase`, OG/Twitter cards, `sitemap.ts`, `robots.ts`, JSON-LD, RSS `/feed.xml`.
- Theming: Tailwind 4 gradient background, global danmaku quotes, React Three Fiber 3D decor.

## 3. Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16.2.1 (App Router), React 19.2.4, TypeScript 5 |
| Styling | Tailwind CSS 4, `@tailwindcss/typography`, Framer Motion |
| Render / deploy | Cloudflare Pages + `@cloudflare/next-on-pages` 1.13.16 (edge runtime) |
| Content | Markdown (gray-matter / unified / remark / rehype), KaTeX, highlight.js |
| Rich text | Tiptap v3 (admin console) |
| Comments | `@waline/client` v3.15 (backend pending; see rcj-waline repo) |
| 3D / motion | three.js, @react-three/fiber, @react-three/drei |
| Console shell | Python 3.10+ (FastAPI + Uvicorn + pywebview) as launcher; the UI itself is still the same Next.js app |
| AI | No direct model calls; always via the main-site gateway `POST /api/ai-chat`, scene `blog` |

## 4. Repository layout

```
rcj-blog/
├── XHBlogs/                  # The Next.js app (Cloudflare Pages root directory)
│   ├── app/                  #   App Router pages & API routes
│   │   ├── about/  admin/  friends/  music/  photowall/
│   │   ├── posts/[slug]/  projects/  timeline/
│   │   ├── api/
│   │   │   ├── chat/route.ts       # → main-site /api/ai-chat gateway
│   │   │   ├── admin/auth/route.ts # passcode check against ADMIN_PASS
│   │   │   ├── music/{route,stream,ids,img}/
│   │   │   ├── weather/route.ts
│   │   │   └── test/route.ts
│   │   ├── feed.xml/  sitemap.ts  robots.ts  layout.tsx
│   ├── components/  lib/
│   ├── data/                 # albums.ts / friends.ts / projects.ts
│   ├── posts/                # Markdown posts
│   ├── moments/              # Short updates
│   ├── chatters/             # Long-form notes / drafts
│   ├── public/               # Local images, cover art, music, og-image
│   ├── siteConfig.ts         # Single source of truth (title / social / AI / Waline)
│   ├── next.config.ts        # /archive → /timeline redirect etc.
│   └── package.json          # scripts: dev/build/start/lint/pages:build
├── my-blog-manager/          # Local admin console (Next.js + Python launcher)
│   ├── app/                  #   editor / drafts / settings / admin …
│   ├── cms_core/  context/
│   ├── launcher.py  run_me.py  Start.bat
│   └── package.json
├── scripts/
│   ├── checkConfig.mjs       # Patch local siteConfig after upstream upgrade
│   └── og-generate.ps1       # Generate OG share image locally
├── update.py / update.bat    # Upstream lossless updater (git checkout whitelist)
├── UpdateLog.md              # Upstream changelog (read-only)
├── LICENSE                   # CC BY-NC 4.0
└── README.md / README_en.md
```

> Do **not** rename `my-blog-manager/` — its path is hardcoded in `update.py` and the launcher scripts; renaming breaks the console.

## 5. Deploy & run

### Production (Cloudflare Pages, git-connected auto-build)

| Setting | Value |
| --- | --- |
| Project name | `rcj-blog` |
| Production branch | `main` |
| Root directory | `XHBlogs` |
| Build command | `npx --yes next-on-pages` |
| Build output directory | `.vercel/output/static` |
| Custom domain | `blog.955827.xyz` |

Any push to `main` triggers a rebuild — no manual upload.

### Local development

```powershell
cd XHBlogs
npm install
npm run dev          # http://localhost:3000
```

Preview the Cloudflare Pages build locally:

```powershell
cd XHBlogs
npm run pages:build  # = next-on-pages; output in .vercel/output/static
```

### Local admin console (Windows)

```powershell
cd my-blog-manager
.\Start.bat          # auto-detects Python 3.10+ and Node, installs deps, opens pywebview window
```

### Environment variables (Cloudflare Pages → Settings → Environment variables)

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASS` | Admin passcode, verified server-side at `/api/admin/auth`; without it the admin API returns 503 |
| `AI_GATEWAY_URL` | Optional, defaults to `https://955827.xyz/api/ai-chat`; usually leave alone |
| `NEXT_PUBLIC_MUSIC_R2_URL` | Optional, point the default track back to an R2 URL; otherwise same-origin `/soba-ni-iru-ne.webm` |
| `WEATHER_LAT` / `WEATHER_LON` / `WEATHER_CITY` | Optional, weather widget coordinates; defaults to Beijing |

> Model / channel keys live **only** in the main site's Pages/Workers secrets. This repo holds none.

### Daily writing flow

1. Launch the console with `my-blog-manager\Start.bat`.
2. Write / tweak → stage to queue → update local → sync Blog.
3. In the console click "sync source only" to push to `main`.
4. Cloudflare Pages rebuilds; refresh the live site.

### Upgrading upstream

Double-click `update.bat` (or run `python update.py`): it `git fetch origin main`, `git checkout`s the whitelisted front-end / console files, runs `npm install` in both subprojects, and runs `scripts/checkConfig.mjs` to patch the local `siteConfig`.

## 6. Current status

- **Live**: <https://blog.955827.xyz>. Recent commits cover SEO, friend links, project cards and the Gitalk→Waline migration.
- **Known notes**:
  - Waline client is wired but the backend `serverURL` is still empty — comments are not rendered yet. Fill it in `siteConfig.ts` once the rcj-waline deployment is live.
  - The working tree has uncommitted edits (`layout.tsx`, `next.config.ts`, `siteConfig.ts`, `posts/first.md`, …) and untracked files (`scripts/og-generate.ps1`, `public/og-image.png`, `app/feed.xml/`) — in-progress work, not bugs.
  - Local `next-on-pages` on Windows occasionally hits `spawn npx ENOENT` / `.next` cleanup failures — a local sandbox quirk; Cloudflare's Linux build is unaffected.
  - NetEase external audio is blocked from Cloudflare egress IPs, so the music route can only 302 instantly, never stream server-side.
- **To be filled in**: the real Waline backend domain once deployed; editorial cadence / topic plan.

## 7. References

- Live blog: <https://blog.955827.xyz>
- Main-site AI gateway: <https://955827.xyz/api/ai-chat>
- Content hub (sibling site): <https://exam.955827.xyz>
- Upstream project: <https://github.com/heiehiehi/XinghuisamaBlogs>
- Deploy docs: <https://developers.cloudflare.com/pages/> and <https://github.com/cloudflare/next-on-pages>
- License: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
