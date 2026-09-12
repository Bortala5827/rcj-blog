import { NextRequest } from 'next/server'

// 网易云音频解析代理：
// 背景：直链 music.163.com/song/media/outer/url?id=X.mp3 从 Cloudflare 边缘 IP 请求会被网易
// 重定向到 /404（IP 封锁），因此不能靠 CF 直接流式透传。
// 策略：优先尝试直连流式；失败则用外部解析 API 拿到网易 CDN 直链，302 让浏览器直连播放
// （用户浏览器在国内可直连 CDN，被封锁的只是 CF 边缘出口 IP）。
export const runtime = 'edge'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

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

const API_STRATEGIES: { name: string; url: (id: string) => string }[] = [
  { name: 'injahow', url: (id) => `https://api.injahow.cn/meting/?server=netease&type=song&id=${id}` },
  { name: 'imets', url: (id) => `https://api.i-meto.com/meting/api?server=netease&type=song&id=${id}` },
  { name: 'gdstudio', url: (id) => `https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=${id}&br=320` },
]

async function streamOuter(id: string, range: string | null): Promise<Response | null> {
  try {
    const headers: Record<string, string> = {
      'User-Agent': UA,
      Referer: 'https://music.163.com/',
      Accept: '*/*',
    }
    if (range) headers['Range'] = range
    const r = await fetch(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, { headers, redirect: 'follow' })
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

  // 诊断口：一次列出所有策略的真实结果
  if (debug) {
    const report: any = { id, outer: null, apis: [] as any[] }
    try {
      const r = await fetch(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, {
        headers: { 'User-Agent': UA, Referer: 'https://music.163.com/' },
        redirect: 'follow',
      })
      report.outer = { status: r.status, ct: r.headers.get('content-type'), finalUrl: r.url }
    } catch (e) {
      report.outer = { error: String(e) }
    }
    for (const s of API_STRATEGIES) {
      try {
        const r = await fetch(s.url(id), { headers: { 'User-Agent': UA }, redirect: 'follow' })
        const t = await r.text()
        report.apis.push({
          name: s.name,
          status: r.status,
          ct: r.headers.get('content-type'),
          directUrl: extractDirectUrl(t),
          snippet: t.slice(0, 220),
        })
      } catch (e) {
        report.apis.push({ name: s.name, error: String(e) })
      }
    }
    return Response.json(report)
  }

  try {
    // 1) 直连流式透传（若出口未被封则最优）
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

    // 2) 解析出网易 CDN 直链 -> 302 让浏览器直连（避开 CF 边缘 IP 封锁）
    for (const s of API_STRATEGIES) {
      try {
        const r = await fetch(s.url(id), { headers: { 'User-Agent': UA }, redirect: 'follow' })
        const directUrl = extractDirectUrl(await r.text())
        if (directUrl) {
          const secure = directUrl.replace(/^http:\/\//i, 'https://')
          return Response.redirect(secure, 302)
        }
      } catch {
        /* 换下一个策略 */
      }
    }

    return new Response('audio not available', { status: 502 })
  } catch (err) {
    return new Response('proxy error: ' + String(err), { status: 502 })
  }
}
