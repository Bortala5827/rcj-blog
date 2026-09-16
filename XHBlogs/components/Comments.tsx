"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  init,
  type WalineInstance,
  type WalineInitOptions,
  type WalineLoginStatus,
  type WalineMeta,
} from '@waline/client';
import '@waline/client/style';

// 🌟 评论区后端：Waline（自托管，仓库见 _repos/rcj-waline）
// 邮箱登录 + /ui 管理后台由后端提供；前端只负责挂载。
import { siteConfig } from '../siteConfig';

export default function Comments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const cfg = siteConfig.walineConfig;
  const serverURL = cfg?.serverURL || '';

  useEffect(() => {
    if (!serverURL || !containerRef.current) return;

    const options: WalineInitOptions = {
      el: containerRef.current,
      serverURL,
      // 用 pathname 区分不同页面，保证每个页面读到自己的评论
      path: pathname || '/',
      lang: cfg.lang || 'zh-CN',
      // 博客暗色模式是给 <html> 加 .dark 类，交给 Waline 自动适配
      dark: 'html.dark',
      login: (cfg.login as WalineLoginStatus) || 'enable',
      meta: (cfg.meta as WalineMeta[]) || ['nick', 'mail', 'link'],
      requiredMeta: (cfg.requiredMeta as WalineMeta[]) || ['nick'],
      reaction: cfg.reaction ?? true,
      pageview: cfg.pageview ?? true,
      imageUploader: false,
      search: false,
    };

    const waline: WalineInstance | null = init(options);

    // 路由切换 / 卸载时销毁实例，避免重复挂载
    return () => waline?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, serverURL]);

  // 后端未配置时不渲染，否则页面会出现一个空白的评论区
  if (!serverURL) return null;

  return (
    <div className="w-full mt-16 relative">
      {/* 🌟 底部环境光晕（保留原有氛围感） */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>

      <div
        ref={containerRef}
        className="relative z-10 waline-glass pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
      />

      {/* 🌟 毛玻璃主题：只改主题色 + 玻璃底，其余交给 Waline 自带的明暗适配 */}
      <style jsx global>{`
        .waline-glass {
          --waline-theme-color: #6366f1;
          --waline-active-color: #818cf8;
          /* 浅色：跟随博客的半透明玻璃质感 */
          --waline-bg-color: rgba(255, 255, 255, 0.62);
          --waline-bg-color-light: rgba(255, 255, 255, 0.4);
          --waline-color: #0f172a;
          --waline-border-color: rgba(148, 163, 184, 0.35);
        }
        html.dark .waline-glass {
          --waline-bg-color: rgba(30, 41, 59, 0.55);
          --waline-bg-color-light: rgba(30, 41, 59, 0.35);
          --waline-color: #e2e8f0;
          --waline-border-color: rgba(148, 163, 184, 0.22);
        }
        .waline-glass .wl-panel,
        .waline-glass .wl-card {
          border-radius: 16px !important;
        }
        .waline-glass .wl-panel {
          backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}
