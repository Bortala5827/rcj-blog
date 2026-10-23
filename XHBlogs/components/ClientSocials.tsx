// src/components/ClientSocials.tsx
"use client";

import { siteConfig } from '../siteConfig';
import { useToast } from './ToastProvider';

export default function ClientSocials() {
  const { showToast } = useToast();

  const copyEmail = () => {
    const email = siteConfig.social?.email || '';
    navigator.clipboard.writeText(email).then(() => showToast('Email copied'));
  };

  return (
    <div className="flex justify-center mt-4">
      <button
        type="button"
        onClick={copyEmail}
        title="Click to copy email"
        className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-white/40 dark:border-white/10 shadow-sm"
      >
        {siteConfig.social?.email}
      </button>
    </div>
  );
}
