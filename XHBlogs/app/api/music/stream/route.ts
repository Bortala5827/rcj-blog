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
// 现在的方案（2026-09-12 二次修订）：
//   1) 先按顺序尝试多个解析通道拿到直链，校验「是不是真的网易音频 CDN」
//      （挡掉 /404 封锁页和 st.music.163.com 风控验证页）并统一 https 化；
//   2) 拿到直链后**优先由边缘同源代理**（透传 Range / 206，浏览器只连本站域名）——
//      因为部分网络访问不到 *.music.126.net，表现就是「封面破图 + 播放 0:00/0:00」；
//   3) 代理失败（边缘也取不到）才退回 302 直连网易 CDN（老行为）。
//   全失败给 404 JSON，前端提示「音源不可用」。
//
// 版权/会员受限的歌（如 周杰伦《晴天》id=186016）实测三个通道全拿不到音频 → 直接 404。
//
// 排障：/api/music/stream?id=xxx&debug=1 会返回每个通道的真实结果 + 边缘代理取字节的实测结果。
export const runtime = 'edge'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
const NET_HEADERS = { 'User-Agent': UA, Referer: 'https://music.163.com/' }

function fetchT(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

/** 网易 CDN 直链常带 http:// 前缀，页面是 https，必须升级协议否则被混合内容拦掉；
 *  同时必须挡掉「看起来像成功、其实是别的页面」的情况：
 *   - /404                    → 网易对数据中心 IP 的封锁页
 *   - st.music.163.com/encrypt-pages → 版权受限歌曲的风控验证页（enhance 会返回它）*/
function isPlayableCdn(u: string | null | undefined): boolean {
  if (!u) return false
  const s = String(u).trim()
  if (!/^https?:\/\//i.test(s)) return false
  if (/\/404(\?|$)/.test(s)) return false
  if (/encrypt-pages|verifyType=/.test(s)) return false
  try {
    const host = new URL(s).hostname.toLowerCase()
    // 只认网易音频 CDN（m801./m701./m8.…music.126.net）；API/页面域名一律拒绝
    return host.endsWith('.music.126.net')
  } catch {
    return false
  }
}

function httpsify(u: string | null | undefined): string | null {
  if (!isPlayableCdn(u)) return null
  return String(u).trim().replace(/^http:\/\//i, 'https://')
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
      const rawUrl = pickJsonUrl(t)
      const u = httpsify(rawUrl)
      detail[br] = { status: r.status, rawUrl, url: u, snippet: t.slice(0, 160) }
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

/** 同源代理：由边缘去取音频字节，再把流吐回浏览器（浏览器只需连本站域名）。
 *  为什么需要：部分网络访问不到 *.music.126.net（封面破图 + 播放 0:00/0:00 同时出现就是它的特征）。
 *  透传 Range/206 以支持拖动进度条；失败返回 null，调用方退回 302。 */
async function proxyAudio(
  url: string,
  source: string,
  range: string | null,
  method: string,
): Promise<Response | null> {
  try {
    const headers: Record<string, string> = { 'User-Agent': UA, Referer: 'https://music.163.com/' }
    if (range) headers.Range = range
    const r = await fetchT(url, { headers, redirect: 'follow', method: method === 'HEAD' ? 'HEAD' : 'GET' }, 15000)
    if (!r.ok && r.status !== 206) return null
    if (method === 'HEAD' || !r.body) {
      return new Response(null, { status: 200, headers: { 'Accept-Ranges': 'bytes', 'X-Music-Mode': 'head' } })
    }
    const h = new Headers()
    h.set('Content-Type', r.headers.get('content-type') || 'audio/mpeg')
    h.set('Accept-Ranges', r.headers.get('accept-ranges') || 'bytes')
    const cl = r.headers.get('content-length')
    const cr = r.headers.get('content-range')
    if (cl) h.set('Content-Length', cl)
    if (cr) h.set('Content-Range', cr)
    // 直链带时效签名，不能缓存
    h.set('Cache-Control', 'no-store')
    h.set('X-Music-Source', source)
    h.set('X-Music-Mode', 'proxy')
    return new Response(r.body, { status: r.status === 206 ? 206 : 200, headers: h })
  } catch {
    return null
  }
}

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
      if (r.url) {
        // 顺手验证「边缘能不能真的取到音频字节」（同源代理是否可行）
        const t1 = Date.now()
        const head = await proxyAudio(r.url, s.name, 'bytes=0-1023', 'GET').catch(() => null)
        report.proxy = {
          source: s.name,
          ok: !!head,
          status: head?.status ?? null,
          contentType: head?.headers.get('content-type') || null,
          ms: Date.now() - t1,
        }
        // 真读一点字节，确认不是空响应
        try {
          report.proxy.sampleBytes = head ? (await head.arrayBuffer()).byteLength : 0
        } catch {
          report.proxy.sampleBytes = -1
        }
        break
      }
    }
    return Response.json(report, { headers: { 'Cache-Control': 'no-store' } })
  }

  const range = request.headers.get('range')
  const method = request.method

  // 生产：顺序尝试通道 —— 首选「同源代理」（浏览器只连本站，绕开 126.net 可达性问题），
  // 代理失败才退回 302 直连（老行为，浏览器直连网易 CDN）。全失败给 404。
  const attempts: Record<string, any> = {}
  for (const s of STRATEGIES) {
    try {
      const r = await s.run(id)
      if (!r.url) {
        attempts[s.name] = 'no-url'
        continue
      }
      const proxied = await proxyAudio(r.url, s.name, range, method)
      if (proxied) return proxied
      attempts[s.name] = 'proxy-failed->302'
      return new Response(null, {
        status: 302,
        headers: {
          Location: r.url,
          'Cache-Control': 'public, max-age=300',
          'X-Music-Source': s.name,
          'X-Music-Mode': 'redirect',
        },
      })
    } catch (e) {
      attempts[s.name] = String(e)
    }
  }

  return Response.json({ error: 'no_playable_url', id, attempts }, { status: 404 })
}

export async function HEAD(request: NextRequest) {
  return GET(request)
}
