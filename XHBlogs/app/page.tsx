import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import CloudPlayer from '../components/CloudPlayer';
import ThemeToggleBlock from '../components/ThemeToggleBlock';
import ProfileCard from '../components/ProfileCard';
import SiteDashboard from '../components/SiteDashboard';
import { albums } from '../data/albums';
import LyricBar from '../components/LyricBar';
import { ToastProvider } from '../components/ToastProvider';

import LatestPostsCarousel from '../components/LatestPostsCarousel';
import AlbumPosterCarousel from '../components/AlbumPosterCarousel';
import DanmakuBackground from '../components/DanmakuBackground';
import { projectsData as projects } from '../data/projects';

// 缺省封面轮换池：新文章没写 cover（或沿用模板默认值）时按 slug 哈希稳定分配，避免轮播里封面重复
const FALLBACK_COVERS = ['/cover-alt-indigo.svg', '/cover-alt-teal.svg', '/cover-alt-amber.svg', '/cover-default.svg'];
function pickCover(slug: string, frontmatterCover?: string) {
  if (frontmatterCover && frontmatterCover !== '/cover-default.svg') return frontmatterCover;
  let h = 5381;
  for (const c of slug) h = (Math.imul(h, 33) ^ c.charCodeAt(0)) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return FALLBACK_COVERS[h % FALLBACK_COVERS.length];
}

function formatUpdateTime(dateString: string) {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (hours === '00' && mins === '00') return `${year}.${month}.${day}`;
    return `${year}.${month}.${day} ${hours}:${mins}`;
  } catch { return dateString; }
}

export default function Home() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let allPosts: any[] = [];
  try {
    if (fs.existsSync(postsDirectory)) {
      const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md'));
      allPosts = fileNames.map(fileName => {
        const fullPath = path.join(postsDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        return {
          slug: fileName.replace(/\.md$/, ''),
          ...data,
          title: data.title || '',
          description: data.description || '',
          content: content || '',
          cover: pickCover(fileName.replace(/\.md$/, ''), data.cover),
          date: rawDate,
          formattedDate: formatUpdateTime(rawDate)
        };
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.slug.localeCompare(a.slug);
      });
    }
  } catch (e) {}
  const top5Posts = allPosts.length > 0 ? allPosts.slice(0, 5) : [{ slug: 'none', title: '暂无文章', description: '快去写第一篇吧！', cover: siteConfig.defaultPostCover, date: '', formattedDate: '' }];

  const realPhotoCount = albums.reduce((total, album) => total + album.photos.length, 0);
  const latestAlbum = albums.length > 0 ? albums[0] : { id: '', title: '照片墙', description: '查看摄影', cover: siteConfig.photoWallImage, date: '', photos: [] };

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <Navbar />
        <PageTransition>
          {/* 🌟 调整整体容器的内边距，适应手机端更小的屏幕 */}
          <div className="w-full max-w-6xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
            <SearchBar posts={allPosts} />

            <main className="flex flex-col gap-6 w-full mt-6">

              {/* 第一行：个人信息 + 播放器 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                {/* 手机上占满1列，电脑上占7列 */}
                <div className="col-span-1 lg:col-span-7 flex flex-col">
                    <ProfileCard postCount={allPosts.length} projectCount={projects.length} photoCount={realPhotoCount}/>
                </div>
                {/* 手机上占满1列，电脑上占5列 */}
                <div className="col-span-1 lg:col-span-5 flex flex-col">
                    <CloudPlayer/>
                </div>
              </div>

              {/* 歌词栏 */}
              <div className="w-full mt-[-10px]"><LyricBar/></div>

              {/* 第二行：文章轮播 + 照片墙 + 说说 + 主题切换 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

                {/* 左侧：文章轮播 (电脑端占4列，手机端排最上面) */}
                <div className="col-span-1 lg:col-span-4 flex flex-col min-h-[300px]">
                  <LatestPostsCarousel posts={top5Posts} />
                </div>

                {/* 右侧：组合面板 (电脑端占8列) */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">

                  {/* 照片墙大海报（相册图片轮播） */}
                  <AlbumPosterCarousel album={latestAlbum} />

                  {/* 底层网格：项目入口 + 主题切换器 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full flex-1">
                    <Link href="/projects" className="sm:col-span-2 flex flex-col min-h-[200px] rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 justify-between transition-all duration-700 hover:scale-[1.02] group">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">项目</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2">RCJ 生态与开源作品</p>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{projects.length}</span>
                        <span className="text-sm font-bold text-indigo-500 group-hover:translate-x-1 transition-transform">查看全部 →</span>
                      </div>
                    </Link>
                    <div className="sm:col-span-1 flex flex-col min-h-[120px]">
                      <ThemeToggleBlock />
                    </div>
                  </div>

                </div>
              </div>

              {/* 底部数据面板 */}
              <div className="w-full mt-4"><SiteDashboard/></div>
            </main>
          </div>
        </PageTransition>
      </div>
    </ToastProvider>
  );
}