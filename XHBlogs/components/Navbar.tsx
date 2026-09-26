"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, PanInfo } from 'framer-motion';
import { siteConfig } from '../siteConfig';

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // --- 🌟 物理引擎：菜单转动逻辑 ---
  // 注意：链接必须放在「转盘层」之外的独立层上 —— onPan 在触摸时会指针捕获，
  // 把 tap 的 click 截留在盘面元素上，导致手机端点选项不跳转（2026-09-26 修复）。
  const wheelRef = useRef<HTMLDivElement>(null);
  const rawRotation = useMotionValue(0);
  const smoothRotation = useSpring(rawRotation, { stiffness: 200, damping: 25 });

  const handlePan = (event: any, info: PanInfo) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currX = info.point.x;
    const currY = info.point.y;
    const prevX = currX - info.delta.x;
    const prevY = currY - info.delta.y;
    const prevAngle = Math.atan2(prevY - centerY, prevX - centerX);
    const currAngle = Math.atan2(currY - centerY, currX - centerX);
    let deltaAngle = (currAngle - prevAngle) * (180 / Math.PI);
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    rawRotation.set(rawRotation.get() + deltaAngle);
  };

  // --- 🌟 物理引擎：手机端按钮拖拽逻辑 ---
  const dragY = useMotionValue(0);
  const [constraints, setConstraints] = useState({ top: 0, bottom: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vh = window.innerHeight;
      setConstraints({
        top: -(vh / 2) + 80,
        bottom: (vh / 2) - 80
      });
    }
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) rawRotation.set(0);
  }, [isMobileMenuOpen, rawRotation]);

  // 控制 PC 端导航栏
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { name: '首页', href: '/' },
    { name: '项目', href: '/projects' },
    { name: '归档', href: '/timeline' },
    { name: '照片墙', href: '/photowall' },
    { name: '留言墙', href: '/board' },
    { name: '音乐', href: '/music' },
    { name: '后台', href: '/admin' },
    { name: '友链', href: '/friends' },
    { name: '加入频道', href: 'https://pd.qq.com/s/6mjqng89c', external: true },
    { name: '关于', href: '/about' },
  ];

  // 🌟 核心：过滤掉“灵境”，专供手机端使用，保证圆盘自动重新均匀排布
  const mobileNavLinks = navLinks;

  return (
    <>
      {/* PC端导航栏 */}
      <header className={`hidden md:block w-full fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${showNav ? 'translate-y-0' : '-translate-y-full'} bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm`}>
        <div className="w-[90%] max-w-6xl mx-auto h-16 flex items-center justify-between px-4 sm:px-[30px] box-border">
          <Link href="/" className="text-xl font-black text-slate-800 dark:text-white tracking-tighter hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300">
            {siteConfig.navTitle || siteConfig.authorName}
            <span className="text-indigo-500 mx-1">{siteConfig.navSuffix || 'の'}</span>
            {siteConfig.navAfter || '宝藏之地'}
          </Link>
          <nav className="flex gap-8 text-sm font-bold">
            {/* PC端依然使用全量的 navLinks */}
            {navLinks.map((link) => {
              const isActive = !link.external && (pathname === link.href || pathname === `${link.href}/`);
              const cls = `relative py-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600'}`;
              if (link.external) {
                return (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                    {link.name}
                  </a>
                );
              }
              return (
                <Link key={link.href} href={link.href} className={cls}>
                  {link.name}
                  {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 📱 手机端：可拖拽吸附的触发球 */}
      <div className="md:hidden">
        <motion.button
          drag="y"
          dragConstraints={constraints}
          dragElastic={0.1}
          dragMomentum={false}
          style={{ y: dragY }}
          onClick={() => {
            if (Math.abs(dragY.getVelocity()) < 10) {
              setIsMobileMenuOpen(true);
            }
          }}
          className={`fixed top-1/2 right-0 -translate-y-1/2 w-12 h-28 bg-indigo-500/80 backdrop-blur-xl rounded-l-full shadow-[-5px_0_20px_rgba(99,102,241,0.4)] z-[60] flex items-center justify-center transition-all duration-500 border-y border-l border-white/30 touch-none ${isMobileMenuOpen ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        >
          <div className="flex flex-col gap-1.5 items-center justify-center mr-2">
            <div className="w-1.5 h-1.5 bg-white/90 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/90 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/90 rounded-full"></div>
          </div>
        </motion.button>

        {/* 2. 居中展开的巨型全圆转轴 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[65]"
              />

              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] z-[70] pointer-events-none"
              >
                {/* 层 1：转盘本体 —— 只负责视觉与转动手势（onPan 会指针捕获，绝不能包住链接） */}
                <motion.div
                  ref={wheelRef}
                  style={{ rotate: smoothRotation }}
                  onPan={handlePan}
                  className="absolute inset-0 rounded-full border border-white/30 dark:border-slate-500/50 bg-white/40 dark:bg-slate-800/50 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] pointer-events-auto cursor-grab active:cursor-grabbing"
                >
                  {/* 盘面装饰刻度：随盘转动 */}
                  {[0, 90, 180, 270].map((deg) => (
                    <div key={deg} className="absolute top-1/2 left-1/2 w-full" style={{ transform: `rotate(${deg}deg)`, height: 1 }}>
                      <div className="mx-auto h-px w-10 bg-slate-400/40 dark:bg-slate-500/40" style={{ transform: `translateX(${140 - 20}px)` }} />
                    </div>
                  ))}
                </motion.div>

                {/* 层 2：链接层 —— 叠在盘面上方，不吃 pan 捕获，手机端点击必达 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-slate-300 dark:border-slate-500 flex items-center justify-center shadow-inner z-10">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black shadow-lg hover:bg-red-500 hover:rotate-90 transition-all duration-300 active:scale-95">
                      ✕
                    </button>
                  </div>

                  {mobileNavLinks.map((link, index) => {
                    const isActive = !link.external && (pathname === link.href || pathname === `${link.href}/`);
                    // 🌟 角度基于链接总数，保证圆盘上自动均匀排布；标签恒正立（不再随盘反转）
                    const angle = index * (360 / mobileNavLinks.length);
                    const circleCls = `flex items-center justify-center w-full h-full rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.8)] scale-110'
                        : 'bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-md hover:scale-110 border border-white/50 dark:border-slate-600'
                    }`;

                    return (
                      <div
                        key={link.href}
                        className="absolute top-1/2 left-1/2 w-14 h-14 -ml-7 -mt-7 flex items-center justify-center pointer-events-auto"
                        style={{
                          transform: `rotate(${angle}deg) translateY(-115px) rotate(${-angle}deg)`
                        }}
                      >
                        {link.external ? (
                          <a href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className={circleCls}>
                            <span className="text-[11px] font-black">{link.name}</span>
                          </a>
                        ) : (
                          <Link href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={circleCls}>
                            <span className="text-[11px] font-black">{link.name}</span>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}