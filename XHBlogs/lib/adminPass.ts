// 后台口令（与 /admin 密码门一致）
//
// 说明：这是个人记事本站，口令本来就是客户端可见的「软门槛」，不存在真正的机密性。
// 这里集中一处，供后台写接口 / 歌单同步复用，避免多处硬编码。
export const ADMIN_PASS = '199527'

export function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  return { 'x-rcj-pass': ADMIN_PASS, ...(extra || {}) }
}
