"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '../siteConfig';

// 【增强版 LRC 歌词解析】
function parseLrc(lrcText: string) {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result = [];

  for (let line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      let text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

      // 剔除控制字符
      const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

      if (cleanText) {
        for (const match of matches) {
          const min = parseInt(match[1]);
          const sec = parseInt(match[2]);
          const ms = match[3] ? parseInt(match[3]) : 0;
          const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
          const time = min * 60 + sec + ms / divisor;
          result.push({ time, text: cleanText });
        }
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

// 🌟 1. 扩充 Context 类型，加入 MusicPage 需要的所有属性
type PlayMode = 'loop' | 'single' | 'random';

interface MusicContextType {
  playlist: any[];
  currentIndex: number;
  currentSong: any; // 扩展了 lyrics 属性
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;

  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  selectSong: (index: number) => void; // playSong 的别名（兼容 /music 里两种调用）
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
  // 歌单（网易云 ID）：D1 为权威来源，前台只读
  importedIds: string[];
  cloudSynced: boolean; // 是否已成功与云端（D1）对齐
  refreshFromCloud: () => Promise<void>; // 手动对齐（一般不需要调，路由/可见性会自动触发）
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在连接高可用神经云端...");
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 2. 新增音量和播放模式状态
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');

  const audioRef = useRef<HTMLAudioElement>(null);
  const pathname = usePathname(); // 站内路由变化时重新对齐云端歌单，见下方 effect

  // ===== 网易云 ID 导入：后台管理面板“导入网易云音乐的 id”的精髓 =====
  // 存储策略：Cloudflare D1 为准（换设备/清缓存都还在），localStorage 只做「即时渲染缓存」
  const IMPORT_STORAGE_KEY = 'rcj_imported_netease_ids';
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [cloudSynced, setCloudSynced] = useState(false);
  // 云端（D1）里那条自托管曲（source='local'，如「陪在你身边」）：
  //   null        = 云端没连上（用 siteConfig 兜底）
  //   {present:false} = 云端明确没有它（后台删过）→ 歌单里就不显示
  //   {present:true, meta} = 云端有 → 用库里的标题/歌手/封面/地址
  const [cloudLocal, setCloudLocal] = useState<{ present: boolean; meta?: any } | null>(null);

  const readLocal = useCallback((): string[] => {
    try {
      const raw = localStorage.getItem(IMPORT_STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((id: any) => typeof id === 'string' && /^\d+$/.test(id)) : [];
    } catch { return []; }
  }, []);

  const writeLocal = useCallback((ids: string[]) => {
    try { localStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  }, []);

  // 从云端（D1）拉取权威歌单；前台只读，写入一律走 /admin（口令 + 服务端校验）
  const refreshFromCloud = useCallback(async () => {
    try {
      const r = await fetch('/api/music/ids', { cache: 'no-store' });
      const d = await r.json();
      if (!d || d.ok !== true || !Array.isArray(d.ids)) return; // 没绑 D1：沿用本地缓存
      const items: any[] = Array.isArray(d.items) ? d.items : [];
      // 网易云条目：歌单主体（换设备/清缓存都在 D1 里）
      const serverIds: string[] = d.ids.filter((x: any) => typeof x === 'string' && /^\d+$/.test(x));
      setImportedIds(serverIds);
      writeLocal(serverIds);
      // 自托管曲（source='local'）也由 D1 说了算：库里有 → 显示，后台删了 → 不显示
      const localItem = items.find((i: any) => String(i?.source || 'netease') === 'local');
      setCloudLocal(localItem ? { present: true, meta: localItem } : { present: false });
      setCloudSynced(true);
    } catch { /* 云端不可达：沿用本地缓存 */ }
  }, [writeLocal]);

  // 1) 挂载：本地缓存先渲染（秒开），随后云端覆盖
  useEffect(() => {
    const local = readLocal();
    if (local.length) setImportedIds(local);
    refreshFromCloud();
  }, [readLocal, refreshFromCloud]);

  // 2) 路由变化时重新对齐 —— 修「后台加完歌、站内导航切到 /music 看不到新歌」的 bug：
  //    Provider 挂在 layout 上，站内跳转不会重新挂载，只靠挂载时拉一次就会漏掉新数据。
  useEffect(() => {
    refreshFromCloud();
  }, [pathname, refreshFromCloud]);

  // 3) 切回本页/本标签页时重新对齐 —— 覆盖「在后台另一个标签页加完歌，切回音乐页」的场景
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshFromCloud();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [refreshFromCloud]);

  useEffect(() => {
    let isMounted = true;

    const m = siteConfig.music;
    // 自托管曲（「陪在你身边」）的权威来源是 D1：
    //   云端有这条记录 → 用它（标题/歌手/封面/地址都可在库里改）；
    //   云端明确没有（后台删过）→ 歌单里不出现；
    //   云端没连上（未绑 D1 / 离线）→ 退回 siteConfig，本地开发与旧行为不变。
    const localMeta: any = cloudLocal?.present ? cloudLocal.meta || {} : null;
    const localUrl = (localMeta?.url || m?.url) as string | undefined;
    const wantLocal = cloudLocal === null ? true : !!cloudLocal.present;
    const localReady = wantLocal && !!localUrl && !String(localUrl).includes('__REPLACE');

    const r2Track = localReady
      ? [{
          id: 'r2-local',
          title: localMeta?.name || m?.title || '未知歌曲',
          artist: localMeta?.artist || m?.artist || '未知歌手',
          cover: localMeta?.cover || m?.cover || 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
          src: localUrl as string,
          lrcUrl: null,
          lyrics: [] as any[],
        }]
      : [];

    // 网易云歌单 = 配置里的固定 ID + 后台导入的 ID（外链直连，无需版权文件落地）
    // 去重：同一个 ID 既在配置里又在后台导入过时，避免 React key 冲突
    const neteaseIds = [...new Set([...(siteConfig.cloudMusicIds || []), ...importedIds])];

    const fetchMusicData = async () => {
      try {
        const res = await fetch(`/api/music?ids=${neteaseIds.join(',')}`);
        const rawResults = await res.json();
        const merged = rawResults
          .filter((song: any) => song && song.url && !song.error)
          .map((song: any) => ({
            id: song.id || Math.random().toString(),
            title: song.name || '未知歌曲',
            artist: song.artist || song.author || '未知歌手',
            cover: song.cover || song.pic || 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
            src: song.url,
            lrcUrl: null,
            lyrics: song.lrc ? parseLrc(song.lrc) : [],
          }));
        if (!isMounted) return;
        const playlist = [...r2Track, ...merged];
        if (playlist.length > 0) setPlaylist(playlist);
        else setCurrentLyric("云端链路受阻");
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        const playlist = [...r2Track];
        if (playlist.length > 0) setPlaylist(playlist);
        else setCurrentLyric("网络初始化失败");
        setIsLoading(false);
      }
    };

    if (neteaseIds.length > 0) {
      fetchMusicData();
    } else {
      if (r2Track.length > 0) setPlaylist(r2Track);
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [importedIds]);

  useEffect(() => {
    if (playlist.length === 0) return;
    let isMounted = true;
    const currentSong = playlist[currentIndex];
    setLyrics([]);
    setCurrentLyric("♪ 正在缓冲 ♪");
    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      if (isMounted) {
        setLyrics(currentSong.lyrics);
        setCurrentLyric(currentSong.lyrics[0]?.text || "\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
      }
    } else if (currentSong.lrcUrl) {
      fetch(currentSong.lrcUrl)
        .then(res => res.text())
        .then(text => {
          if (isMounted) {
             const parsed = parseLrc(text);
             setLyrics(parsed);
             setPlaylist(prev => {
                const newPlaylist = [...prev];
                newPlaylist[currentIndex].lyrics = parsed;
                return newPlaylist;
             });
          }
        })
        .catch(() => { if (isMounted) setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a"); });
    } else {
      // 无 LRC 的自托管曲目（如 R2）：直接提示纯享音乐，避免永远停留在「正在缓冲」
      setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
    }

    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
    return () => { isMounted = false; };
  }, [currentIndex, playlist.length]); // 移除 playlist 依赖防止无限循环，只依赖长度

  // 🌟 4. 同步音量到 audio 元素
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(!isPlaying);
    }
  };

  // 🌟 5. 重写 nextSong，加入对随机模式的处理
  const nextSong = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const prevSong = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  // 🌟 6. 暴露直接播放指定歌曲的方法
  const playSong = (index: number) => {
    setCurrentIndex(index);
    if (!isPlaying) setIsPlaying(true); // 保证切歌后自动播放
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      setDuration(duration || 0);
      setProgress((currentTime / (duration || 1)) * 100);

      if (lyrics.length > 0) {
        const activeLyric = lyrics.slice().reverse().find(l => currentTime >= l.time);
        if (activeLyric && activeLyric.text !== currentLyric) {
          setCurrentLyric(activeLyric.text);
        }
      }
    }
  };

  // 🌟 7. 处理歌曲结束
  const handleEnded = () => {
    if (playMode === 'single' && audioRef.current) {
       audioRef.current.currentTime = 0;
       audioRef.current.play();
    } else {
       nextSong();
    }
  };

  // 音源不可用时给出明确提示，避免永远卡在「正在缓冲」
  const handleError = () => {
    const code = audioRef.current?.error?.code;
    setIsPlaying(false);
    setCurrentLyric(
      code === 4
        ? '这首暂时播不了（音源不可用），点下一首试试'
        : '播放出错，点下一首试试'
    );
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePlayMode = () => {
    setPlayMode(prev => {
      if (prev === 'loop') return 'single';
      if (prev === 'single') return 'random';
      return 'loop';
    });
  };

  const currentSong = playlist[currentIndex];

  return (
    <MusicContext.Provider value={{
        playlist, currentIndex, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading,
        volume, isMuted, playMode, // 暴露新状态
        togglePlay, nextSong, prevSong, handleSeek,
        playSong, selectSong: playSong, setVolume, toggleMute, togglePlayMode, // 暴露新方法
        // 歌单（只读）：/music 切到「歌单」页签要用 importedIds
        importedIds, cloudSynced, refreshFromCloud
    }}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded} // 使用我们重写的结束处理
          onLoadedMetadata={handleTimeUpdate}
          onError={handleError}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
