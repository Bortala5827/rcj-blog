// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 你的 AI 网关（functions/api/ai-chat.js，部署在 955827.xyz）
    // 协议：POST { gatewayUrl }  body: { scene, messages, [system] }  →  { reply } / { error }
    // 网关内部已配置国内渠道（dots / agnes / groq / b.ai / sensenova）与 failover，
    // 密钥全部在网关侧（Cloudflare Pages Secrets），博客侧无需任何 key。
    const gatewayUrl = (process.env.AI_GATEWAY_URL || 'https://955827.xyz/api/ai-chat')
      .trim()
      .replace(/\/+$/, '');

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scene: siteConfig.aiConfig.scene || 'blog',
        // 若网关支持 caller-supplied system（已给 rcj-lab 打补丁），则优先用博客猫娘人格；
        // 否则网关走自身场景默认人格，聊天依旧可用。
        system: siteConfig.aiConfig.systemPrompt,
        messages: [{ role: 'user', content: message }],
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

    const reply = data?.reply || '本喵现在不想理你喵...';
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
