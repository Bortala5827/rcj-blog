"use client";

import dynamic from 'next/dynamic';
import { siteConfig } from '../siteConfig';

// 重型装饰组件：dynamic import + ssr:false，避免首屏 bundle 膨胀
// 注意：ssr:false 只能在 Client Component 里用，layout.tsx 是 Server Component 会报错

const BackgroundEffects = dynamic(() => import('./BackgroundEffects'), { ssr: false });
const BackgroundSlider = dynamic(() => import('./BackgroundSlider'), { ssr: false });
const DanmakuBackground = dynamic(() => import('./DanmakuBackground'), { ssr: false });
const ClickEffect = dynamic(() => import('./ClickEffect'), { ssr: false });
const CyberCat = dynamic(() => import('./CyberCat'), { ssr: false });
const FloatingPlayer = dynamic(() => import('./FloatingPlayer'), { ssr: false });
const PWARegister = dynamic(() => import('./PWARegister'), { ssr: false });

export function HeavyDecor() {
  return (
    <>
      <PWARegister />

      <div id="bg-effects-layer" className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        {!siteConfig.useGradient && <BackgroundSlider />}
        {/* z-9 半透底 + 毛玻璃 */}
        <div className="absolute inset-0 z-[-9] backdrop-blur-md transition-colors duration-1000" style={{ background: 'var(--bg-blur-layer)' }}></div>

        {/* z-8 渐变流动层 */}
        <div
          className="bg-gradient-flow absolute inset-0 z-[-8] opacity-60 dark:opacity-20 mix-blend-color transition-opacity duration-1000 transform-gpu"
          style={{
            background: 'linear-gradient(-45deg, var(--grad-c1), var(--grad-c2), var(--grad-c3), var(--grad-c4))',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}
        ></div>

        {/* z-7 两个光晕球 */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[100px] rounded-full z-[-7] md:mix-blend-overlay transition-colors duration-1000" style={{ background: 'var(--glow-1)' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[100px] rounded-full z-[-7] md:mix-blend-overlay transition-colors duration-1000" style={{ background: 'var(--glow-2)' }}></div>

        {/* 隐藏手机端高负载粒子特效 */}
        <div className="hidden md:block absolute inset-0 w-full h-full">
          <BackgroundEffects />
        </div>
      </div>

      {/* 隐藏手机端弹幕 */}
      <div className="hidden md:block">
        <DanmakuBackground />
      </div>

      {/* 全局底栏 */}
      <FloatingPlayer />

      {/* 隐藏手机端点击粒子 */}
      <div className="hidden md:block">
        <ClickEffect />
      </div>

      <div className="hidden md:block">
        <CyberCat />
      </div>
    </>
  );
}

export default HeavyDecor;
