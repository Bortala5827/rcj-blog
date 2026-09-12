import { NextRequest } from 'next/server'

// 网易云音频解析代理。
//
// 背景：直链 music.163.com/song/media/outer/url?id=X.mp3 从 Cloudflare 边缘 IP 请求会被网易
// 重定向到 /404（网易对数据中心 IP 封锁），因此不能靠 CF 直接流式透传，也不能由 CF 先解析。
//
// 方案：injahow Meting 的音频地址是**可预测的固定模式**：
//   https://api.injahow.cn/meting/?server=netease&type=url&id={id}
// 该地址在浏览器侧即可播放（用户在国内可直连），所以本路由直接 302 跳转过去——
// 瞬时返回、零服务端解析开销；音频由浏览器异步缓冲，不阻塞页面。
export const runtime = 'edge'

const METING_AUDIO = (id: string) => `https://api.injahow.cn/meting/?server=netease&type=url&id=${id}`

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
      if (typeof j.url === 'string' && j.url) return j.url
      if (j.data && typeof j.data.url === 'string' && j.data.url) return j.data.url
    }
  } catch {
    /* 非 JSON */
  }
  return null
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('id') || ''
  const matched = raw.match(/\d{4,}/)
  const id = matched ? matched[0] : ''
  if (!id) return new Response('missing id', { status: 400 })

  // 诊断口：?debug=1 返回各解析策略的真实结果（排障用）
  if (request.nextUrl.searchParams.get('debug') === '1') {
    const report: any = { id }
    try {
      const r = await fetchT(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, {
        headers: { 'User-Agent': UA, Referer: 'https://music.163.com/' },
        redirect: 'follow',
      }, 8000)
      report.outer = { status: r.status, ct: r.headers.get('content-type'), finalUrl: r.url }
    } catch (e) {
      report.outer = { error: String(e) }
    }
    try {
      const r = await fetchT(`https://api.injahow.cn/meting/?server=netease&type=song&id=${id}`, { headers: { 'User-Agent': UA }, redirect: 'follow' }, 8000)
      const t = await r.text()
      report.injahow = { status: r.status, ct: r.headers.get('content-type'), directUrl: extractDirectUrl(t), snippet: t.slice(0, 240) }
    } catch (e) {
      report.injahow = { error: String(e) }
    }
    report.chosenAudio = METING_AUDIO(id)
    return Response.json(report)
  }

  // 直接 302 到可播放的音频地址（瞬时返回）
  return Response.redirect(METING_AUDIO(id), 302)
}
