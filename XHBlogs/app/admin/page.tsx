"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../../siteConfig';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { useRouter } from 'next/navigation';

// 与 MusicProvider 共用同一个 localStorage key，使后台导入的歌单直接出现在 /music
const STORAGE_KEY = 'rcj_imported_netease_ids';

export default function AdminDashboard() {
  const router = useRouter();

  // 当前选中的功能模块（后台左侧导航）
  const [activeTab, setActiveTab] = useState('music');

  // 歌单管理状态
  const [ids, setIds] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [newId, setNewId] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState('');

  // 读取 localStorage 中已导入的网易云 ID
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setIds(arr.filter((x: any) => typeof x === 'string' && /^\d+$/.test(x)));
        }
      }
    } catch { /* ignore */ }
  }, []);

  // 持久化 + 同步状态
  const persist = useCallback((next: string[]) => {
    setIds(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  // 拉取所有已导入 ID 的封面/标题（真实查询）
  const loadDetails = useCallback(async (idList: string[]) => {
    if (idList.length === 0) { setDetails({}); return; }
    try {
      const res = await fetch(`/api/music?ids=${idList.join(',')}`);
      const data = await res.json();
      const map: Record<string, any> = {};
      (Array.isArray(data) ? data : []).forEach((s: any) => { if (s && s.id) map[s.id] = s; });
      setDetails(map);
    } catch {
      setDetails({});
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
      else setQueryError('未找到该歌曲，或外链暂不可用');
    } catch {
      setQueryError('查询失败，请检查网络');
    } finally {
      setQueryLoading(false);
    }
  };

  const confirmAddMusic = () => {
    if (!queryResult) return;
    const id = String(queryResult.id);
    if (!ids.includes(id)) persist([...ids, id]);
    setNewId('');
    setQueryResult(null);
  };

  const removeSong = (index: number) => {
    const next = ids.filter((_, i) => i !== index);
    persist(next);
  };

  const menuItems = [
    { id: 'dashboard', name: '全息仪表盘', icon: '🌌' },
    { id: 'music', name: '歌单管理', icon: '🎵' },
    { id: 'gallery', name: '光影画廊', icon: '🖼️' },
    { id: 'settings', name: '系统核心配置', icon: '⚙️' },
  ];

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

        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 min-h-[500px] shadow-lg">
          {activeTab === 'music' && (
            <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl">
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8">🎵 歌单管理与查询</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 左：已导入的网易云 ID 列表 */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-4">当前歌单中的网易云 ID ({ids.length})</p>
                  <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {ids.length === 0 && (
                      <p className="text-sm text-slate-400 py-6 text-center">还没有导入歌曲，右侧粘贴网易云 ID 试试 🎶</p>
                    )}
                    {ids.map((id, index) => {
                      const detail = details[id];
                      return (
                        <div key={`${id}-${index}`} className="flex justify-between items-center p-3 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/20 group">
                          <div className="flex items-center gap-3">
                            {detail?.cover ? (
                              <img src={detail.cover} alt="cover" className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center text-xs">💿</div>
                            )}
                            <div className="flex flex-col">
                              {detail ? (
                                <>
                                  <span className={`text-sm font-bold line-clamp-1 ${detail.error ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{detail.name}</span>
                                  {!detail.error && <span className="text-[10px] text-slate-500 font-medium">{detail.artist}</span>}
                                </>
                              ) : (
                                <span className="text-xs text-slate-400">正在解析...</span>
                              )}
                              <span className="text-[10px] font-mono text-pink-500 mt-0.5">#{id}</span>
                            </div>
                          </div>
                          <button onClick={() => removeSong(index)} className="w-8 h-8 shrink-0 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center justify-center">✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 右：校验并添加新 ID */}
                <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-3xl p-6 space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase">校验并添加新 ID</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="粘贴网易云歌曲 ID 或分享链接" value={newId} onChange={e => setNewId(e.target.value)} onKeyDown={e => e.key === 'Enter' && queryMusic()} className="flex-1 bg-white dark:bg-slate-900 border-none rounded-2xl px-4 py-3 text-sm outline-none shadow-sm" />
                    <button onClick={queryMusic} disabled={queryLoading} className="px-6 py-3 bg-pink-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-pink-500/20 disabled:opacity-50">
                      {queryLoading ? "请求中..." : "真实查询"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {queryResult && !queryResult.error && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-green-500/30 flex justify-between items-center shadow-xl">
                        <div className="flex items-center gap-3">
                          <img src={queryResult.cover} alt="cover" className="w-10 h-10 rounded-lg object-cover" />
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
              </div>
            </motion.section>
          )}

          {activeTab !== 'music' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 gap-4 pt-20">
              <span className="text-6xl opacity-60">{menuItems.find(m => m.id === activeTab)?.icon}</span>
              <p className="font-bold tracking-widest text-sm">该模块即将部署于此</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
