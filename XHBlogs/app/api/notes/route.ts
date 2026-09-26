// app/api/notes/route.ts
// 留言墙（/board）的便签云端存储 —— 架构完全对齐 /api/music/ids：
//   Cloudflare D1（绑定名 DB）为权威来源，本地 next dev 无绑定时任性降级。
//
// 表结构（懒建表）：
//   notes(id TEXT PRIMARY KEY, name TEXT, content TEXT, color TEXT, ip TEXT, ts INTEGER)
//   rate(ip TEXT PRIMARY KEY, ts INTEGER)        —— 简易限频：60s 一条
//
// GET    /api/notes                -> { ok:true, notes:[{id,name,content,color,ts}] }（空表时自动播 3 条种子）
// POST   /api/notes {name,content} -> { ok:true, note } / 429 太快 / 400 参数
// DELETE /api/notes?id=xxx         -> 需 x-rcj-pass === ADMIN_PASS，{ ok:true }
import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const NOTE_COLORS = ['#fff1e6', '#edf8ee', '#fff8ea', '#e5f5ff', '#fff4dd', '#eee9ff', '#f8edff']
const MAX_CONTENT = 300
const MAX_NAME = 16
const RATE_WINDOW_MS = 60 * 1000

function getDB(): any | null {
  try {
    const env = (getRequestContext() as any)?.env
    return env?.DB ?? null
  } catch {
    return null
  }
}

function getAdminPass(): string {
  try {
    return String((getRequestContext() as any)?.env?.ADMIN_PASS || '')
  } catch {
    return ''
  }
}

async function ensureTables(db: any) {
  await db
    .prepare(
      'CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, name TEXT, content TEXT, color TEXT, ip TEXT, ts INTEGER)'
    )
    .run()
  await db.prepare('CREATE TABLE IF NOT EXISTS note_rate (ip TEXT PRIMARY KEY, ts INTEGER)').run()
}

// 空墙时播 3 条种子（也写进 D1，主人可在后台删掉）
async function seedIfEmpty(db: any): Promise<void> {
  const row = await db.prepare('SELECT COUNT(*) AS c FROM notes').first()
  if (!row || row.c > 0) return
  const now = Date.now()
  const seeds = [
    { id: 'seed-1', name: 'Bortala', content: '欢迎来钉便签！看到就会回～', color: '#fff4dd', ts: now - 3000 },
    { id: 'seed-2', name: '奔奔', content: '汪呜~ 便签墙和聊天都很欢迎你！', color: '#fff1e6', ts: now - 2000 },
    { id: 'seed-3', name: '匿名', content: '第一张便签，留个脚印。', color: '#e5f5ff', ts: now - 1000 },
  ]
  for (const s of seeds) {
    await db
      .prepare('INSERT INTO notes (id, name, content, color, ip, ts) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(s.id, s.name, s.content, s.color, 'seed', s.ts)
      .run()
  }
}

export async function GET() {
  const db = getDB()
  if (!db) {
    // 无绑定（本地 next dev）：优雅降级，前端走本地模式
    return NextResponse.json({ ok: false, error: 'no_db', notes: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    await ensureTables(db)
    await seedIfEmpty(db)
    const { results } = await db.prepare('SELECT id, name, content, color, ts FROM notes ORDER BY ts DESC LIMIT 200').all()
    return NextResponse.json({ ok: true, notes: results || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('notes GET error:', e)
    return NextResponse.json({ ok: false, error: 'db_error', notes: [] }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function POST(request: NextRequest) {
  let body: any = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 })
  }

  const name = String(body?.name ?? '').trim().slice(0, MAX_NAME) || '匿名'
  const content = String(body?.content ?? '').trim()
  const color = NOTE_COLORS.includes(String(body?.color)) ? String(body?.color) : NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]

  if (!content || content.length > MAX_CONTENT) {
    return NextResponse.json({ ok: false, error: 'bad_content' }, { status: 400 })
  }

  const db = getDB()
  if (!db) {
    return NextResponse.json({ ok: false, error: 'no_db' }, { status: 503 })
  }

  try {
    await ensureTables(db)

    // 限频：同一 IP 60s 一条（首次留言的 IP 也会记进来）
    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const recent = await db.prepare('SELECT ts FROM note_rate WHERE ip = ?').bind(ip).first()
    if (recent && Date.now() - recent.ts < RATE_WINDOW_MS) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
    }

    const id = crypto.randomUUID().slice(0, 8)
    const ts = Date.now()
    await db.prepare('INSERT INTO notes (id, name, content, color, ip, ts) VALUES (?, ?, ?, ?, ?, ?)').bind(id, name, content, color, ip, ts).run()
    await db.prepare('INSERT INTO note_rate (ip, ts) VALUES (?, ?) ON CONFLICT(ip) DO UPDATE SET ts = excluded.ts').bind(ip, ts).run()

    return NextResponse.json({ ok: true, note: { id, name, content, color, ts } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('notes POST error:', e)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 })

  const expected = getAdminPass()
  if (!expected) return NextResponse.json({ ok: false, error: 'server_not_configured' }, { status: 503 })
  if (request.headers.get('x-rcj-pass') !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const db = getDB()
  if (!db) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 503 })

  try {
    await db.prepare('DELETE FROM notes WHERE id = ?').bind(id).run()
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('notes DELETE error:', e)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }
}
