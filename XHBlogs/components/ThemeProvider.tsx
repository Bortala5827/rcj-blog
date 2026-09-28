"use client";
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeId = 'light' | 'dark' | 'neon';

interface ThemeInfo {
  id: ThemeId;
  emoji: string;
  label: string;
  subtitle: string;
  filter?: string;
}

export const THEMES: ThemeInfo[] = [
  { id: 'light', emoji: '☀️', label: '日间模式', subtitle: '落樱漫舞的清晨' },
  { id: 'dark',  emoji: '🌙', label: '夜间模式', subtitle: '流萤飞舞的深空' },
  { id: 'neon',  emoji: '💋', label: '霓虹骚粉', subtitle: '全站歪到非正常色' },
];

const ThemeContext = createContext<{
  theme: ThemeId;
  isDark: boolean;
  setTheme: (t: ThemeId) => void;
  cycleTheme: () => void;
}>({ theme: 'dark', isDark: true, setTheme: () => {}, cycleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 默认 dark，避免首屏闪白
  const [theme, setThemeState] = useState<ThemeId>('dark');
  const [mounted, setMounted] = useState(false);

  // neon 模式仍然基于深色（dark: 前缀照常生效），只是额外套 filter
  const isDark = theme !== 'light';

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('blog-theme') as ThemeId | null;
    const valid: ThemeId[] = ['light', 'dark', 'neon'];
    const t = saved && valid.includes(saved) ? saved : 'dark';
    setThemeState(t);
  }, []);

  // 同步 html.dark class：neon 也算 dark（页面元素用 dark: 变量）
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark, mounted]);

  // neon 模式：只给 html 加 data-theme 属性，让 CSS 变量自动切换
  // 图片/卡片/文字 保持原色不变，只有背景层颜色意图性变化
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'neon') {
      root.dataset.theme = 'neon';
    } else {
      delete root.dataset.theme;
    }
  }, [theme, mounted]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem('blog-theme', t);
  }, []);

  const cycleTheme = useCallback(() => {
    const idx = THEMES.findIndex(t => t.id === theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.id);
  }, [theme, setTheme]);

  if (!mounted) return <div className="invisible">{children}</div>;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);