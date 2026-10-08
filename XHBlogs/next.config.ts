import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚨 核心修改 1：关掉纯静态导出，让 Vercel 帮你把 API 跑起来！
  // output: 'export',

  // 🚨 核心修改 2：Vercel 不需要强制加斜杠，关掉它能避免很多 API 路径匹配错误
  // trailingSlash: true,

  // 归档页旧路径兼容：/archive → /timeline（搜索引擎/旧链接/手输路径都会跳过来）
  async redirects() {
    return [
      {
        source: '/archive',
        destination: '/timeline',
        permanent: true, // 308 永久重定向，搜索引擎会更新索引
      },
    ];
  },

  // 性能优化
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'], // 按需导入，避免整包进 bundle
  },

  // CF Pages 下 next/image 没用，跳过优化
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TS 错误，方便快速部署
  },
};

export default nextConfig;