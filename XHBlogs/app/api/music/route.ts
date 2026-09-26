import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// 兼容 edge / node 运行时的超时信号（AbortSignal.timeout 在某些运行时不可用）
function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  ctrl.signal.addEventListener('abort', () => clearTimeout(timer));
  return ctrl.signal;
}

const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
}

type SongResult = {
  id: string
  name?: string
  artist?: string
  author?: string
  cover?: string
  pic?: string
  coverRaw?: string
  url?: string
  lrc?: string
  error?: string
}

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
  }

  const songIds = ids.split(',').map((id) => id.trim()).filter(Boolean)

  const results: SongResult[] = await Promise.all(
    songIds.map(async (songId): Promise<SongResult> => {
      try {
        const [detailRes, lrcRes] = await Promise.all([
          fetch(
            `https://music.163.com/api/song/detail/?id=${songId}&ids=[${songId}]`,
            { headers: NET_EASE_HEADERS, signal: timeoutSignal(6000) },
          ),
          fetch(
            `https://music.163.com/api/song/lyric?id=${songId}&lv=-1&kv=-1&tv=-1`,
            { headers: NET_EASE_HEADERS, signal: timeoutSignal(6000) },
          ).catch(() => null),
        ])

        const detail = await detailRes.json()
        const song = detail.songs?.[0]

        if (!song) {
          return { id: songId, error: 'not_found' }
        }

        let lrcText = ''
        if (lrcRes && lrcRes.ok) {
          try {
            const lrcData = await lrcRes.json()
            lrcText = lrcData.lrc?.lyric || ''
          } catch {
            /* 歌词可选，失败不影响主流程 */
          }
        }

        const artistName = song.artists?.[0]?.name || '未知歌手'
        const cover = song.album?.picUrl || ''

        return {
          id: songId,
          name: song.name,
          artist: artistName,
          author: artistName,
          // 封面也走同源代理：部分网络访问不到 *.music.126.net，直连会「破图」
          cover: cover ? `/api/music/img?u=${encodeURIComponent(cover)}` : '',
          pic: cover ? `/api/music/img?u=${encodeURIComponent(cover)}` : '',
          coverRaw: cover,
          // 指向同源音频代理（服务端补 Referer/UA 并透传流），避免浏览器直连外链被混合内容/Referer 拦截
          url: `/api/music/stream?id=${songId}`,
          lrc: lrcText,
        }
      } catch (error) {
        console.error(`[api/music] 获取歌曲 ${songId} 失败:`, error)
        return { id: songId, error: String(error) }
      }
    }),
  )

  return NextResponse.json(results)
}
