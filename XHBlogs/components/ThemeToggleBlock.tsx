"use client";

import { useTheme, THEMES } from './ThemeProvider';

// 主题切换卡：3 主题横排选择，当前选中高亮
export default function ThemeToggleBlock() {
  const { theme, isDark, setTheme } = useTheme();
  const current = THEMES.find(t => t.id === theme) ?? THEMES[1];

  return (
    <div
      className={`h-full w-full rounded-3xl backdrop-blur-md border shadow-xl p-5 flex flex-col justify-center items-center transition-all duration-500 hover:scale-[1.02] relative overflow-hidden
        ${isDark ? 'bg-slate-800/40 border-slate-600/50' : 'bg-white/40 border-white/60'}
      `}
    >
      {/* 3 主题 emoji 选择器 */}
      <div className="flex gap-3 mb-3">
        {THEMES.map(t => {
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 cursor-pointer
                ${active
                  ? 'ring-2 ring-pink-400 scale-110 shadow-lg shadow-pink-500/30'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
                }
                ${isDark ? 'bg-slate-700/50' : 'bg-white/50'}
              `}
            >
              {t.emoji}
            </button>
          );
        })}
      </div>

      {/* 当前主题标题 + 副标题 */}
      <div className="text-center z-10">
        <h3 className={`text-lg font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {current.label}
        </h3>
        <p className={`text-xs font-medium mt-0.5 transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {current.subtitle}
        </p>
      </div>
    </div>
  );
}
