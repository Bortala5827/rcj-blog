import 'katex/dist/katex.min.css';
import type { Metadata, Viewport } from "next";
import { Geist, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { MusicProvider } from "../components/MusicProvider";
import HeavyDecor from "../components/HeavyDecor";
import { siteConfig } from "../siteConfig";
import SplashScreen from "../components/SplashScreen";
import { ToastProvider } from '../components/ToastProvider';
import MobileBackButton from '../components/MobileBackButton';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://blog.955827.xyz'),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.bio,
  keywords: ['博客', '技术博客', '独立开发', 'Cloudflare', 'RCJ Lab', 'Bortala', '前端', '全栈', '个人作品集'],
  authors: [{ name: siteConfig.authorName, url: 'https://blog.955827.xyz' }],
  creator: siteConfig.authorName,
  publisher: siteConfig.authorName,
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': 'https://blog.955827.xyz/feed.xml',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://blog.955827.xyz',
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.bio,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.bio,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: siteConfig.faviconUrl,
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: '宝藏之地',
    statusBarStyle: 'black-translucent',
  },
};

// PWA 独立窗口时的系统状态栏/地址栏颜色
export const viewport: Viewport = {
  themeColor: '#312e81',
};

// 站点级结构化数据：Person + WebSite（含站内搜索 Action），帮助搜索引擎理解站点归属
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://blog.955827.xyz/#person',
      name: siteConfig.authorName,
      url: 'https://blog.955827.xyz',
      image: siteConfig.avatarUrl,
      description: siteConfig.bio,
      email: siteConfig.social?.email,
      sameAs: ['https://github.com/Bortala5827', 'https://955827.xyz'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://blog.955827.xyz/#website',
      url: 'https://blog.955827.xyz',
      name: siteConfig.title,
      description: siteConfig.bio,
      inLanguage: 'zh-CN',
      publisher: { '@id': 'https://blog.955827.xyz/#person' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://blog.955827.xyz/?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${notoSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 0; visibility: hidden; pointer-events: none; }
              html.splash-seen #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
            `
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('hasSeenSplash') === 'true') {
                  document.documentElement.classList.add('splash-seen');
                }
              } catch (e) {}
            `
          }}
        />
      </head>

      {/* 注意：这里不能用 w-screen（=100vw，包含垂直滚动条宽度）：
          页面出现滚动条时 body 会比可视区宽出滚动条那一截，
          导致 max-w-* + mx-auto 的内容整体右移、右侧被裁。用 w-full(100%) 才是可视宽度。 */}
      <body className="w-full overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif pb-14 md:pb-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <ThemeProvider>
          <ToastProvider>

          <SplashScreen />

          <MusicProvider>
            {/* 重型装饰组件都在 HeavyDecor 里（Client Component，里面 dynamic import ssr:false） */}
            <HeavyDecor />

            <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-1000">
              <div className="relative z-10 flex-1 flex flex-col">
                {children}
              </div>

              <div className="md:hidden block">
                <MobileBackButton />
              </div>
            </div>

            <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
              @keyframes gradientMove { 
                0% { background-position: 0% 50%; } 
                50% { background-position: 100% 50%; } 
                100% { background-position: 0% 50%; } 
              }
            `}} />
          </MusicProvider>

          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
