// feed.xml —— RSS 2.0 订阅源（构建时静态生成，CF Pages 直接以静态文件分发）
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const dynamic = 'force-static';

const SITE_URL = 'https://blog.955827.xyz';
const SITE_TITLE = 'Bortala の 宝藏之地';
const SITE_DESC =
  '在做 RCJ Lab —— 一个把想法做成可用产品的个人工作室，东西基本都跑在 Cloudflare 边缘上。';
const AUTHOR = 'Bortala';
const EMAIL = 'bortala5827@gmail.com';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 去掉 markdown 标记，输出可读的纯文本摘要（供订阅器展示）
function toPlainText(md: string, maxLen = 400): string {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`~_\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

function buildRss(): string {
  const postsDir = path.join(process.cwd(), 'posts');
  const now = new Date();
  const items: string[] = [];

  if (fs.existsSync(postsDir)) {
    const posts = fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const slug = f.replace(/\.md$/, '');
        const { data, content } = matter(fs.readFileSync(path.join(postsDir, f), 'utf8'));
        const date = data.date ? new Date(String(data.date)) : new Date();
        return {
          slug,
          title: (data.title || slug).toString(),
          description: (data.description || '').toString(),
          date,
          dateUTC: isNaN(date.getTime()) ? now.toUTCString() : date.toUTCString(),
          content: content || '',
          tags: Array.isArray(data.tags) ? data.tags.map((t: unknown) => String(t)) : [],
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    for (const p of posts) {
      const desc =
        p.description ||
        toPlainText(p.content) ||
        SITE_DESC;
      items.push(
        [
          '  <item>',
          `    <title>${escapeXml(p.title)}</title>`,
          `    <link>${SITE_URL}/posts/${p.slug}</link>`,
          `    <guid isPermaLink="true">${SITE_URL}/posts/${p.slug}</guid>`,
          `    <pubDate>${p.dateUTC}</pubDate>`,
          `    <description>${escapeXml(desc)}</description>`,
          ...p.tags.map((t) => `    <category>${escapeXml(t)}</category>`),
          '  </item>',
        ].join('\n')
      );
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(SITE_TITLE)}</title>`,
    `    <link>${SITE_URL}</link>`,
    `    <description>${escapeXml(SITE_DESC)}</description>`,
    '    <language>zh-CN</language>',
    `    <lastBuildDate>${now.toUTCString()}</lastBuildDate>`,
    `    <managingEditor>${escapeXml(EMAIL)} (${escapeXml(AUTHOR)})</managingEditor>`,
    `    <webMaster>${escapeXml(EMAIL)} (${escapeXml(AUTHOR)})</webMaster>`,
    `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
  ].join('\n');
}

export async function GET() {
  const xml = buildRss();
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
