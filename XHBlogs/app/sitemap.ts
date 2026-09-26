import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const SITE_URL = 'https://blog.955827.xyz';

export default function sitemap(): MetadataRoute.Sitemap {
  const postsDir = path.join(process.cwd(), 'posts');
  let posts: MetadataRoute.Sitemap = [];

  if (fs.existsSync(postsDir)) {
    posts = fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const slug = f.replace(/\.md$/, '');
        const { data } = matter(fs.readFileSync(path.join(postsDir, f), 'utf8'));
        const lastModified = data.date ? new Date(String(data.date)) : new Date();
        return {
          url: `${SITE_URL}/posts/${slug}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/projects`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/timeline`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/friends`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/photowall`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/music`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  return [...staticPages, ...posts];
}
