"use client";

import { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { useMusic } from '../../components/MusicProvider';
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, RefreshCcw,
  Volume2, VolumeX, Search, X, Disc3, Menu
} from 'lucide-react';

export default function MusicClient() {
  const {
    playlist, currentSong, isPlaying, progress, currentTime, duration,
    isLoading, togglePlay, nextSong, prevSong, handleSeek,
    playSong,
    playMode, togglePlayMode,
    volume, setVolume, isMuted, toggleMute,
  } = useMusic();

  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'playlist'>('lyrics');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [parsedLyrics, setParsedLyrics] = useState<any[]>([]);

  // ========== 歌词解析（与 MusicProvider 同步，但 MusicClient 也需要） ==========
  useEffect(() => {
    if (!currentSong) { setParsedLyrics([]); return; }
    const rawLrc = currentSong.lrc || currentSong.lyric ||
      (typeof currentSong.lyrics === 'string' ? currentSong.lyrics : '');
    if (Array.isArray(currentSong.lyrics) && currentSong.lyrics.length > 0) {
      setParsedLyrics(currentSong.lyrics);
      return;
    }
    if (!rawLrc || typeof rawLrc !== 'string') { setParsedLyrics([]); return; }
    const lines = rawLrc.split('\n');
    const parsed: any[] = [];
    const timeExp = /\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
    let hasValidTime = false;
    for (const line of lines) {
      const text = line.replace(/\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim();
      if (!text) continue;
      let match;
      while ((match = timeExp.exec(line)) !== null) {
        hasValidTime = true;
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0;
        parsed.push({ time: min * 60 + sec + ms, text });
      }
    }
    if (hasValidTime) {
      setParsedLyrics(parsed.sort((a, b) => a.time - b.time));
    } else {
      setParsedLyrics(lines.map(l => ({ time: -1, text: l.trim() })).filter((l: any) => l.text));
    }
  }, [currentSong?.id, currentSong?.lyric, currentSong?.lrc, currentSong?.lyrics]);

  // ========== 歌词实时高亮 ==========
  const activeLyricIndex = useMemo(() => {
    if (!parsedLyrics.length) return -1;
    if (parsedLyrics[0].time < 0) return -1; // 静态歌词不高亮
    let idx = parsedLyrics.findIndex((l: any) => l.time > currentTime) - 1;
    if (idx === -2) idx = parsedLyrics.length - 1;
    return Math.max(0, idx);
  }, [currentTime, parsedLyrics]);

  // ========== 歌词自动滚动 ==========
  useEffect(() => {
    if (activeLyricRef.current && lyricContainerRef.current && activeTab === 'lyrics') {
      const container = lyricContainerRef.current;
      const activeItem = activeLyricRef.current;
      const scrollTarget = activeItem.offsetTop - container.offsetHeight / 2 + activeItem.offsetHeight / 2;
      // 长歌词用 instant 避免连续 smooth 卡顿
      const behavior = parsedLyrics.length > 20 && Math.abs(scrollTarget - container.scrollTop) > 300 ? 'auto' : 'smooth';
      container.scrollTo({ top: scrollTarget, behavior });
    }
  }, [activeLyricIndex, activeTab, parsedLyrics.length]);

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPlayModeIcon = () => {
    switch (playMode) {
      case 'loop': return <Repeat size={18} />;
      case 'single': return <RefreshCcw size={18} />;
      case 'random': return <Shuffle size={18} />;
    }
  };

  const getPlayModeClass = () => playMode === 'loop' ? 'text-slate-400 hover:text-indigo-400' : 'text-indigo-400';

  // ========== 歌单按歌手分组 ==========
  const groupedPlaylist = useMemo(() => {
    const filtered = playlist.filter((s: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (s.title || '').toLowerCase().includes(q) ||
             (s.artist || '').toLowerCase().includes(q);
    });
    const groups: Record<string, any[]> = {};
    filtered.forEach((s: any) => {
      const key = s.artist || '未知歌手';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [playlist, searchQuery]);

  const handlePlaySong = (index: number) => {
    playSong(index);
    setDrawerOpen(false);
  };

  // ========== 加载态 ==========
  if (isLoading || !currentSong) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center gap-3 text-indigo-500">
          <Disc3 size={32} className="animate-spin" />
          <span className="font-black tracking-widest text-sm">唤醒音频引擎中...</span>
        </div>
      </div>
    );
  }

  const songCover = currentSong.cover || currentSong.pic || '';

  // ========== 桌面端左栏歌单 ==========
  const PlaylistSidebar = ({ onSongClick }: { onSongClick: (idx: number) => void }) => (
    <div className="h-full flex flex-col bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/5 overflow-hidden">
      {/* 顶部：搜索 + 播放模式 */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text" placeholder="搜索歌曲或歌手..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">歌单 · {playlist.length} 首</span>
          <button onClick={togglePlayMode} className={`p-1.5 rounded-md transition-colors ${getPlayModeClass()}`} title={`播放模式：${playMode}`}>
            {getPlayModeIcon()}
          </button>
        </div>
      </div>

      {/* 歌单列表 */}
      <div className="flex-1 overflow-y-auto py-2 px-1 custom-scrollbar">
        {Object.entries(groupedPlaylist).map(([artist, songs]) => (
          <div key={artist} className="mb-3">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {artist} · {songs.length}
            </div>
            {songs.map((song: any) => {
              const originalIndex = playlist.findIndex((s: any) => s.id === song.id);
              const isActive = song.id === currentSong.id;
              return (
                <button
                  key={song.id}
                  onClick={() => onSongClick(originalIndex)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-300'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-slate-700 relative">
                    <img src={song.cover} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    {isActive && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex gap-[2px] items-end h-2.5">
                          <span className="w-0.5 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_0ms]" />
                          <span className="w-0.5 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_200ms]" />
                          <span className="w-0.5 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_400ms]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold truncate ${isActive ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {song.title || song.name}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0 tabular-nums">{formatTime(song.duration)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // ========== 桌面端右栏歌词 ==========
  const LyricsPanel = () => (
    <div className="h-full flex flex-col bg-slate-900/40 dark:bg-slate-900/50 backdrop-blur-xl border-l border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 text-center">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">歌词</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        {/* 顶部底部渐变蒙层 */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-900/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900/60 to-transparent z-10 pointer-events-none" />

        <div
          ref={lyricContainerRef}
          className="h-full overflow-y-auto py-[25%] px-4 custom-scrollbar"
        >
          {parsedLyrics.length > 0 ? (
            <div className="flex flex-col gap-4">
              {parsedLyrics.map((line: any, index: number) => {
                const isActive = index === activeLyricIndex;
                const staticMode = activeLyricIndex === -1;
                return (
                  <div
                    key={index}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => duration > 0 && line.time >= 0 &&
                      handleSeek({ target: { value: String((line.time / duration) * 100) } } as any)}
                    className={`transition-all duration-500 cursor-pointer rounded-lg px-3 py-1 ${
                      isActive
                        ? 'text-indigo-300 text-lg font-black bg-indigo-500/10'
                        : staticMode
                          ? 'text-slate-400 opacity-75 hover:opacity-95 text-sm font-bold'
                          : 'text-slate-500 opacity-30 hover:opacity-70 text-sm font-bold'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-slate-500 text-center">
                <Disc3 size={24} className="mx-auto mb-2 animate-pulse" />
                <p className="text-sm">纯享音乐 ♪</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ========== 移动端 Drawer 歌单 ==========
  const MobileDrawer = () => (
    <>
      {/* 遮罩 */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>
      {/* Drawer 本体 */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-14 w-[85vw] max-w-[360px] z-[101] bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-black text-white">歌单 · {playlist.length} 首</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" placeholder="搜索..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1 px-1 pb-4">
              {Object.entries(groupedPlaylist).map(([artist, songs]) => (
                <div key={artist} className="mb-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase">{artist}</div>
                  {songs.map((song: any) => {
                    const originalIndex = playlist.findIndex((s: any) => s.id === song.id);
                    const isActive = song.id === currentSong.id;
                    return (
                      <button
                        key={song.id}
                        onClick={() => handlePlaySong(originalIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                          isActive ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                          <img src={song.cover} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold truncate">{song.title || song.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // ========== 主渲染 ==========
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-700">
      <Navbar />

      {/* 移动端 Drawer */}
      <MobileDrawer />

      {/* ============ 桌面端：三栏布局 ============ */}
      <PageTransition>
        {/* 移动端顶部条 */}
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => setDrawerOpen(true)} className="p-1.5 text-slate-300 hover:text-white">
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-white truncate">{currentSong.title}</div>
              <div className="text-[11px] text-slate-400 truncate">{currentSong.artist || '未知歌手'}</div>
            </div>
            <button onClick={togglePlayMode} className={`p-1.5 ${getPlayModeClass()}`}>
              {getPlayModeIcon()}
            </button>
          </div>
        </div>

        {/* 移动端主区 */}
        <div className="md:hidden flex-1 pt-[120px] pb-4 px-4 flex flex-col items-center">
          {/* 旋转唱片 */}
          <div className="relative w-48 h-48 mb-6 flex-shrink-0">
            <div className={`absolute inset-0 m-auto w-[85%] h-[85%] bg-indigo-500/20 blur-[35px] rounded-full ${isPlaying ? 'opacity-90 scale-105' : 'opacity-20 scale-100'} transition-all duration-1000`} />
            <motion.div
              className={`absolute inset-0 w-full h-full rounded-full border-4 border-white/20 overflow-hidden rotating-disc ${isPlaying ? 'scale-100' : 'scale-95'}`}
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            >
              <img src={songCover} alt="cover" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20" />
              </div>
            </motion.div>
          </div>

          {/* 歌名信息 */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-white truncate">{currentSong.title}</h1>
            <p className="text-xs text-slate-400 truncate mt-1">{currentSong.artist || '未知歌手'}</p>
          </div>

          {/* 播放控制 */}
          <div className="w-full max-w-[320px] space-y-4 mb-6">
            <div className="flex items-center justify-center gap-5">
              <button onClick={prevSong} className="text-slate-400 hover:text-white transition-colors">
                <SkipBack size={22} fill="currentColor" />
              </button>
              <button onClick={togglePlay} className="w-16 h-16 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/40 transition-transform hover:scale-105">
                {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} className="ml-0.5" fill="currentColor" />}
              </button>
              <button onClick={nextSong} className="text-slate-400 hover:text-white transition-colors">
                <SkipForward size={22} fill="currentColor" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 tabular-nums w-9 text-right">{formatTime(currentTime)}</span>
              <input
                type="range" min="0" max="100" value={progress || 0}
                onChange={handleSeek}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #6366f1 ${progress}%, rgba(100,116,139,0.3) 0)` }}
              />
              <span className="text-[10px] font-mono text-slate-500 tabular-nums w-9">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="w-full flex items-center justify-center gap-1 p-1 bg-white/5 rounded-full mb-3">
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`flex-1 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'lyrics' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400'}`}
            >歌词</button>
            <button
              onClick={() => setActiveTab('playlist')}
              className={`flex-1 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'playlist' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400'}`}
            >歌单</button>
          </div>

          {/* Tab 内容 */}
          <div className="w-full flex-1 min-h-[200px]">
            {activeTab === 'lyrics' ? (
              <div className="h-full">
                <div
                  ref={lyricContainerRef}
                  className="h-[300px] overflow-y-auto py-[20%] px-4 custom-scrollbar"
                >
                  {parsedLyrics.length > 0 ? (
                    <div className="flex flex-col gap-3 text-center">
                      {parsedLyrics.map((line: any, index: number) => {
                        const isActive = index === activeLyricIndex;
                        const staticMode = activeLyricIndex === -1;
                        return (
                          <div
                            key={index}
                            ref={isActive ? activeLyricRef : null}
                            onClick={() => duration > 0 && line.time >= 0 &&
                              handleSeek({ target: { value: String((line.time / duration) * 100) } } as any)}
                            className={`transition-all duration-500 cursor-pointer ${
                              isActive
                                ? 'text-indigo-300 text-base font-black'
                                : staticMode
                                  ? 'text-slate-500 text-sm opacity-70'
                                  : 'text-slate-600 text-sm opacity-40'
                            }`}
                          >
                            {line.text}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">纯享音乐 ♪</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[300px] overflow-y-auto custom-scrollbar">
                {Object.entries(groupedPlaylist).map(([artist, songs]) => (
                  <div key={artist} className="mb-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase">{artist}</div>
                    {songs.map((song: any) => {
                      const originalIndex = playlist.findIndex((s: any) => s.id === song.id);
                      const isActive = song.id === currentSong.id;
                      return (
                        <button
                          key={song.id}
                          onClick={() => handlePlaySong(originalIndex)}
                          className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left ${
                            isActive ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                            <img src={song.cover} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold truncate">{song.title || song.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 桌面端三栏 */}
        <div className="hidden md:flex h-[calc(100vh-80px)] mt-16">
          {/* 左栏：歌单 */}
          <div className="w-[280px] flex-shrink-0">
            <PlaylistSidebar onSongClick={handlePlaySong} />
          </div>

          {/* 中栏：主播放区 */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            {/* 旋转唱片 */}
            <div className="relative w-64 h-64 flex-shrink-0 mb-8">
              <div className={`absolute inset-0 m-auto w-[85%] h-[85%] bg-indigo-500/25 blur-[40px] rounded-full ${isPlaying ? 'opacity-90 scale-105' : 'opacity-20 scale-100'} transition-all duration-1000`} />
              <motion.div
                className={`absolute inset-0 w-full h-full rounded-full border-[6px] border-white/10 overflow-hidden rotating-disc shadow-2xl ${isPlaying ? 'scale-100' : 'scale-95'}`}
                style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
              >
                <img src={songCover} alt="cover" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 歌名 */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white tracking-tight">{currentSong.title}</h1>
              <p className="text-sm text-slate-400 mt-1">{currentSong.artist || '未知歌手'}</p>
            </div>

            {/* 播放控制 */}
            <div className="w-full max-w-[480px] space-y-6">
              {/* 进度条 */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-500 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range" min="0" max="100" value={progress || 0}
                  onChange={handleSeek}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #6366f1 ${progress}%, rgba(100,116,139,0.3) 0)` }}
                />
                <span className="text-[11px] font-mono text-slate-500 tabular-nums w-10">{formatTime(duration)}</span>
              </div>

              {/* 控制按钮 */}
              <div className="flex items-center justify-center gap-6">
                <button onClick={prevSong} className="text-slate-400 hover:text-white transition-colors">
                  <SkipBack size={24} fill="currentColor" />
                </button>
                <button onClick={togglePlay} className="w-16 h-16 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/40 transition-transform hover:scale-105">
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-0.5" fill="currentColor" />}
                </button>
                <button onClick={nextSong} className="text-slate-400 hover:text-white transition-colors">
                  <SkipForward size={24} fill="currentColor" />
                </button>
              </div>

              {/* 音量 */}
              <div className="flex items-center justify-center gap-3">
                <div className="relative flex items-center gap-2" onMouseLeave={() => setShowVolumeSlider(false)}>
                  {showVolumeSlider && (
                    <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-20">
                      <input
                        type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : (volume || 0)}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #6366f1 ${(volume || 0) * 100}%, rgba(100,116,139,0.3) 0)` }}
                      />
                    </div>
                  )}
                  <button onClick={() => setShowVolumeSlider(!showVolumeSlider)} onDoubleClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右栏：歌词 */}
          <div className="w-[320px] flex-shrink-0">
            <LyricsPanel />
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
