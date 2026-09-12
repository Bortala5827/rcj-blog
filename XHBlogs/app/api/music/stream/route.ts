import { NextRequest } from 'next/server'

// 网易云音频解析代理：
// 背景：直链 music.163.com/song/media/outer/url?id=X.mp3 从 Cloudflare 边缘 IP 请求会被网易
// 重定向到 /404（IP 封锁），不能靠 CF 直接流式透传。
// 策略：优先直连流式；失败则用外部解析 API 取得网易 CDN 直链，302 让浏览器直连播放
// （用户浏览器在国内可直连 CDN，被封锁的只是 CF 边缘出口 IP）。
export const runtime = 'edge'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

function fetchT(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

function extractDirectUrl(text: string): string | null {
  try {
    const j = JSON.parse(text)
    if (Array.isArray(j) && j[0] && typeof j[0] === 'object' && j[0].url) return String(j[0].url)
    if (j && typeof j === 'object') {
      if (Array.isArray(j.data) && j.data[0]?.url) return String(j.data[0].url)
      if (typeof j.url === 'string') return j.url
      if (j.data && typeof j.data.url === 'string') return j.data.url
    }
  } catch {
    /* 非 JSON，走正则 */
  }
  const m = text.match(/https?:\/\/[^"'\\\s]+\.(?:mp3|m4a|flac|aac)/i)
  return m ? m[0] : null
}

const NET_EASE_HEADERS: Record<string, string> = { 'User-Agent': UA, Referer: 'https://music.163.com/', Accept: '*/*' }

const API_STRATEGIES: { name: string; url: (id: string) => string; headers?: Record<string, string> }[] = [
  { name: 'injahow', url: (id) => `https://api.injahow.cn/meting/?server=netease&type=song&id=${id}` },
  { name: 'imets', url: (id) => `https://api.i-meto.com/meting/api?server=netease&type=song&id=${id}` },
  { name: 'gdstudio', url: (id) => `https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=${id}&br=320` },
  { name: 'enhancePlayer', url: (id) => `https://music.163.com/api/song/enhance/player/url?ids=[${id}]&br=320000`, headers: NET_EASE_HEADERS },
]

async function streamOuter(id: string, range: string | null): Promise<Response | null> {
  try {
    const headers = { ...NET_EASE_HEADERS }
    if (range) (headers as any)['Range'] = range
    const r = await fetchT(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, { headers, redirect: 'follow' }, 6000)
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    if (r.ok && !ct.includes('text/html') && r.body) return r
  } catch {
    /* ignore */
  }
  return null
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('id') || ''
  const matched = raw.match(/\d{4,}/)
  const id = matched ? matched[0] : ''
  if (!id) return new Response('missing id', { status: 400 })

  const debug = request.nextUrl.searchParams.get('debug') === '1'
  const range = request.headers.get('range')

  if (debug) {
    // 并行探测，每个策略 8s 超时，避免整体挂死
    const [outerRes, ...apiRes] = await Promise.allSettled([
      fetchT(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, { headers: NET_EASE_HEADERS, redirect: 'follow' }, 8000),
      ...API_STRATEGIES.map((s) => fetchT(s.url(id), { headers: s.headers || { 'User-Agent': UA }, redirect: 'follow' }, 8000)),
    ])

    const report: any = { id, outer: null, apis: [] as any[] }
    if (outerRes.status === 'fulfilled') {
      report.outer = { status: outerRes.value.status, ct: outerRes.value.headers.get('content-type'), finalUrl: outerRes.value.url }
    } else {
      report.outer = { error: String(outerRes.reason) }
    }

    await Promise.all(
      apiRes.map(async (res, i) => {
        const name = API_STRATEGIES[i].name
        if (res.status !== 'fulfilled') {
          report.apis[i] = { name, error: String(res.reason) }
          return
        }
        let snippet = ''
        try { snippet = (await res.value.text()).slice(0, 200) } catch { /* ignore */ }
        report.apis[i] = {
          name,
          status: res.value.status,
          ct: res.value.headers.get('content-type'),
          directUrl: extractDirectUrl(snippet),
          snippet,
        }
      }),
    )
    return Response.json(report)
  }

  try {
    // 1) 优先用外部解析 API（injahow 实测可用）取直链 -> 302 让浏览器直连
    for (const s of API_STRATEGIES) {
      try {
        const r = await fetchT(s.url(id), { headers: s.headers || { 'User-Agent': UA }, redirect: 'follow' }, 6000)
        const directUrl = extractDirectUrl(await r.text())
        if (directUrl) {
          const secure = directUrl.replace(/^http:\/\//i, 'https://')
          return Response.redirect(secure, 302)
        }
      } catch {
        /* 换下一个策略 */
      }
    }

    // 2) 直连流式透传兜底（若出口未被封则最优）
    const direct = await streamOuter(id, range)
    if (direct) {
      const ct = direct.headers.get('content-type') || ''
      const respHeaders = new Headers()
      respHeaders.set('Content-Type', ct.includes('audio') ? ct : 'audio/mpeg')
      respHeaders.set('Accept-Ranges', 'bytes')
      respHeaders.set('Cache-Control', 'public, max-age=3600')
      const cr = direct.headers.get('content-range')
      if (cr) respHeaders.set('Content-Range', cr)
      return new Response(direct.body, { status: direct.status, headers: respHeaders })
    }

    return new Response('audio not available', { status: 502 })
  } catch (err) {
    return new Response('proxy error: ' + String(err), { status: 502 })
  }
}
