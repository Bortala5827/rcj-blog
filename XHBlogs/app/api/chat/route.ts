// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

// ── 博客文章知识：运行时自取同源 /feed.xml（构建时静态生成）──
// 发新文章后 feed 自动更新，奔奔的知识零维护。隔离级缓存 5 分钟，失败静默降级。
let postsCache: { at: number; text: string } = { at: 0, text: '' };
const POSTS_CACHE_TTL = 5 * 60 * 1000;
const POSTS_MAX = 10;
const DESC_MAX = 80;

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function firstTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? unescapeXml(m[1].trim()) : '';
}

async function getPostsBlock(origin: string): Promise<string> {
  if (postsCache.at && Date.now() - postsCache.at < POSTS_CACHE_TTL) {
    return postsCache.text;
  }
  let text = '';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${origin}/feed.xml`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const xml = await res.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const lines = items.slice(0, POSTS_MAX).map((item) => {
        const title = firstTag(item, 'title');
        const link = firstTag(item, 'link');
        const desc = firstTag(item, 'description').slice(0, DESC_MAX);
        return `- [${title}](${link})${desc ? `：${desc}` : ''}`;
      });
      if (lines.length) {
        text = `\n\n【博客现有文章】（截至今天，共 ${items.length} 篇）\n${lines.join('\n')}`;
      }
    }
  } catch {
    // 取不到 feed 就不带文章知识，聊天照常可用
  }
  postsCache = { at: Date.now(), text };
  return text;
}

// ── 历史消息清洗：只留 user/assistant，限条数与长度，防滥用 ──
function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === 'object' &&
        ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
        typeof (m as ChatMessage).content === 'string'
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
}

export async function POST(req: Request) {
  try {
    const { message, history } = (await req.json()) as {
      message?: string;
      history?: unknown;
    };

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '消息不能为空' }), { status: 400 });
    }

    // 你的 AI 网关（functions/api/ai-chat.js，部署在 955827.xyz）
    // 协议：POST { gatewayUrl }  body: { scene, messages, [system] }  →  { reply } / { error }
    // 网关内部已配置国内渠道（dots / agnes / groq / b.ai / sensenova）与 failover，
    // 密钥全部在网关侧（Cloudflare Pages Secrets），博客侧无需任何 key。
    const gatewayUrl = (process.env.AI_GATEWAY_URL || 'https://955827.xyz/api/ai-chat')
      .trim()
      .replace(/\/+$/, '');

    // 人格 + 运行时文章知识（feed 取不到则自动省略）
    const postsBlock = await getPostsBlock(new URL(req.url).origin);
    const system = siteConfig.aiConfig.systemPrompt + postsBlock;

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scene: siteConfig.aiConfig.scene || 'blog',
        system,
        // 多轮对话：[...历史, 本条消息]，网关会拼在 system 后
        messages: [...sanitizeHistory(history), { role: 'user', content: message.slice(0, 800) }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `网关拒绝访问: ${response.status}`,
          details: data?.error || '未知错误',
        }),
        { status: response.status }
      );
    }

    const reply = data?.reply || '奔奔现在不想理你汪...';
    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'Ready', gateway: 'ai-gateway' }), {
    status: 200,
  });
}
