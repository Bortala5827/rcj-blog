// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

export async function POST(req: Request) {
  console.log("🚀 [1/5] 路由进入：开始对接 AI 网关（反代）");

  try {
    const { message } = await req.json();

    // 🌟 全部走环境变量读取网关配置（不硬编码任何密钥）
    const gatewayUrl = (process.env.AI_GATEWAY_URL || '').trim().replace(/\/+$/, '');
    const apiKey = (process.env.AI_GATEWAY_KEY || '').trim();
    const model = (process.env.AI_GATEWAY_MODEL || siteConfig.aiConfig.model || '').trim();

    if (!gatewayUrl || !apiKey) {
      console.error("❌ 缺少 AI 网关配置 (AI_GATEWAY_URL / AI_GATEWAY_KEY)");
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), { status: 500 });
    }

    // 假设网关是 OpenAI 兼容接口（/v1/chat/completions）
    const url = `${gatewayUrl}/chat/completions`;
    console.log(`📡 [2/5] 正在呼叫网关: ${url} (model: ${model})`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: siteConfig.aiConfig.systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: siteConfig.aiConfig.maxOutputTokens,
        temperature: siteConfig.aiConfig.temperature,
        stream: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🚨 网关拒绝了请求:", JSON.stringify(data));
      return new Response(JSON.stringify({
        error: `网关拒绝访问: ${response.status}`,
        details: data?.error?.message || data?.message || "未知错误"
      }), { status: response.status });
    }

    console.log("✅ [3/5] 网关成功响应");
    const reply = data?.choices?.[0]?.message?.content || "本喵现在不想理你喵...";

    console.log("🎉 [4/5] 回复已生成，准备传回前端");

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("🔥 [5/5] 运行时崩溃:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "Ready", model: "AI Gateway" }), { status: 200 });
}
