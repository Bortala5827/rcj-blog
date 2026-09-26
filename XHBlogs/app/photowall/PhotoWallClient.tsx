"use client";

// 照片墙 —— 暖纸拍立得风（设计参照 aibrium.cn 的暖色系：暖米渐变背景、
// 衬线字体、白框拍立得卡片、胶带贴纸、随机微旋转、hover 摆正抬起）。
// 逻辑与原版一致：相册堆叠卡 → 相册内瀑布流 → lightbox，含搜索。
import { useState, useMemo, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { albums, Album } from '../../data/albums';

const SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
const INK = '#3f352e';
const INK_SOFT = '#8a7a6d';
const ACCENT = '#879bdd';

// 稳定伪随机：同一张照片永远同一个角度
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function Polaroid({ src, caption, onClick, seed, eager }: { src: string; caption?: string; onClick: () => void; seed: string; eager?: boolean }) {
  const rotate = ((hashStr(seed) % 9) - 4) * 0.9; // ±3.6°
  return (
    <div className="break-inside-avoid" style={{ animation: 'pwFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
      <div
        onClick={onClick}
        className="group relative cursor-zoom-in bg-white"
        style={{
          transform: `rotate(${rotate}deg)`,
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '10px 10px 14px',
          boxShadow: 'rgba(12,20,44,0.2) 0 12px 20px, rgba(61,76,108,0.1) 0 3px 6px, rgba(255,255,255,0.72) 0 1px 0 inset',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'rotate(0deg) translateY(-6px) scale(1.02)';
          e.currentTarget.style.zIndex = '10';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = `rotate(${rotate}deg)`;
          e.currentTarget.style.zIndex = '';
        }}
      >
        {/* 顶部胶带 */}
        <div
          className="absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-2"
          style={{
            background: 'rgba(255,244,221,0.85)',
            boxShadow: 'rgba(0,0,0,0.08) 0 1px 3px',
            borderLeft: '1px dashed rgba(163,138,128,0.35)',
            borderRight: '1px dashed rgba(163,138,128,0.35)',
          }}
        />
        <div className="overflow-hidden">
          <img
            src={src}
            alt={caption || '照片'}
            loading={eager ? 'eager' : 'lazy'}
            className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        {caption && (
          <p className="mt-2.5 px-1 text-center text-[13px] leading-5" style={{ color: '#6b5d52', fontFamily: SERIF, fontStyle: 'italic' }}>
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PhotoWallClient() {
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string; albumName?: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      setActiveQuery(searchQuery.toLowerCase());
      setIsTransitioning(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { matchedAlbums, matchedPhotos } = useMemo(() => {
    if (!activeQuery) return { matchedAlbums: albums, matchedPhotos: [] };

    const matchedAlbums = albums.filter(
      (album) => album.title.toLowerCase().includes(activeQuery) || album.description.toLowerCase().includes(activeQuery)
    );

    const matchedPhotos = albums
      .flatMap((album) => album.photos.map((p) => ({ ...p, albumName: album.title })))
      .filter((photo) => photo.caption?.toLowerCase().includes(activeQuery));

    return { matchedAlbums, matchedPhotos };
  }, [activeQuery]);

  return (
    <div className="relative min-h-screen pb-32" style={{ fontFamily: SERIF }}>
      {/* 暖纸背景 */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#fffaf4 0%, #f7efe7 34%, #eff0dc 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 18% 0%, rgba(255,255,255,0.72), transparent 416px)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 84% 8%, rgba(244,212,181,0.42), transparent 384px)' }} />
      </div>

      <Navbar />

      <PageTransition>
        <div className="relative z-10 mx-auto mt-28 w-full max-w-6xl px-4 sm:px-10">
          {!currentAlbum && (
            <div className="animate-pw-in">
              <div className="mb-16 flex flex-col items-center justify-between gap-6 md:flex-row">
                <div>
                  <h1 className="mb-2 text-3xl font-black tracking-tight md:text-4xl" style={{ color: '#2b241f' }}>
                    光影画廊
                  </h1>
                  <p className="text-sm tracking-wider" style={{ color: INK_SOFT }}>
                    定格时间，封存泰拉与现实的每一次心跳
                  </p>
                </div>

                <div className="relative w-full md:w-80">
                  <svg
                    className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2"
                    style={{ color: INK_SOFT }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="搜索相册名或照片描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-full pl-12 pr-4 text-sm outline-none transition-shadow focus:shadow-md"
                    style={{ background: 'rgba(255,255,255,0.42)', border: '0.57px solid rgba(255,255,255,0.7)', color: '#344e73' }}
                  />
                </div>
              </div>

              <div className={`transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {activeQuery && matchedPhotos.length > 0 && (
                  <div className="mb-16">
                    <h3 className="mb-6 flex items-center gap-2 text-lg font-bold" style={{ color: INK }}>
                      <span className="h-5 w-2 rounded-full" style={{ background: ACCENT }} />
                      匹配的单张照片（{matchedPhotos.length}）
                    </h3>
                    <div className="columns-1 gap-6 space-y-6 sm:columns-2 md:columns-3 lg:columns-4">
                      {matchedPhotos.map((photo, index) => (
                        <Polaroid
                          key={`search-photo-${index}`}
                          src={photo.url}
                          caption={photo.caption ? `${photo.caption} · ${photo.albumName}` : photo.albumName}
                          seed={`sp-${index}-${photo.url}`}
                          onClick={() => setSelectedImage(photo)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeQuery && matchedAlbums.length > 0 && (
                  <h3 className="mb-6 flex items-center gap-2 text-lg font-bold" style={{ color: INK }}>
                    <span className="h-5 w-2 rounded-full" style={{ background: '#e0b487' }} />
                    相关相册（{matchedAlbums.length}）
                  </h3>
                )}

                <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
                  {matchedAlbums.map((album) => (
                    <div key={album.id} onClick={() => { setSearchQuery(''); setCurrentAlbum(album); }} className="group flex cursor-pointer flex-col items-center">
                      <div className="relative mb-8 aspect-[4/3] w-[85%]">
                        <div
                          className="absolute inset-0 overflow-hidden opacity-60"
                          style={{
                            background: '#fff',
                            borderRadius: 4,
                            boxShadow: 'rgba(0,0,0,0.12) 0 6px 12px',
                            transform: 'rotate(6deg) translateX(12px) translateY(8px)',
                            padding: 6,
                            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          {album.photos[2] && <img src={album.photos[2].url} className="h-full w-full object-cover grayscale blur-[2px]" alt="" />}
                        </div>
                        <div
                          className="absolute inset-0 z-10 overflow-hidden opacity-80"
                          style={{
                            background: '#fff',
                            borderRadius: 4,
                            boxShadow: 'rgba(0,0,0,0.14) 0 8px 16px',
                            transform: 'rotate(-3deg) translateX(-6px)',
                            padding: 6,
                            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          {album.photos[1] && <img src={album.photos[1].url} className="h-full w-full object-cover" style={{ filter: 'grayscale(0.5)' }} alt="" />}
                        </div>
                        <div
                          className="absolute inset-0 z-20 overflow-hidden"
                          style={{
                            background: '#fff',
                            borderRadius: 4,
                            boxShadow: 'rgba(12,20,44,0.22) 0 16px 28px, rgba(61,76,108,0.1) 0 3px 6px',
                            padding: 6,
                            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          <img src={album.cover} alt={album.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                        <div
                          className="absolute -top-3 left-1/2 z-30 h-6 w-20 -translate-x-1/2 -rotate-2"
                          style={{
                            background: 'rgba(255,244,221,0.9)',
                            boxShadow: 'rgba(0,0,0,0.1) 0 2px 4px',
                            borderLeft: '1px dashed rgba(163,138,128,0.35)',
                            borderRight: '1px dashed rgba(163,138,128,0.35)',
                            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>

                      <div className="w-full px-4 text-center">
                        <div className="mb-1 flex items-center justify-center gap-2">
                          <h2 className="text-xl font-bold transition-colors" style={{ color: INK }}>
                            {album.title}
                          </h2>
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                            style={{ color: INK_SOFT, background: 'rgba(255,255,255,0.6)' }}
                          >
                            {album.date}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-1" style={{ color: INK_SOFT }}>
                          {album.description}
                        </p>
                        <p className="mt-1 text-xs font-bold opacity-0 transition-opacity duration-400 group-hover:opacity-100" style={{ color: ACCENT }}>
                          {album.photos.length} 张照片 · Click to Open
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {activeQuery && matchedAlbums.length === 0 && matchedPhotos.length === 0 && (
                  <div className="py-20 text-center font-medium" style={{ color: INK_SOFT }}>
                    在泰拉大陆的任何角落都没找到相关的记忆...
                  </div>
                )}
              </div>
            </div>
          )}

          {currentAlbum && (
            <div className="animate-pw-in">
              <div className="mb-12 flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-end" style={{ borderColor: 'rgba(163,138,128,0.3)' }}>
                <div>
                  <div className="mb-4 flex items-center gap-4">
                    <button
                      onClick={() => setCurrentAlbum(null)}
                      className="group flex items-center gap-1.5 text-sm font-bold transition-colors"
                      style={{ color: INK_SOFT }}
                    >
                      <span
                        className="rounded-lg p-1.5 transition-shadow group-hover:shadow-md"
                        style={{ background: 'rgba(255,255,255,0.55)', border: '0.57px solid rgba(255,255,255,0.7)' }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                      </span>
                      返回画廊
                    </button>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'rgba(163,138,128,0.5)' }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: INK_SOFT }}>
                      {currentAlbum.date}
                    </span>
                  </div>
                  <h1 className="mb-2 text-3xl font-black tracking-tight md:text-4xl" style={{ color: '#2b241f' }}>
                    {currentAlbum.title}
                  </h1>
                  <p className="text-lg font-medium" style={{ color: INK_SOFT }}>
                    {currentAlbum.description}
                  </p>
                </div>

                <div
                  className="rounded-2xl px-5 py-2.5 text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '0.57px solid rgba(255,255,255,0.7)', color: INK_SOFT }}
                >
                  共 <span className="text-lg" style={{ color: ACCENT }}>{currentAlbum.photos.length}</span> 瞬间
                </div>
              </div>

              <div className="columns-1 gap-6 space-y-6 sm:columns-2 md:columns-3 lg:columns-4">
                {currentAlbum.photos.map((photo, index) => (
                  <Polaroid
                    key={`${photo.url}-${index}`}
                    src={photo.url}
                    caption={photo.caption}
                    seed={`${photo.url}-${index}`}
                    eager={index < 4}
                    onClick={() => setSelectedImage(photo)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </PageTransition>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#241d17]/95 p-4 backdrop-blur-xl sm:p-10" style={{ cursor: 'zoom-out' }} onClick={() => setSelectedImage(null)}>
          <button className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative bg-white p-3 pb-4 shadow-2xl" style={{ transform: 'rotate(-1deg)', maxWidth: '90vw', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.url} alt={selectedImage.caption || '全屏照片'} className="max-h-[72vh] max-w-full object-contain" />
            {selectedImage.caption && (
              <p className="mt-3 text-center text-sm" style={{ color: '#6b5d52', fontFamily: SERIF, fontStyle: 'italic' }}>
                {selectedImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pwFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
          }
        }
        .animate-pw-in {
          animation: pwFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
}
