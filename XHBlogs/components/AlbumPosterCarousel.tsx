"use client";

// 照片墙大海报：相册图片交叉淡入轮播（首页「生活碎片」卡片）
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Album } from '../data/albums';

const INTERVAL = 4000;

export default function AlbumPosterCarousel({ album }: { album: Album }) {
  const photos = album.photos.length > 0 ? album.photos : [{ url: album.cover, caption: '' }];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % photos.length), INTERVAL);
    return () => clearInterval(timer);
  }, [photos.length]);

  return (
    <Link href="/photowall" className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group min-h-[200px] sm:min-h-[220px] flex-shrink-0">
      {photos.map((p, i) => (
        <img
          key={p.url}
          src={p.url}
          alt={p.caption || album.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out group-hover:scale-105 ${i === idx ? 'opacity-90' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 group-hover:bg-black/10 transition-colors duration-500"></div>
      {/* 轮播指示点：多于 1 张时才显示 */}
      {photos.length > 1 && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${i === idx ? 'bg-white' : 'bg-white/40'}`}
            ></span>
          ))}
        </div>
      )}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-6">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 underline decoration-pink-400">{album.title}</h3>
        <p className="text-white/90 text-sm sm:text-lg line-clamp-1">{album.description}</p>
      </div>
    </Link>
  );
}
