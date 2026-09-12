import { NextRequest } from 'next/server'

// 网易云音频同源代理：
// 直链 https://music.163.com/song/media/outer/url?id=X.mp3 在浏览器里播不了（302 到明文 http 被混合内容拦截 + 浏览器不带 Referer 被拒），
// 这里在服务端补齐 Referer/UA 并透传音频流（含 Range，支持拖动进度条），对前端呈现为同源 HTTPS。
export const runtime = 'edge'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('id') || ''
  const matched = raw.match(/\d{4,}/)
  const id = matched ? matched[0] : ''
  if (!id) {
    return new Response('missing id', { status: 400 })
  }

  const outer = `https://music.163.com/song/media/outer/url?id=${id}.mp3`
  const range = request.headers.get('range')

  let upstream: Response
  try {
    const headers: Record<string, string> = {
      'User-Agent': UA,
      Referer: 'https://music.163.com/',
      Accept: '*/*',
    }
    if (range) headers['Range'] = range
    upstream = await fetch(outer, { headers, redirect: 'follow' })
  } catch (err) {
    console.error(`[api/music/stream] 拉取 ${id} 失败:`, err)
    return new Response('upstream failed', { status: 502 })
  }

  const upstreamType = (upstream.headers.get('content-type') || '').toLowerCase()

  // 网易对不可播歌曲会返回一个小 HTML 页（200）——判定为不可用
  if (!upstream.ok || upstreamType.includes('text/html')) {
    return new Response('audio not available', { status: 502 })
  }

  const headers = new Headers()
  headers.set('Content-Type', upstreamType.includes('audio') ? upstreamType : 'audio/mpeg')
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Cache-Control', 'public, max-age=3600')
  headers.set('Access-Control-Allow-Origin', '*')

  const len = upstream.headers.get('content-length')
  if (len) headers.set('Content-Length', len)
  const contentRange = upstream.headers.get('content-range')
  if (contentRange) headers.set('Content-Range', contentRange)

  return new Response(upstream.body, { status: upstream.status, headers })
}
