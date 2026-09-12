# rcj-blog

My personal blog / notebook. Built with Next.js, deployed on Cloudflare Pages.

- Live: <https://blog.955827.xyz>
- Repo: <https://github.com/Bortala5827/rcj-blog> (private)

> **Origin & license**
> Forked from [heiehiehi/XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) by
> **XingHuiSama ([@heiehiehi](https://github.com/heiehiehi))**, licensed **CC BY-NC 4.0**
> (attribution + non-commercial). Attribution and license are kept as-is; no commercial use.

---

## What I changed

| Area | Upstream | Here |
| --- | --- | --- |
| Hosting | Vercel | **Cloudflare Pages** (`@cloudflare/next-on-pages`, git-linked auto builds) |
| Music widget | NetEase external URLs | **Self-hosted audio on R2**; NetEase song IDs still importable via the admin panel |
| Images / covers | Third-party image host | Local `public/` assets + local `cover-default.svg` |
| Docs | Screenshot-heavy README (`picture/`) | **Removed** — text only |
| Identity | Author's own info | `siteConfig.ts` / `about` rewritten for RCJ Lab |
| Friend links | Author's list | Mine only |

Everything else (Markdown writing, admin console, AI assistant, comments, moments) is upstream's work.

## Layout

| Path | What it is |
| --- | --- |
| `XHBlogs/` | **The Next.js app** — this is what gets deployed (Root directory) |
| `my-blog-manager/` | Local admin console (`Start.bat`, Python). ⚠️ **Do not rename this folder** — path resolution breaks |
| `update.py` / `update.bat` | Upstream's lossless updater, kept as-is |
| `LICENSE` | CC BY-NC 4.0 |
| `UpdateLog.md` | Upstream changelog |

## My Cloudflare Pages settings

Project **`rcj-blog`** → Connect to Git (`Bortala5827/rcj-blog`):

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `XHBlogs` |
| Build command | `npx --yes next-on-pages` |
| Build output | `.vercel/output/static` |
| Custom domain | `blog.955827.xyz` |

Any push to `main` triggers a rebuild — no manual upload.

## Daily workflow

1. Run `my-blog-manager/Start.bat` to launch the local console
2. Write / tweak → **stage to queue** → **update local** → **sync Blog**
3. Click **sync source only** in the console (pushes to `main`)
4. Cloudflare Pages rebuilds automatically

## Admin & music

- Admin passcode: `199527` (per browser session only) — see `XHBlogs/app/admin/page.tsx`
- The panel handles: playlist management (paste NetEase IDs), gallery, system config, dashboard
- Playback: `siteConfig.music.source === 'r2'`, served from the R2 public domain `pub-33cbba9a540847778b48cbc906aea2ad.r2.dev`
- NetEase tracks: `/api/music/stream?id=X` just does an **instant 302** to a resolved URL (see below)

## Notes / gotchas

- **NetEase blocks Cloudflare egress IPs**: `music.163.com/song/media/outer/url` returns a 302 to `/404` from CF, so neither direct streaming nor server-side resolution works. The route now 302s instantly to a resolver and lets the browser buffer the audio itself.
- **Never set `Content-Length` on a streamed response**: a mismatch makes Cloudflare cut the connection (502, playback fails).
- For the AI assistant to work online, set `GEMINI_API_KEY` in the Pages environment variables.
- Local `next-on-pages` builds on Windows occasionally hit `spawn npx ENOENT` / `.next` cleanup failures — a local sandbox quirk; Cloudflare's Linux build is unaffected.

## License

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — free to learn from, share, and modify (credit the original author when republishing), **no commercial use**.
