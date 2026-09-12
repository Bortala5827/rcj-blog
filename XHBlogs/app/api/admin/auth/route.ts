import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

// 后台口令校验（服务端）
//
// 为什么需要它：密码门以前是前端拿硬编码常量比对（仓库公开 = 口令公开）。
// 现在由服务端与 Pages 环境变量 ADMIN_PASS 比对，前端只在通过后把口令
// 暂存 sessionStorage，用于后续写接口的 x-rcj-pass 头。
//
// POST /api/admin/auth  body: { pass }
//   -> { ok: true } / 401 / 503(服务端未配置)
export async function POST(request: NextRequest) {
  let pass = ''
  try {
    pass = String((await request.json())?.pass ?? '')
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 })
  }

  let expected = ''
  try {
    expected = String((getRequestContext() as any)?.env?.ADMIN_PASS || '')
  } catch {
    expected = ''
  }

  if (!expected) {
    return NextResponse.json({ ok: false, error: 'server_not_configured' }, { status: 503 })
  }
  if (!pass || pass !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
