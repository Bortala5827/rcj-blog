"use client";

// 留言墙（便签墙）—— 设计参照 aibrium.cn/chatter 的暖纸手作风：
// 暖米色三层渐变背景、7 色马卡龙便签、随机旋转 + 图钉、22px 方格纸纹理、
// 三层阴影（含顶部内发光白边）、全站衬线字体。
import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';

export interface Note {
  id: string;
  name: string;
  content: string;
  color: string;
  ts: number;
}

const NOTE_COLORS = ['#fff1e6', '#edf8ee', '#fff8ea', '#e5f5ff', '#fff4dd', '#eee9ff', '#f8edff'];
const TAB_COLORS = ['#b5dcf2', '#efce8f'];
const MAX_CONTENT = 300;
const LOCAL_KEY = 'rcj_board_notes';

const SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

// 稳定的伪随机：同一张便签永远同一个角度/配色
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function NoteCard({ note, index, onDelete }: { note: Note; index: number; onDelete?: (id: string) => void }) {
  const h = hashStr(note.id);
  const rotate = ((h % 21) - 10) * 0.9; // ±9°
  const dy = (h % 5) * 4; // 0~16px 错落
  const tabColor = TAB_COLORS[h % TAB_COLORS.length];

  return (
    <div
      className="group relative w-[180px] shrink-0 cursor-default select-none"
      style={{ animation: 'boardFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: `${Math.min(index, 20) * 60}ms` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.zIndex = '10';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.zIndex = '';
      }}
    >
    <div
      className="relative"
      style={{
        transform: `rotate(${rotate}deg) translateY(${dy}px)`,
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'rgba(12,20,44,0.24) 0 18px 24px, rgba(61,76,108,0.1) 0 3px 6px, rgba(255,255,255,0.72) 0 1px 0 inset',
        background: note.color,
        padding: '32px 20px 16px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) translateY(-6px) scale(1.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${rotate}deg) translateY(${dy}px)`;
      }}
    >
      {/* 方格纸纹理 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(94,111,145,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(94,111,145,0.14) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* 顶部条纹标签 */}
      <div
        className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2"
        style={{
          background: `repeating-linear-gradient(90deg, ${tabColor} 0, ${tabColor} 8px, rgba(255,255,255,0.34) 8px, rgba(255,255,255,0.34) 10px)`,
          boxShadow: 'rgba(0,0,0,0.12) 0 2px 4px',
        }}
      />
      {/* 图钉 */}
      <svg className="absolute left-1/2 top-2 z-10 h-5 w-5 -translate-x-1/2 drop-shadow" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="10" r="6" fill="#e05d5d" />
        <circle cx="10" cy="8" r="2" fill="#ffffff" opacity="0.5" />
        <rect x="11" y="15" width="2" height="5" rx="1" fill="#9a3f3f" />
      </svg>

      <p className="relative break-words text-[15px] leading-6" style={{ color: '#633f3b', fontFamily: SERIF }}>
        {note.content}
      </p>
      <div className="relative mt-3 flex items-center justify-between text-xs" style={{ color: '#a38a80', fontFamily: SERIF }}>
        <span className="max-w-[100px] truncate font-bold">{note.name}</span>
        <div className="flex items-center gap-1.5">
          <time>{new Date(note.ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</time>
          {onDelete && (
            <button
              onClick={() => onDelete(note.id)}
              title="撤下这张便签"
              className="rounded px-1 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

export default function BoardClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloudOk, setCloudOk] = useState<boolean | null>(null); // null=检测中
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[4]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  };

  const loadLocal = (): Note[] => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    } catch {
      return [];
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/notes', { cache: 'no-store' });
        const d = await r.json();
        if (!alive) return;
        if (d?.ok && Array.isArray(d.notes)) {
          setCloudOk(true);
          setNotes(d.notes);
        } else {
          setCloudOk(false);
          setNotes(loadLocal());
        }
      } catch {
        if (!alive) return;
        setCloudOk(false);
        setNotes(loadLocal());
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const canSubmit = useMemo(() => content.trim().length > 0 && content.trim().length <= MAX_CONTENT && !submitting, [content, submitting]);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const payload = { name: name.trim(), content: content.trim(), color };
    try {
      const r = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok && d.note) {
        setNotes((prev) => [d.note, ...prev]);
        setContent('');
        showToast('钉上啦，感谢你的足迹 ♡');
      } else if (d?.error === 'rate_limited') {
        showToast('发得太快啦，喝口水一分钟后再来');
      } else if (d?.error === 'no_db') {
        // 云端未连接 → 本地模式兜底
        const localNote: Note = { id: `local-${Date.now()}`, name: payload.name || '匿名', content: payload.content, color: payload.color, ts: Date.now() };
        const next = [localNote, ...loadLocal()];
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next.slice(0, 200)));
        setNotes(next.slice(0, 200));
        setCloudOk(false);
        setContent('');
        showToast('云端暂未连接，便签先保存在本机');
      } else {
        showToast('没钉上，再试一次？');
      }
    } catch {
      showToast('网络打了个盹，再试一次？');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-32" style={{ fontFamily: SERIF }}>
      {/* 暖纸背景：三层渐变 + 双光晕 */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#fffaf4 0%, #f7efe7 34%, #eff0dc 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 18% 0%, rgba(255,255,255,0.72), transparent 416px)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 84% 8%, rgba(244,212,181,0.42), transparent 384px)' }} />
      </div>

      <Navbar />

      <PageTransition>
        <div className="relative z-10 mx-auto mt-28 w-full max-w-5xl px-4 sm:px-10">
          {/* 标题 */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: '#2b241f' }}>
              留言墙
            </h1>
            <p className="mt-2 text-sm tracking-wide" style={{ color: '#a38a80' }}>
              留下你的足迹，每一张便签都是一份温暖
            </p>
          </div>

          {/* 提交区：暖玻璃卡片 */}
          <div
            className="mx-auto mb-16 max-w-xl rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.42)',
              border: '0.57px solid rgba(255,255,255,0.7)',
              boxShadow: 'rgba(61,76,108,0.08) 0 8px 24px',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="你的名字（可留空）"
                maxLength={16}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-xl px-4 text-[15px] outline-none"
                style={{ background: 'rgba(255,255,255,0.42)', border: '0.57px solid rgba(255,255,255,0.7)', color: '#344e73' }}
              />
              <div className="flex shrink-0 gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`选择便签颜色 ${c}`}
                    className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, boxShadow: color === c ? '0 0 0 2px #879bdd' : 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
                  />
                ))}
              </div>
            </div>
            <textarea
              placeholder="写下你想说的话…"
              maxLength={MAX_CONTENT}
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-3 w-full resize-none rounded-xl p-4 text-[15px] leading-6 outline-none"
              style={{ background: 'rgba(255,255,255,0.42)', border: '0.57px solid rgba(255,255,255,0.7)', color: '#344e73' }}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs" style={{ color: '#b0a49b' }}>
                {content.length}/{MAX_CONTENT}
              </span>
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="rounded-xl px-6 py-2.5 text-[15px] font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: '#879bdd', borderRadius: 12 }}
              >
                {submitting ? '钉上中…' : '钉上便签'}
              </button>
            </div>
          </div>

          {cloudOk === false && (
            <p className="mx-auto mb-10 max-w-xl rounded-lg px-4 py-2 text-center text-xs" style={{ color: '#a38a80', background: 'rgba(255,255,255,0.4)' }}>
              云端暂未连接，新便签会先保存在这台设备上
            </p>
          )}

          {/* 便签墙 */}
          {loading ? (
            <div className="py-20 text-center text-sm" style={{ color: '#a38a80' }}>
              便签墙整理中…
            </div>
          ) : notes.length === 0 ? (
            <div className="py-20 text-center text-sm" style={{ color: '#a38a80' }}>
              还没有便签，钉上第一张吧
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-x-7 gap-y-12 pb-10 pt-4">
              {notes.map((n, i) => (
                <NoteCard key={n.id} note={n} index={i} />
              ))}
            </div>
          )}
        </div>
      </PageTransition>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-10 left-1/2 z-[120] -translate-x-1/2 rounded-full px-6 py-3 text-sm text-white shadow-xl"
          style={{ background: 'rgba(63,53,46,0.88)' }}
        >
          {toast}
        </div>
      )}

      <style jsx global>{`
        @keyframes boardFadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
