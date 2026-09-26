"use client";

import { useRouter } from 'next/navigation';
import { siteConfig } from '../siteConfig';
import { useToast } from './ToastProvider';

// 社交图标（SVG 均为单色 fill:currentColor，随按钮 hover 变色）
// 飞书：官方 logo 单色版（4 条 path，提取自 feishu.cn 官网 bundle，viewBox 0 0 16 16）
// 闲鱼：手绘鱼形（evenodd 挖眼睛）；邮箱：heroicons envelope，点击复制
type SocialIcon = {
  name: string;
  href?: string;
  copy?: string; // 有 copy 则点击复制而非跳转
  viewBox: string;
  paths: { d: string; transform?: string }[];
};

export default function ProfileCard({ postCount, projectCount, photoCount }: { postCount: number, projectCount: number, photoCount: number }) {
  const router = useRouter();
  const { showToast } = useToast();

  const email = siteConfig.social?.email || '';
  const socials: SocialIcon[] = [
    {
      name: '飞书',
      href: siteConfig.social?.feishu || '',
      viewBox: '0 0 16 16',
      paths: [
        { d: 'M13.9831 8.17234C14.4508 8.17253 14.6977 8.72574 14.3861 9.07469L8.91146 15.1971C8.66298 15.4748 8.20261 15.2996 8.20247 14.9263L8.20312 14.9269V11.3462C8.20323 9.59307 9.62447 8.17234 11.3776 8.17234H13.9831Z' },
        { d: 'M1.84701 8.17169H4.65625C6.40799 8.17181 7.83008 9.59441 7.83008 11.3462V11.4204C7.82991 11.6123 7.67496 11.7666 7.48372 11.7667H4.26042C2.73676 11.7667 1.50006 10.53 1.5 9.00633V8.51805C1.5 8.32657 1.65552 8.17169 1.84701 8.17169Z' },
        { d: 'M7.1224 0.802552C7.3709 0.52514 7.83119 0.70017 7.83138 1.07339L7.83073 4.65411C7.83068 6.4072 6.40933 7.82849 4.65625 7.82859H2.05078C1.58307 7.82859 1.33584 7.27527 1.64714 6.92625L7.1224 0.802552Z' },
        { d: 'M11.7734 4.23289C13.2971 4.23294 14.5332 5.46965 14.5332 6.99331V7.48094C14.5332 7.673 14.3782 7.82778 14.1868 7.82794H11.3776C9.62584 7.82794 8.20326 6.40584 8.20312 4.65411V4.5799C8.20312 4.38774 8.35865 4.23289 8.55013 4.23289H11.7734Z' },
      ],
    },
    {
      name: '闲鱼',
      href: siteConfig.social?.xianyu || '',
      viewBox: '0 0 24 24',
      paths: [{
        transform: 'rotate(-16 12 12)',
        d: 'M21.5 12C20 9.2 16.8 7.2 13 7.2 10.3 7.2 8 8.2 6.5 9.6L2.7 5.4C3.6 7.5 4.05 9.7 4.05 12C4.05 14.3 3.6 16.5 2.7 18.6L6.5 14.4C8 15.8 10.3 16.8 13 16.8C16.8 16.8 20 14.8 21.5 12ZM17 9.2C16.1 9.2 15.4 9.9 15.4 10.8C15.4 11.7 16.1 12.4 17 12.4C17.9 12.4 18.6 11.7 18.6 10.8C18.6 9.9 17.9 9.2 17 9.2Z',
      }],
    },
    {
      name: '邮箱',
      copy: email,
      viewBox: '0 0 24 24',
      paths: [
        { d: 'M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67Z' },
        { d: 'M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.972 0L22.5 6.908Z' },
      ],
    },
  ].filter((s) => s.href || s.copy);

  return (
    <div
      onClick={() => router.push('/about')}
      className="md:col-span-7 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 sm:p-6 md:p-8 flex flex-col justify-between transition-all duration-700 hover:scale-[1.01] cursor-pointer group relative overflow-hidden h-full min-h-[220px] md:min-h-[280px]"
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4 md:gap-6 w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shadow-lg flex-shrink-0 transition-transform duration-500 group-hover:rotate-3">
            <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-lg md:rounded-xl object-cover bg-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 pb-1 leading-snug tracking-wider transition-colors duration-700 truncate">
              {siteConfig.authorName}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-md transition-colors duration-700 line-clamp-2 md:line-clamp-none">
              {siteConfig.bio}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-end justify-between mt-6 md:mt-8 gap-5 md:gap-6 relative z-10">
        <div className="flex gap-2 sm:gap-6 w-full md:w-auto justify-between sm:justify-around md:justify-start px-2 sm:px-0">
          <StatItem count={postCount} label="文章" color="text-indigo-600 dark:text-indigo-400" />
          <div className="w-px h-8 md:h-10 bg-slate-300/50 dark:bg-slate-700 hidden md:block"></div>
          <StatItem count={projectCount} label="项目" color="text-purple-600 dark:text-purple-400" />
          <div className="w-px h-8 md:h-10 bg-slate-300/50 dark:bg-slate-700 hidden md:block"></div>
          <StatItem count={photoCount} label="照片" color="text-pink-600 dark:text-pink-400" />
        </div>

        {/* 社交图标行（参照 aibrium.cn 首页样式：圆角半透明小按钮 + hover 变色） */}
        <div
          className="flex items-center gap-1.5 justify-center md:justify-end w-full md:w-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {socials.map((s) => {
            const cls = "flex h-8 w-8 items-center justify-center rounded-xl border border-white/55 bg-white/55 text-slate-600 shadow-sm transition-colors duration-300 hover:bg-indigo-500 hover:text-white dark:border-white/10 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-indigo-600 dark:hover:text-white";
            const icon = (
              <svg viewBox={s.viewBox} fill="currentColor" className="w-4 h-4" aria-hidden="true">
                {s.paths.map((p, i) => (
                  <path key={i} d={p.d} transform={p.transform} fillRule="evenodd" clipRule="evenodd" />
                ))}
              </svg>
            );
            if (s.copy) {
              return (
                <button
                  key={s.name}
                  type="button"
                  aria-label={s.name}
                  title={`点击复制${s.name}`}
                  onClick={() => {
                    navigator.clipboard.writeText(s.copy!).then(() => showToast(`${s.name}已复制`));
                  }}
                  className={cls}
                >
                  {icon}
                </button>
              );
            }
            return (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.name}
                aria-label={s.name}
                className={cls}
              >
                {icon}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatItem({ count, label, color }: { count: number, label: string, color: string }) {
  return (
    <div className="text-center group/stat px-2">
      <div className={`text-xl md:text-2xl font-black ${color} transition-transform group-hover/stat:scale-110`}>{count}</div>
      <div className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}
