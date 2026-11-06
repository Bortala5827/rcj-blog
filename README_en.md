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

## 1.5 How it works

- **Static site, borrowed AI**: the Next.js site runs on Cloudflare Pages (`next-on-pages` edge runtime) with zero servers. "Tuanzi" never calls a model directly; `/api/chat` forwards to the main-site gateway `https://955827.xyz/api/ai-chat` (`scene=blog`). **Model keys live only on the main site**; this repo just injects the persona system prompt from `siteConfig.ts`.
- **Music = self-hosted on R2, no NetEase**: `localTracks` in `siteConfig.ts` lists **45 tracks** whose audio lives in the R2 bucket `blog-media`, served through `cdn.955827.xyz` (`/music/*.m4a` + `/covers/*.jpg`, one-year cache). Lyrics come from `/music/lyrics/*.lrc` (whisper-timed) with `/api/music/lrc` → lrclib as fallback. The NetEase external-link mode is retired (`cloudMusicIds: []`).
- **Comments wait for Waline**: client is wired, but an empty `serverURL` means the block is not rendered until a backend is deployed.
- **Admin = online `/admin` + optional local console**: the online `/admin` checks `ADMIN_PASS` via `/api/admin/auth` and manages playlist / notes / gallery / settings; notes and playlist IDs live in D1 (binding `DB`). `my-blog-manager/` is an optional local writing shell (Tiptap editor + drafts).
- **Not the content hub**: blog carries essays and the project showcase; content distribution is exam (banks / cards / interviews / tutorials), monetization is shop.

## 2. Features

- Markdown posts (`posts/*.md`) with GFM, code highlighting (highlight.js / rehype-highlight) and LaTeX math (KaTeX / remark-math).
- Moments / short updates (`moments/*.md`), photo wall (`photowall` + `data/albums.ts`), timeline archive (`/timeline`; old `/archive` 308-redirects).
- Project showcase (`/projects`), friend links (`/friends`), about page (`/about`, introducing sibling sites).
- Music page `/music`: 45 self-hosted tracks with covers and line-by-line scrolling lyrics (play / switch / seek by lyric); a persistent music widget across pages.
- AI chat assistant "Tuanzi": edge route `/api/chat` forwards to the main-site AI gateway; persona injected via `siteConfig.aiConfig.systemPrompt`.
- Online admin console `/admin`: Dashboard / Playlist / Notes / Gallery / Settings tabs. Notes support create / edit / delete (`GET/POST /api/notes` public, `PATCH/DELETE` require `x-rcj-pass`); Playlist manages track IDs; Gallery / Settings manage albums and site config.
- Optional local console (`my-blog-manager/`): Tiptap WYSIWYG editor, drafts, playlist / gallery / friend-link / settings management, dashboard.
- SEO: `metadataBase`, OG/Twitter cards, `sitemap.ts`, `robots.ts`, JSON-LD, RSS `/feed.xml`.
- Theming: Tailwind 4 gradient background, global danmaku quotes, React Three Fiber 3D decor.

## 3. Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16.2.1 (App Router), React 19.2.4, TypeScript 5 |
| Styling | Tailwind CSS 4, `@tailwindcss/typography`, Framer Motion |
| Render / deploy | Cloudflare Pages + `@cloudflare/next-on-pages` 1.13.16 (edge runtime) |
| Data | Cloudflare D1 (binding `DB`: notes, playlist IDs, rate limits) |
| Media | Cloudflare R2 (bucket `blog-media`, served via `cdn.955827.xyz`) |
| Content | Markdown (gray-matter / unified / remark / rehype), KaTeX, highlight.js |
| Rich text | Tiptap v3 (local admin console) |
| Comments | `@waline/client` v3.15 (backend pending; not rendered while `serverURL` is empty) |
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
│   │   │   ├── notes/route.ts      # notes wall: GET/POST public, PATCH/DELETE need pass
│   │   │   ├── music/{route,stream,ids,img,lrc}/
│   │   │   ├── weather/route.ts
│   │   │   └── test/route.ts
│   │   ├── feed.xml/  sitemap.ts  robots.ts  layout.tsx
│   ├── components/  lib/
│   ├── data/                 # albums.ts / friends.ts / projects.ts
│   ├── posts/                # Markdown posts
│   ├── moments/              # Short updates
│   ├── chatters/             # Long-form notes / drafts
│   ├── public/               # Local images, covers, lyrics (music/lyrics/), og-image
│   ├── siteConfig.ts         # Single source of truth (title / social / AI / music / Waline)
│   ├── next.config.ts        # /archive → /timeline redirect etc.
│   └── package.json          # scripts: dev/build/start/lint/pages:build
├── my-blog-manager/          # Optional local writing console (Next.js + Python launcher)
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

> Do **not** rename `my-blog-manager/` — its path is hardcoded in `update.py` and the launcher scripts.

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

Any push to `main` triggers a rebuild.

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

### Optional local console (Windows)

```powershell
cd my-blog-manager
.\Start.bat          # auto-detects Python 3.10+ and Node, installs deps, opens pywebview window
```

> You can also use the online `/admin`; the local console is optional.

### Environment variables / bindings (Cloudflare Pages → Settings)

| Name | Type | Purpose |
| --- | --- | --- |
| `ADMIN_PASS` | Env var | Admin passcode, verified at `/api/admin/auth`; without it the admin API returns 503 |
| `DB` | D1 binding | Notes + playlist IDs + rate-limit tables (created lazily) |
| `AI_GATEWAY_URL` | Env var | Optional, defaults to `https://955827.xyz/api/ai-chat` |
| `NEXT_PUBLIC_MUSIC_R2_URL` | Env var | Optional, overrides the music URL prefix (defaults to `localTracks` on `cdn.955827.xyz`) |
| `WEATHER_LAT` / `WEATHER_LON` / `WEATHER_CITY` | Env var | Optional weather-widget coordinates, defaults to Beijing |

> Model / channel keys live **only** in the main site's secrets. This repo holds none.

### Adding a track (R2 self-hosted)

1. Upload audio: `wrangler r2 object put blog-media/music/<slug>.m4a --file <file>`; cover to `blog-media/covers/<slug>.jpg`.
2. Put lyrics in `XHBlogs/public/music/lyrics/<slug>.lrc` (optional; empty falls back to lrclib via `/api/music/lrc`).
3. Append `{ id, lrcPath, title, artist, duration, src, cover }` to `localTracks` in `siteConfig.ts`, using a `local-` id prefix.

### Daily writing flow

1. Write posts / tweak config locally, or manage notes & playlist via online `/admin`;
2. Use `my-blog-manager\Start.bat` when you want local WYSIWYG editing;
3. Push to `main`;
4. Cloudflare Pages rebuilds; refresh the live site.

### Upgrading upstream

Double-click `update.bat` (or run `python update.py`): it `git fetch origin main`, `git checkout`s the whitelisted front-end / console files, runs `npm install` in both subprojects, and runs `scripts/checkConfig.mjs` to patch the local `siteConfig`.

## 6. Current status

- **Live**: <https://blog.955827.xyz>. Recent commits cover the R2 playlist migration, `/admin` note CRUD, SEO, friend links and project cards.
- **Known notes**:
  - Waline client is wired but the backend `serverURL` is still empty — comments are not rendered yet.
  - Online `/admin` note edit / delete requires both `ADMIN_PASS` and the D1 `DB` binding; either missing returns 503.
  - NetEase external audio is retired; all audio is on R2 and no audio binaries are stored in the repo.
  - Local `next-on-pages` on Windows occasionally hits `spawn npx ENOENT` / `.next` cleanup failures — a local sandbox quirk; Cloudflare's Linux build is unaffected.
- **To be filled in**: the real Waline backend domain once deployed; editorial cadence / topic plan.

## 7. References

- Live blog: <https://blog.955827.xyz>
- Main-site AI gateway: <https://955827.xyz/api/ai-chat>
- Content hub (sibling site): <https://exam.955827.xyz>
- Upstream project: <https://github.com/heiehiehi/XinghuisamaBlogs>
- Deploy docs: <https://developers.cloudflare.com/pages/> and <https://github.com/cloudflare/next-on-pages>
- License: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
