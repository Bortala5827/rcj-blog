import { NextRequest } from 'next/server'

export const runtime = 'edge'

// lrclib.net 歌词代理（/api/music/lrc?title=xxx&artist=yyy&duration=秒）
//
// 为什么需要它：自托管私人歌单（siteConfig.localTracks）是付费购入的翻唱/清唱/伴奏版本，
// 时长与原版不一致（如水手 71s vs 原版 290s），不能直接把原版 LRC 打轴硬套。
// 策略：lrclib 搜索同名歌 → 若某候选时长与本地文件相差 ≤ SYNCED_DELTA_LIMIT 秒，
//       认定是「同版本/接近版本」，返回其逐行同步歌词（synced=true，前端逐行高亮）；
//       否则只返回纯文本歌词（plain，前端静默展示不参与实时匹配）。
// lrclib.net 是免费开放 API，无需鉴权；请求走 CF 边缘（本机网络不一定能直连它）。
//
// 响应：{ ok, synced, lrc, plain, picked?: { artist, track, duration, delta } }
//   ok=false 时前端退回「♪ 纯享音乐 ♪」。

const UA = 'XHBlogs/1.0 (blog.955827.xyz; personal blog player)'

/** 与本地文件时长的最大可接受差值（秒）：超过则认为 lrclib 那条是别的版本，同步歌词会错位 */
const SYNCED_DELTA_LIMIT = 20

type LrcRecord = {
  trackName?: string
  artistName?: string
  duration?: number
  instrumental?: boolean
  plainLyrics?: string | null
  syncedLyrics?: string | null
}

async function searchLrc(title: string, artist: string): Promise<LrcRecord[]> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  try {
    const params = new URLSearchParams({ track_name: title })
    // 「——」是占位歌手名（来源不明的私有版本），不要拿它去搜
    if (artist && artist !== '——') params.set('artist_name', artist)
    const r = await fetch(`https://lrclib.net/api/search?${params.toString()}`, {
      headers: { 'User-Agent': UA },
      signal: ctrl.signal,
    })
    if (!r.ok) return []
    const data = await r.json()
    return Array.isArray(data) ? (data as LrcRecord[]) : []
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

export async function GET(request: NextRequest) {
  const title = (request.nextUrl.searchParams.get('title') || '').trim()
  const artist = (request.nextUrl.searchParams.get('artist') || '').trim()
  const duration = Number(request.nextUrl.searchParams.get('duration')) || 0

  if (!title) {
    return Response.json({ ok: false, error: 'missing title' }, { status: 400 })
  }

  const records = await searchLrc(title, artist)

  // 过滤掉纯伴奏记录（instrumental 标记 / 无任何歌词内容）
  const usable = records.filter((r) => !r.instrumental && (r.syncedLyrics || r.plainLyrics))
  if (usable.length === 0) {
    return Response.json(
      { ok: false, reason: 'no_lyrics', total: records.length },
      { headers: { 'Cache-Control': 'public, max-age=3600' } },
    )
  }

  // 挑选：给了本地时长 → 选时长最接近的候选；没给 → 取第一条有同步歌词的
  let best = usable[0]
  if (duration > 0) {
    let bestDelta = Infinity
    for (const r of usable) {
      const rd = Number(r.duration) || 0
      const delta = Math.abs(rd - duration)
      if (delta < bestDelta) {
        bestDelta = delta
        best = r
      }
    }
    // 时长差太大 → 不同版本，同步歌词会整段错位，降级为纯文本
    if (bestDelta > SYNCED_DELTA_LIMIT && best.syncedLyrics) {
      return Response.json(
        {
          ok: true,
          synced: false,
          lrc: null,
          plain: best.plainLyrics || null,
          picked: {
            artist: best.artistName,
            track: best.trackName,
            duration: best.duration,
            delta: Math.round(bestDelta),
            note: 'duration_mismatch_downgrade_to_plain',
          },
        },
        { headers: { 'Cache-Control': 'public, max-age=86400' } },
      )
    }
  } else {
    best = usable.find((r) => r.syncedLyrics) || best
  }

  const bestDur = Number(best.duration) || 0
  const finalDelta = duration > 0 ? Math.abs(bestDur - duration) : 0
  const synced = !!(best.syncedLyrics && (duration <= 0 || finalDelta <= SYNCED_DELTA_LIMIT))
  return Response.json(
    {
      ok: true,
      synced,
      lrc: synced ? best.syncedLyrics : null,
      plain: best.plainLyrics || null,
      picked: {
        artist: best.artistName,
        track: best.trackName,
        duration: best.duration,
        delta: duration > 0 ? Math.round(finalDelta) : null,
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=86400' } },
  )
}
