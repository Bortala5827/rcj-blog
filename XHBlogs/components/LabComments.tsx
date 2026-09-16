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

import { siteConfig } from '../siteConfig';

// 🌟 炼金实验室专用评论组件：可按 pageId（如 workshop-2026-05）单独开一条评论区，
// 不影响默认按 pathname 区分的 Comments.tsx。
export default function LabComments({ pageId }: { pageId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const cfg = siteConfig.walineConfig;
  const serverURL = cfg?.serverURL || '';

  useEffect(() => {
    if (!serverURL || !containerRef.current) return;

    const options: WalineInitOptions = {
      el: containerRef.current,
      serverURL,
      // 优先用传入的 pageId，否则退回当前路径
      path: pageId || pathname || '/',
      lang: cfg.lang || 'zh-CN',
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

    return () => waline?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, pageId, serverURL]);

  if (!serverURL) return null;

  return (
    <div className="w-full mt-16 relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>

      <div
        ref={containerRef}
        className="relative z-10 waline-glass pt-6 border-t border-slate-200/50 dark:border-slate-700/50"
      />

      <style jsx global>{`
        .waline-glass {
          --waline-theme-color: #6366f1;
          --waline-active-color: #818cf8;
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
