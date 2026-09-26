"use client";

import { motion } from 'framer-motion';
import BackButton from '../../components/BackButton';
import { friendsData } from '../../data/friends';

// Framer Motion 动画变体：交错子元素
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 } // 每张卡片延迟 0.15 秒出现
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function FriendsBoard() {
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-10 py-6 md:py-10 relative z-10 scroll-smooth mt-20 md:mt-10">

      {/* 顶部导航与标题 */}
      <div className="mb-8 md:mb-12 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-4 md:mb-6">
          <BackButton />
        </div>
        <div className="text-center md:text-left w-full px-2 md:px-0">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-widest drop-shadow-sm uppercase">
            云端引力
          </h1>
          <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 font-serif">
            那些散落在赛博宇宙各处的有趣灵魂与神经节点。
          </p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
      >
        {friendsData.map((friend) => (
          <motion.div key={friend.id} variants={itemVariants} className="h-full">
            <a
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-2xl md:rounded-3xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg md:shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2 hover:scale-[1.02] group relative p-3 md:p-6"
            >
              {/* 卡片底部的动态光晕 */}
              <div
                className="absolute -bottom-10 -right-10 w-24 h-24 md:w-32 md:h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ backgroundColor: friend.themeColor }}
              ></div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-5 relative z-10 mb-2 md:mb-4">

                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full p-[2px] md:p-1 bg-gradient-to-tr from-indigo-500/50 to-purple-500/50 shadow-sm md:shadow-md group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out flex-shrink-0">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-full h-full rounded-full object-cover bg-white"
                    onError={(e) => {
                      const el = e.currentTarget;
                      const fb = friend.fallbackAvatar;
                      if (fb && el.src !== new URL(fb, location.href).href) {
                        el.src = fb;
                      }
                    }}
                  />
                </div>

                <div className="flex-1 overflow-hidden w-full">
                  <h2 className="text-sm md:text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {friend.name}
                  </h2>
                  <div className="text-[9px] md:text-xs font-bold text-indigo-500/70 dark:text-indigo-400/70 tracking-widest uppercase mt-0.5 md:mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Online
                  </div>
                </div>
              </div>

              <p className="text-[10px] md:text-sm text-slate-700 dark:text-slate-300 font-serif leading-snug md:leading-relaxed line-clamp-2 md:line-clamp-3 relative z-10">
                {friend.description}
              </p>
            </a>
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}