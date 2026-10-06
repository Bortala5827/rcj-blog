'use client';

import { useEffect } from 'react';

// 注册 Service Worker：使站点满足 PWA 可安装性（Android 添加到主屏幕 / 桌面安装）
export default function PWARegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* 注册失败不影响使用 */ });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);
  return null;
}
