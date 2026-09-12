import { NextRequest } from 'next/server'

export const runtime = 'edge'

// 网易云封面同源代理（/api/music/img?u=<原图地址>）
//
// 为什么需要：部分网络环境访问不到 *.music.126.net（封面 p1/p2/p3.… 与音频 m701.… 同属这个域名族），
// 表现就是「封面破图 + 播放 0:00/0:00」。走同源代理后，浏览器只需要连 blog 自己的域名，
// 由 Cloudflare 边缘去取原图再吐回来，彻底绕开用户侧对该域名的可达性问题。
//
// 安全：只允许白名单域名（*.126.net），避免变成开放代理。
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

function isAllowed(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    const host = u.hostname.toLowerCase()
    return host === '126.net' || host.endsWith('.126.net')
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('u') || ''
  if (!isAllowed(raw)) {
    return new Response('forbidden url', { status: 400 })
  }
  try {
    // 不带 Referer：网易图床对陌生 Referer 偶发 403
    const r = await fetch(raw.replace(/^http:\/\//i, 'https://'), {
      headers: { 'User-Agent': UA },
    })
    if (!r.ok || !r.body) {
      return new Response('upstream ' + r.status, { status: 502 })
    }
    return new Response(r.body, {
      headers: {
        'Content-Type': r.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Music-Img': 'proxy',
      },
    })
  } catch (e) {
    return new Response('img proxy error: ' + String(e), { status: 502 })
  }
}
