import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

// 网易云歌单 ID 的云端存储（Cloudflare D1，绑定名 DB）
//
// 为什么要有它：此前 ID 只存在浏览器 localStorage（key: rcj_imported_netease_ids），
// 换浏览器 / 清站点数据 / 无痕模式就会「ID 被清除」。放 D1 后：
//   - 换设备、清缓存都还在；
//   - /admin 导入一次，所有设备（PC / 手机）共享同一份歌单。
// 客户端仍保留 localStorage 作为「即时渲染缓存」，服务端才是权威来源。
//
// 接口：
//   GET    /api/music/ids            -> { ok, ids: string[], items: [...] }
//   POST   /api/music/ids            -> body { id, name?, artist?, cover? }  需要 x-rcj-pass
//   DELETE /api/music/ids?id=xxx     -> 需要 x-rcj-pass
//
// 若项目没绑 D1（例如本地 next dev），GET 返回 ok:false，前端静默退回本地缓存，不会报错。

const TABLE = `CREATE TABLE IF NOT EXISTS music_ids (
  id TEXT PRIMARY KEY,
  name TEXT,
  artist TEXT,
  cover TEXT,
  added_at INTEGER NOT NULL
)`

function getDB(): any | null {
  try {
    const env = (getRequestContext() as any)?.env
    return env?.DB ?? null
  } catch {
    return null
  }
}

// 口令来自 Cloudflare Pages 环境变量 ADMIN_PASS（服务端），不再硬编码、不进前端 bundle。
// 未配置时一律拒绝写入 —— 宁可后台暂时不能加歌，也不能让写接口裸奔。
function getAdminPass(): string {
  try {
    return String((getRequestContext() as any)?.env?.ADMIN_PASS || '')
  } catch {
    return ''
  }
}

function isAuthorized(request: NextRequest): boolean {
  const expected = getAdminPass()
  if (!expected) return false
  return request.headers.get('x-rcj-pass') === expected
}

function numId(raw: unknown): string | null {
  const m = String(raw ?? '').match(/\d{4,}/)
  return m ? m[0] : null
}

export async function GET() {
  const db = getDB()
  if (!db) {
    return NextResponse.json({ ok: false, ids: [], reason: 'no-d1-binding' })
  }
  try {
    await db.prepare(TABLE).run()
    const res = await db
      .prepare('SELECT id, name, artist, cover, added_at FROM music_ids ORDER BY added_at ASC')
      .all()
    const items = (res?.results || []).map((r: any) => ({ ...r, id: String(r.id) }))
    return NextResponse.json(
      { ok: true, ids: items.map((i: any) => i.id), items },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    return NextResponse.json({ ok: false, ids: [], error: String(e) })
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const db = getDB()
  if (!db) return NextResponse.json({ ok: false, error: 'no-d1-binding' }, { status: 503 })

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 })
  }

  const id = numId(body?.id)
  if (!id) return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 })

  try {
    await db.prepare(TABLE).run()
    await db
      .prepare(
        `INSERT INTO music_ids (id, name, artist, cover, added_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = COALESCE(excluded.name, music_ids.name),
           artist = COALESCE(excluded.artist, music_ids.artist),
           cover = COALESCE(excluded.cover, music_ids.cover)`,
      )
      .bind(id, body?.name ?? null, body?.artist ?? null, body?.cover ?? null, Date.now())
      .run()
    const res = await db.prepare('SELECT id FROM music_ids ORDER BY added_at ASC').all()
    return NextResponse.json({ ok: true, ids: (res?.results || []).map((r: any) => String(r.id)) })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const db = getDB()
  if (!db) return NextResponse.json({ ok: false, error: 'no-d1-binding' }, { status: 503 })

  const raw = request.nextUrl.searchParams.get('id')
  try {
    await db.prepare(TABLE).run()
    if (raw === 'all') {
      await db.prepare('DELETE FROM music_ids').run()
    } else {
      const id = numId(raw)
      if (!id) return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 })
      await db.prepare('DELETE FROM music_ids WHERE id = ?').bind(id).run()
    }
    const res = await db.prepare('SELECT id FROM music_ids ORDER BY added_at ASC').all()
    return NextResponse.json({ ok: true, ids: (res?.results || []).map((r: any) => String(r.id)) })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
