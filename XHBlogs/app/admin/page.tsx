"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../../siteConfig';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { useRouter } from 'next/navigation';
import { adminHeaders, getAdminPass, setAdminPass, clearAdminPass } from '../../lib/adminPass';

// 与 MusicProvider 共用同一个 localStorage key（缓存）；云端（D1）为权威来源
const STORAGE_KEY = 'rcj_imported_netease_ids';
const UNLOCK_KEY = 'rcj_admin_unlocked';

export default function AdminDashboard() {
  const router = useRouter();

  // 密码门
  const [unlocked, setUnlocked] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    try {
      if (sessionStorage.getItem(UNLOCK_KEY) === '1' && getAdminPass()) setUnlocked(true);
    } catch { /* ignore */ }
  }, []);

  // 口令交给服务端校验（前端不再持有硬编码口令）
  const doUnlock = async () => {
    setPwdError('');
    try {
      const r = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pass: pwdInput }),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) {
        setAdminPass(pwdInput);
        try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch { /* ignore */ }
        setUnlocked(true);
        return;
      }
      setPwdError(d?.error === 'server_not_configured' ? '服务端未配置 ADMIN_PASS，请先在 Cloudflare 配置' : '口令错误，请重试');
    } catch {
      setPwdError('校验失败，请检查网络');
    }
  };

  // 当前选中的功能模块
  const [activeTab, setActiveTab] = useState('dashboard');

  // 歌单管理状态
  const [ids, setIds] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [newId, setNewId] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState('');
  const [cloudState, setCloudState] = useState<'idle' | 'synced' | 'local'>('idle');
  // D1 里的自托管曲（source='local'，即「陪在你身边」）：与网易云 ID 一样是库里的一条记录
  const [localItem, setLocalItem] = useState<any | null>(null);

  // 读歌单：云端（D1）优先，取不到则退回本地缓存
  useEffect(() => {
    let alive = true;
    const readLocal = (): string[] => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr.filter((x: any) => typeof x === 'string' && /^\d+$/.test(x)) : [];
      } catch { return []; }
    };
    const local = readLocal();
    if (local.length) setIds(local);

    fetch('/api/music/ids', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d && d.ok === true && Array.isArray(d.ids)) {
          // 这份列表只放网易云 ID；自托管曲（source='local'）单独渲染，不混进 ID 列表
          const serverIds = d.ids.filter((x: any) => typeof x === 'string' && /^\d+$/.test(x));
          setIds(serverIds);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serverIds)); } catch { /* ignore */ }
          const items: any[] = Array.isArray(d.items) ? d.items : [];
          setLocalItem(items.find((i: any) => String(i?.source || 'netease') === 'local') || null);
          setCloudState('synced');
        } else {
          setCloudState('local');
        }
      })
      .catch(() => { if (alive) setCloudState('local'); });

    return () => { alive = false; };
  }, []);

  // 本地持久化（缓存）+ 云端同步
  const persist = useCallback((next: string[]) => {
    setIds(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const addToCloud = useCallback(async (song: any) => {
    try {
      const r = await fetch('/api/music/ids', {
        method: 'POST',
        headers: adminHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({
          id: song?.id,
          name: song?.name,
          artist: song?.artist || song?.author,
          cover: song?.coverRaw || song?.cover,
          // 自托管曲才需要地址；网易云的播放地址由 /api/music/stream 现算，不入库
          url: song?.source === 'local' ? song?.url : undefined,
          source: song?.source,
        }),
      });
      const d = await r.json();
      if (d?.ok) { setCloudState('synced'); return true; }
      setCloudState('local');
      return false;
    } catch { setCloudState('local'); return false; }
  }, []);

  const removeFromCloud = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/music/ids?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      const d = await r.json();
      if (Array.isArray(d?.ids)) setIds(d.ids);
    } catch { /* ignore */ }
  }, []);

  // 拉取所有已导入 ID 的封面/标题（真实查询）；逐个容错，不整体卡死
  const loadDetails = useCallback(async (idList: string[]) => {
    if (idList.length === 0) { setDetails({}); setDetailsLoading(false); return; }
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/music?ids=${idList.join(',')}`);
      const data = await res.json();
      const map: Record<string, any> = {};
      (Array.isArray(data) ? data : []).forEach((s: any) => { if (s && s.id) map[s.id] = s; });
      setDetails(map);
    } catch {
      setDetails({});
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const idsKey = ids.join(',');
  useEffect(() => { loadDetails(ids); /* eslint-disable-next-line */ }, [idsKey]);

  // 真实查询单个 ID（支持粘贴分享链接，自动提取数字 ID）
  const queryMusic = async () => {
    const matched = newId.trim().match(/\d{4,}/);
    const id = matched ? matched[0] : newId.trim();
    if (!/^\d+$/.test(id)) {
      setQueryError('请输入网易云歌曲 ID 或分享链接');
      setQueryResult(null);
      return;
    }
    setQueryLoading(true); setQueryError(''); setQueryResult(null);
    try {
      const res = await fetch(`/api/music?ids=${id}`);
      const data = await res.json();
      const song = Array.isArray(data) ? data[0] : data;
      if (song && song.url && !song.error) setQueryResult(song);
      else if (song?.error) setQueryError('该歌曲已下架或暂不可用');
      else setQueryError('未找到该歌曲，或外链暂不可用');
    } catch {
      setQueryError('查询失败，请检查网络');
    } finally {
      setQueryLoading(false);
    }
  };

  const confirmAddMusic = async () => {
    if (!queryResult) return;
    const id = String(queryResult.id);
    if (!ids.includes(id)) persist([...ids, id]);
    setNewId('');
    setQueryResult(null);
    // 同步到云端（D1）：换设备 / 清缓存都不会再丢
    addToCloud({ ...queryResult, id });
  };

  const removeSong = (index: number) => {
    const target = ids[index];
    persist(ids.filter((_, i) => i !== index));
    if (target) removeFromCloud(target);
  };

  const clearAll = () => {
    persist([]);
    setDetails({});
    setLocalItem(null);
    removeFromCloud('all');
  };

  const m = siteConfig.music;

  // 自托管曲（「陪在你身边」）：权威来源是 D1 里那条 source='local' 的记录；
  // 云端还没连上（未绑 D1 / 离线）时才退回 siteConfig 兜底。
  const localTrack = localItem
    ? {
        id: 'r2-local',
        title: localItem.name || m?.title || '默认曲目',
        artist: localItem.artist || m?.artist || '——',
        cover: localItem.cover || m?.cover || '',
      }
    : cloudState === 'synced'
      ? null
      : m
        ? { id: 'r2-local', title: m.title || '默认曲目', artist: m.artist || '——', cover: m.cover || '' }
        : null;

  // 从歌单移除 / 重新加回自托管曲（都写 D1，前台 /music 跟着变）
  const removeLocalTrack = async () => {
    setLocalItem(null);
    await removeFromCloud('r2-local');
  };

  const restoreLocalTrack = async () => {
    const meta = {
      id: 'r2-local',
      name: m?.title || '陪在你身边',
      artist: m?.artist || '——',
      cover: m?.cover || '',
      url: m?.url || '/soba-ni-iru-ne.webm',
      source: 'local' as const,
    };
    const ok = await addToCloud({ ...meta, id: 'r2-local' });
    if (ok) setLocalItem({ ...meta, source: 'local' });
  };

  const menuItems = [
    { id: 'dashboard', name: '全息仪表盘', icon: '🌌' },
    { id: 'music', name: '歌单管理', icon: '🎵' },
    { id: 'gallery', name: '光影画廊', icon: '🖼️' },
    { id: 'settings', name: '系统核心配置', icon: '⚙️' },
  ];

  // ============ 锁屏 ============
  if (!unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
        <Navbar />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl mt-10"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30 mb-3">🔐</div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-wider">管理面板已加锁</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">请输入访问口令</p>
          </div>
          <input
            type="password"
            value={pwdInput}
            onChange={e => setPwdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doUnlock()}
            placeholder="••••••"
            className="w-full bg-white dark:bg-slate-800 border border-white/50 dark:border-slate-700 rounded-2xl px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-inner"
          />
          {pwdError && <p className="text-[11px] text-red-500 font-medium text-center mt-2">{pwdError}</p>}
          <button
            onClick={doUnlock}
            className="w-full mt-4 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
          >
            解 锁
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 md:px-10 flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto relative z-10">
      {/* 左侧中枢导航栏 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-64 shrink-0 flex flex-col gap-6"
      >
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 flex flex-col items-center shadow-lg">
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <img src={siteConfig.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800" />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-wider">{siteConfig.authorName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold tracking-[0.2em] uppercase">CMS Administrator</p>
        </div>

        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 shadow-lg flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm
                ${activeTab === item.id
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 translate-x-2'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1'}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => { try { sessionStorage.removeItem(UNLOCK_KEY); } catch {} clearAdminPass(); setUnlocked(false); }}
          className="px-4 py-3 rounded-2xl bg-white/30 dark:bg-slate-800/30 text-slate-500 hover:text-red-500 font-bold text-sm border border-white/40 dark:border-slate-700/50 transition-colors"
        >
          🚪 锁定退出
        </button>
      </motion.div>

      {/* 右侧工作区 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col gap-6"
      >
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl h-20 px-6 flex items-center justify-between shadow-lg">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            {menuItems.find(m => m.id === activeTab)?.name}
          </h1>
          <button
            onClick={() => router.push('/music')}
            className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95"
          >
            🎧 前往播放页
          </button>
        </div>

        {/* ============ 仪表盘 ============ */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🌐', label: '部署平台', value: 'Cloudflare Pages', sub: 'git 绑定自动构建' },
              { icon: '🎶', label: '主曲目', value: m?.title || '陪在你身边', sub: 'R2 自托管 · WebM' },
              { icon: '📥', label: '已导入网易云', value: `${ids.length} 首`, sub: cloudState === 'synced' ? '云端 D1 同步' : cloudState === 'local' ? '仅本地缓存' : '外链直连播放' },
              { icon: '🔗', label: '站点地址', value: 'blog.955827.xyz', sub: 'RCJ 生态 · Bortala' },
            ].map((card) => (
              <div key={card.label} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 shadow-lg hover:-translate-y-1 transition-transform">
                <div className="text-3xl mb-3">{card.icon}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-1 truncate">{card.value}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{card.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ============ 歌单管理 ============ */}
        {activeTab === 'music' && (
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">🎵 歌单管理与查询</h2>

            {/* 导入框 */}
            <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-3xl p-5 mb-6 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase">校验并添加新 ID（支持粘贴网易云分享链接，自动提取数字 ID）</p>
              <div className="flex gap-2">
                <input type="text" placeholder="例如 186016 或 https://music.163.com/song?id=186016" value={newId} onChange={e => setNewId(e.target.value)} onKeyDown={e => e.key === 'Enter' && queryMusic()} className="flex-1 bg-white dark:bg-slate-900 border-none rounded-2xl px-4 py-3 text-sm outline-none shadow-sm" />
                <button onClick={queryMusic} disabled={queryLoading} className="px-6 py-3 bg-pink-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-pink-500/20 disabled:opacity-50">
                  {queryLoading ? "请求中..." : "真实查询"}
                </button>
              </div>
              <AnimatePresence>
                {queryResult && !queryResult.error && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-green-500/30 flex justify-between items-center shadow-xl">
                    <div className="flex items-center gap-3">
                      <img src={queryResult.cover} alt="cover" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="text-[10px] font-black text-green-600">获取成功</p>
                        <p className="text-xs font-bold line-clamp-1">{queryResult.name}</p>
                        <p className="text-[10px] text-slate-500">{queryResult.artist}</p>
                      </div>
                    </div>
                    <button onClick={confirmAddMusic} className="px-3 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black shrink-0 hover:bg-green-600 transition-colors">存入列表</button>
                  </motion.div>
                )}
              </AnimatePresence>
              {queryError && <p className="text-[11px] text-red-500 font-medium">{queryError}</p>}
              <div className="text-[11px] text-slate-400 leading-relaxed bg-white/40 dark:bg-slate-900/40 rounded-2xl p-4 border border-white/30">
                💡 网易云音乐支持外链直连，导入后歌曲通过 <code className="font-mono text-pink-500">/api/music</code> 实时解析封面与标题，并在 <span className="font-black text-indigo-500">/music</span> 页面直接播放，无需落地任何音频文件。
              </div>
            </div>

            {/* 真实歌单：R2 默认曲 + 已导入网易云 */}
            <p className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-3">当前播放歌单（与 /music 实时同步）</p>
            <div className="max-h-[420px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {/* 自托管曲（「陪在你身边」）：和网易云歌曲一样是 D1 里的一条记录，可删可恢复 */}
              {localTrack ? (
                <div className="flex justify-between items-center p-3 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-indigo-500/20 group">
                  <div className="flex items-center gap-3">
                    {localTrack.cover ? (
                      <img src={localTrack.cover} alt="cover" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">🎧</div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{localTrack.title}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{localTrack.artist}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">自托管</span>
                    <button onClick={removeLocalTrack} title="从歌单移除" className="w-8 h-8 shrink-0 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center justify-center">✕</button>
                  </div>
                </div>
              ) : (
                cloudState === 'synced' && (
                  <button onClick={restoreLocalTrack} className="w-full p-3 rounded-2xl border border-dashed border-indigo-500/40 text-[11px] font-black text-indigo-500 hover:bg-indigo-500/5 transition-colors">
                    ＋ 把「{m?.title || '陪在你身边'}」加回歌单
                  </button>
                )
              )}

              {ids.length === 0 && (
                <p className="text-sm text-slate-400 py-6 text-center">还没有导入网易云歌曲，上方粘贴 ID 试试 🎶</p>
              )}

              {ids.map((id, index) => {
                const detail = details[id];
                const isError = detail?.error;
                return (
                  <div key={`${id}-${index}`} className="flex justify-between items-center p-3 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/20 group">
                    <div className="flex items-center gap-3 min-w-0">
                      {detail?.cover ? (
                        <img src={detail.cover} alt="cover" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                          {detailsLoading ? '⏳' : '💿'}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        {detail && !isError ? (
                          <>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{detail.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium truncate">{detail.artist}</span>
                          </>
                        ) : isError ? (
                          <span className="text-xs font-bold text-red-500 truncate">已下架 / 未找到</span>
                        ) : (
                          <span className="text-xs text-slate-400 truncate">{detailsLoading ? '解析中…' : '未找到'}</span>
                        )}
                        <span className="text-[10px] font-mono text-pink-500 mt-0.5">#{id}</span>
                      </div>
                    </div>
                    <button onClick={() => removeSong(index)} className="w-8 h-8 shrink-0 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center justify-center">✕</button>
                  </div>
                );
              })}
            </div>

            {ids.length > 0 && (
              <button onClick={clearAll} className="mt-4 text-[11px] text-slate-400 hover:text-red-500 font-medium transition-colors">
                清空全部导入歌单
              </button>
            )}
          </div>
        )}

        {/* ============ 光影画廊 ============ */}
        {activeTab === 'gallery' && (
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">🖼️ 光影画廊</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">博客已融入的两张个人照片（本地资源，无外链依赖）：</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['/blog-photo-1.png', '/blog-photo-2.jpg'].map((src) => (
                <div key={src} className="rounded-2xl overflow-hidden border border-white/40 shadow-lg aspect-square bg-slate-100 dark:bg-slate-800">
                  <img src={src} alt={src} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/photowall')} className="mt-6 h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-sm shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all active:scale-95">
              📷 前往照片墙
            </button>
          </div>
        )}

        {/* ============ 系统核心配置 ============ */}
        {activeTab === 'settings' && (
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">⚙️ 系统核心配置</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { k: '站点标题', v: siteConfig.title },
                { k: '作者', v: siteConfig.authorName },
                { k: '部署平台', v: 'Cloudflare Pages（git 绑定自动部署）' },
                { k: '音乐源', v: m?.source === 'r2' ? 'R2 自托管（WebM）' : '未知' },
                { k: '默认曲目', v: m?.title || '—' },
                { k: '管理口令', v: '已启用（服务端校验 · 仅会话内有效）' },
              ].map((row) => (
                <div key={row.k} className="bg-white/40 dark:bg-slate-800/40 rounded-2xl p-4 border border-white/30">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.k}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mt-1 break-words">{row.v}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-white/40 dark:bg-slate-900/40 rounded-2xl p-4 border border-white/30 mt-4">
              🔒 管理面板为客户端口令防护（sessionStorage 解锁，刷新会话需重新输入），适用于个人自娱博客的轻量隔离。如需更强保护，应将校验移至服务端。
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
