import { NextRequest } from 'next/server'

// 网易云音频解析代理（/api/music/stream?id=xxx）
//
// 背景（2026-09-12 实测结论）：
//  1. 直链 music.163.com/song/media/outer/url 的 302 落点是 **http://m801.music.126.net/...**，
//     页面是 https，浏览器按混合内容拦截 => 报 MEDIA_ELEMENT_ERROR: Format error，播不了。
//  2. 网易对部分数据中心 IP（含 Cloudflare 边缘）会把这个接口 302 到 /404。
//  3. 第三方 Meting 实例（api.injahow.cn / api.i-meto.com）已不可达，之前的"瞬时 302 跳过去"
//     方案因此彻底失效（音频元素一直 networkState=2 卡住）。
//
// 现在的方案：服务端按顺序尝试多个解析通道，拿到直链后 **统一 https 化**，再 302 给浏览器，
// 音频由浏览器直连网易 CDN 缓冲（不占 Worker 带宽）。任一通道成功即返回；全失败给 404 JSON。
//
// 排障：/api/music/stream?id=xxx&debug=1 会返回每个通道的真实结果，不再需要猜。
export const runtime = 'edge'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
const NET_HEADERS = { 'User-Agent': UA, Referer: 'https://music.163.com/' }

function fetchT(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

/** 网易 CDN 直链常带 http:// 前缀，页面是 https，必须升级协议否则被混合内容拦掉 */
function httpsify(u: string | null | undefined): string | null {
  if (!u) return null
  const s = String(u).trim()
  if (!/^https?:\/\//i.test(s)) return null
  if (/\/404(\?|$)/.test(s)) return null
  return s.replace(/^http:\/\//i, 'https://')
}

function pickJsonUrl(text: string): string | null {
  try {
    const j = JSON.parse(text)
    if (Array.isArray(j) && j[0]?.url) return String(j[0].url)
    if (Array.isArray(j?.data) && j.data[0]?.url) return String(j.data[0].url)
    if (typeof j?.url === 'string') return j.url
    if (typeof j?.data?.url === 'string') return j.data.url
  } catch {
    /* 非 JSON：可能是文本形式的直链 */
    const m = text.match(/https?:\/\/[^\s"']+\.(mp3|m4a|flac)[^\s"']*/i)
    if (m) return m[0]
  }
  return null
}

type Probe = { url: string | null; detail: any }

/** 1) gdstudio music-api：直接给 https 直链（实测最稳，且不挑 IP） */
async function viaGdstudio(id: string): Promise<Probe> {
  const detail: any = {}
  for (const br of ['320', '128']) {
    try {
      const r = await fetchT(
        `https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=${id}&br=${br}`,
        { headers: { 'User-Agent': UA }, redirect: 'follow' },
        5000,
      )
      const t = await r.text()
      const u = httpsify(pickJsonUrl(t))
      detail[br] = { status: r.status, url: u, snippet: t.slice(0, 160) }
      if (u) return { url: u, detail }
    } catch (e) {
      detail[br] = { error: String(e) }
    }
  }
  return { url: null, detail }
}

/** 2) 网易官方 enhance 接口（GET 版，不需要加密参数） */
async function viaEnhance(id: string): Promise<Probe> {
  try {
    const r = await fetchT(
      `https://music.163.com/api/song/enhance/player/url?ids=%5B${id}%5D&br=320000`,
      { headers: NET_HEADERS, redirect: 'follow' },
      5000,
    )
    const t = await r.text()
    const u = httpsify(pickJsonUrl(t))
    return { url: u, detail: { status: r.status, url: u, snippet: t.slice(0, 200) } }
  } catch (e) {
    return { url: null, detail: { error: String(e) } }
  }
}

/** 3) 网易 outer 外链（手动跟 302 拿落点；CF 边缘 IP 常被 302 到 /404，故用 httpsify 过滤） */
async function viaOuter(id: string): Promise<Probe> {
  try {
    const r = await fetchT(
      `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
      { headers: NET_HEADERS, redirect: 'manual' },
      5000,
    )
    const loc = r.headers.get('location')
    const u = httpsify(loc)
    return { url: u, detail: { status: r.status, location: loc, url: u } }
  } catch (e) {
    return { url: null, detail: { error: String(e) } }
  }
}

/** 4) 兜底：第三方 Meting 实例（自己会 302 到音频，直接交给浏览器） */
async function viaMeting(id: string): Promise<Probe> {
  const instances = [
    `https://api.injahow.cn/meting/?server=netease&type=url&id=${id}`,
    `https://api.i-meto.com/meting/api?server=netease&type=url&id=${id}`,
  ]
  const detail: any = {}
  for (const inst of instances) {
    try {
      const r = await fetchT(inst, { headers: { 'User-Agent': UA }, redirect: 'manual' }, 4000)
      const loc = httpsify(r.headers.get('location'))
      detail[inst] = { status: r.status, location: r.headers.get('location'), url: loc }
      if (loc) return { url: loc, detail }
    } catch (e) {
      detail[inst] = { error: String(e) }
    }
  }
  return { url: null, detail }
}

const STRATEGIES: { name: string; run: (id: string) => Promise<Probe> }[] = [
  { name: 'gdstudio', run: viaGdstudio },
  { name: 'netease-enhance', run: viaEnhance },
  { name: 'netease-outer', run: viaOuter },
  { name: 'meting', run: viaMeting },
]

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('id') || ''
  const matched = raw.match(/\d{4,}/)
  const id = matched ? matched[0] : ''
  if (!id) return Response.json({ error: 'missing id' }, { status: 400 })

  // 诊断口：?debug=1 逐个通道试，把真实结果全吐出来
  if (request.nextUrl.searchParams.get('debug') === '1') {
    const report: any = {
      id,
      colo: (request as any).cf?.colo || null,
      country: (request as any).cf?.country || null,
    }
    for (const s of STRATEGIES) {
      const t0 = Date.now()
      const r = await s.run(id)
      report[s.name] = { ok: !!r.url, ms: Date.now() - t0, ...r.detail }
    }
    return Response.json(report, { headers: { 'Cache-Control': 'no-store' } })
  }

  // 生产：顺序尝试，首个成功即 302（瞬时返回，音频由浏览器直连 CDN）
  const attempts: Record<string, any> = {}
  for (const s of STRATEGIES) {
    try {
      const r = await s.run(id)
      if (r.url) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: r.url,
            'Cache-Control': 'public, max-age=300',
            'X-Music-Source': s.name,
          },
        })
      }
      attempts[s.name] = 'no-url'
    } catch (e) {
      attempts[s.name] = String(e)
    }
  }

  return Response.json({ error: 'no_playable_url', id, attempts }, { status: 404 })
}
