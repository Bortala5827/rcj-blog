import { NextRequest } from 'next/server'

// 网易云音频同源代理：
// 直链 https://music.163.com/song/media/outer/url?id=X.mp3 在浏览器里播不了
// （302 到明文 http 被混合内容拦截 + 浏览器不带 Referer 被网易拒绝）。
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

  // 诊断口：/api/music/stream?id=X&debug=1 返回上游真实状态，便于排查
  const debug = request.nextUrl.searchParams.get('debug') === '1'

  const outer = `https://music.163.com/song/media/outer/url?id=${id}.mp3`
  const range = request.headers.get('range')

  try {
    const headers: Record<string, string> = {
      'User-Agent': UA,
      Referer: 'https://music.163.com/',
      Accept: '*/*',
    }
    if (range) headers['Range'] = range

    const upstream = await fetch(outer, { headers, redirect: 'follow' })
    const contentType = (upstream.headers.get('content-type') || '').toLowerCase()

    if (debug) {
      return Response.json({
        id,
        upstreamStatus: upstream.status,
        upstreamContentType: contentType,
        upstreamContentLength: upstream.headers.get('content-length'),
        upstreamContentRange: upstream.headers.get('content-range'),
        finalUrl: upstream.url,
        hasBody: !!upstream.body,
      })
    }

    // 网易对不可播歌曲会返回小 HTML 页（200）——判定为不可用
    if (!upstream.ok || contentType.includes('text/html') || !upstream.body) {
      return new Response('audio not available', { status: 502 })
    }

    // 注意：对流式 body 不设置 Content-Length（长度未知会与流不匹配，导致 CF 中断 → 502）
    const respHeaders = new Headers()
    respHeaders.set('Content-Type', contentType.includes('audio') ? contentType : 'audio/mpeg')
    respHeaders.set('Accept-Ranges', 'bytes')
    respHeaders.set('Cache-Control', 'public, max-age=3600')
    respHeaders.set('Access-Control-Allow-Origin', '*')
    const contentRange = upstream.headers.get('content-range')
    if (contentRange) respHeaders.set('Content-Range', contentRange)

    return new Response(upstream.body, { status: upstream.status, headers: respHeaders })
  } catch (err) {
    return new Response('proxy error: ' + String(err), { status: 502 })
  }
}
