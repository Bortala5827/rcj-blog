"use client";

import { useRouter } from 'next/navigation';
import { siteConfig } from '../siteConfig';
import { useToast } from './ToastProvider';

export default function ProfileCard({ postCount, projectCount, photoCount }: { postCount: number, projectCount: number, photoCount: number }) {
  const router = useRouter();
  const { showToast } = useToast();

  const copyEmail = () => {
    const email = siteConfig.social?.email || '';
    navigator.clipboard.writeText(email);
    showToast(`邮箱已复制：${email}`, 'success');
  };

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

        <div className="flex items-center justify-center md:justify-end w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={copyEmail}
            title="点击复制邮箱"
            className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-white/40 dark:border-white/10 shadow-sm"
          >
            {siteConfig.social?.email}
          </button>
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
