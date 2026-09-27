"use client";

// 像素奔奔渲染器：把 benbenFrames.ts 的 24×24 字符帧逐格画到 canvas。
// rAF 按动作序列翻帧；image-rendering: pixelated 保证放大后硬边像素感。
// 立体感来自帧数据本身的暗部色阶 / 提亮色阶（见 benbenFrames.ts 设计注释）。
import { useEffect, useRef } from 'react';
import { FRAMES, SEQUENCES, PALETTE, GRID } from './benbenFrames';

export type PixelState = 'idle' | 'happy' | 'think';

export default function PixelBenben({
  state = 'idle',
  size = 120,
  className = '',
}: {
  state?: PixelState;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = GRID;
    canvas.height = GRID;

    const seq = SEQUENCES[state] ?? SEQUENCES.idle;
    let step = 0;
    let last = 0;
    let raf = 0;
    let stopped = false;

    const draw = (frameName: keyof typeof FRAMES) => {
      const rows = FRAMES[frameName];
      ctx.clearRect(0, 0, GRID, GRID);
      for (let y = 0; y < GRID; y++) {
        const row = rows[y] || '';
        for (let x = 0; x < row.length; x++) {
          const color = PALETTE[row[x]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };

    const tick = (now: number) => {
      if (stopped) return;
      if (now - last >= seq[step][1]) {
        last = now;
        step = (step + 1) % seq.length;
        draw(seq[step][0]);
      }
      raf = requestAnimationFrame(tick);
    };

    draw(seq[0][0]);
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      role="img"
      aria-label="像素小狗奔奔"
    />
  );
}
