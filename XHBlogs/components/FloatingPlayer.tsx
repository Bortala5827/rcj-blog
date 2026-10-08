"use client";

import { usePathname } from 'next/navigation';
import { useMusic } from './MusicProvider';
import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, RefreshCcw, Volume2, VolumeX } from 'lucide-react';

export default function FloatingPlayer() {
  const pathname = usePathname();
  const {
    currentSong, isPlaying, togglePlay, nextSong, prevSong,
    currentTime, duration, progress, handleSeek,
    playMode, togglePlayMode,
    volume, setVolume, isMuted, toggleMute,
    isLoading
  } = useMusic();
  const [isMounted, setIsMounted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || isLoading || !currentSong) return null;

  const isMusicPage = pathname?.startsWith('/music');

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPlayModeIcon = () => {
    switch (playMode) {
      case 'loop': return <Repeat size={16} />;
      case 'single': return <RefreshCcw size={16} />;
      case 'random': return <Shuffle size={16} />;
    }
  };

  const getPlayModeColor = () => playMode === 'loop' ? 'text-slate-400' : 'text-indigo-400';

  // ============== 移动端 mini-bar ==============
  if (!isMusicPage) {
    // 精简态只在移动端显示（桌面端非 /music 页面也显示完整底栏，但去掉进度条和音量）
  }

  return (
    <>
      {/* ============ 桌面端底栏（md+） ============ */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-[9998] h-16 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-white/40 dark:border-white/10 shadow-2xl transition-colors duration-700 safe-area-bottom">
        <div className="h-full max-w-screen-2xl mx-auto flex items-center justify-between px-4 lg:px-8 gap-4">
          {/* 左：封面 + 歌名 + 歌手 */}
          <div className="flex items-center gap-3 w-[280px] min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md relative">
              <img src={currentSong.cover} alt="cover" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex gap-[3px] items-end h-3">
                  <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_0ms]" />
                  <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_200ms]" />
                  <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_400ms]" />
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentSong.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentSong.artist || '未知歌手'}</div>
            </div>
          </div>

          {/* 中：控制按钮 + 进度条 */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-[520px]">
            <div className="flex items-center gap-5">
              <button onClick={prevSong} className="text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button onClick={togglePlay} className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105">
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
              </button>
              <button onClick={nextSong} className="text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>
            {isMusicPage && (
              <div className="flex items-center gap-2 w-full">
                <span className="text-[10px] font-mono text-slate-400 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range" min="0" max="100" value={progress || 0}
                  onChange={handleSeek}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #6366f1 ${progress}%, rgba(148,163,184,0.3) 0)` }}
                />
                <span className="text-[10px] font-mono text-slate-400 tabular-nums w-10">{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* 右：播放模式 + 音量 */}
          <div className="flex items-center gap-3 w-[200px] justify-end">
            <button onClick={togglePlayMode} className={`transition-colors ${getPlayModeColor()} hover:text-indigo-500`}>
              {getPlayModeIcon()}
            </button>
            {isMusicPage && (
              <>
                <div className="flex items-center gap-2" onMouseLeave={() => setShowVolumeSlider(false)}>
                  {showVolumeSlider && (
                    <div className="w-24">
                      <input
                        type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : (volume || 0)}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #6366f1 ${(volume || 0) * 100}%, rgba(148,163,184,0.3) 0)` }}
                      />
                    </div>
                  )}
                  <button onClick={() => setShowVolumeSlider(!showVolumeSlider)} onDoubleClick={toggleMute} className="text-slate-500 hover:text-indigo-500 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============ 移动端 mini-bar（md 以下） ============ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9998] h-14 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/40 dark:border-white/10 shadow-2xl safe-area-bottom">
        <div className="h-full flex items-center justify-between px-3 gap-3">
          {/* 封面 + 歌名 */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
              <img src={currentSong.cover} alt="cover" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentSong.title}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentSong.artist || '未知歌手'}</div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center gap-1.5">
            <button onClick={prevSong} className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button onClick={togglePlay} className="w-9 h-9 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-500/30">
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={nextSong} className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>
        {/* 细线进度条（移动端） */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700/60">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress || 0}%` }} />
        </div>
      </div>
    </>
  );
}
