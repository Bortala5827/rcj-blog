// 后台口令工具
//
// 安全模型（2026-09-12 加固）：
//   口令**不再硬编码在前端代码里** —— 本仓库是公开仓库，硬编码等于把口令公开，
//   任何人都能拿它去写 /api/music/ids，把歌单塞满（"被滥用"）。
//
//   现在：口令只在管理员于 /admin 输入后存进 sessionStorage，
//   随后由 adminHeaders() 作为请求头发给服务端，由服务端与
//   Cloudflare Pages 环境变量 ADMIN_PASS 比对。
//   也就是说：**D1 歌单只有持有口令的后台能写，前台与访客只能读。**
export const PASS_STORAGE_KEY = 'rcj_admin_pass';

export function getAdminPass(): string {
  try { return sessionStorage.getItem(PASS_STORAGE_KEY) || ''; } catch { return ''; }
}

export function setAdminPass(pass: string) {
  try { sessionStorage.setItem(PASS_STORAGE_KEY, pass); } catch { /* ignore */ }
}

export function clearAdminPass() {
  try { sessionStorage.removeItem(PASS_STORAGE_KEY); } catch { /* ignore */ }
}

export function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  return { 'x-rcj-pass': getAdminPass(), ...(extra || {}) };
}
