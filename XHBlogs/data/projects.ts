// 本文件可由控制台自动生成，也可手动修改

export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
};

export const projectsData: Project[] = [
  {
    id: "proj_rcj_shop",
    name: "rcj-shop",
    githubUrl: "https://github.com/Bortala5827/rcj-shop",
    description: "跑在 Cloudflare Pages + 共享 D1 上的极简小商城，零构建单文件。三档定价 ¥9.9 / ¥39 / ¥69，支付以闲鱼为主、PayPal 次之。",
    icon: "🛒",
    tags: ["Cloudflare", "D1", "独立产品"]
  },
  {
    id: "proj_cloudflare_pay_kit",
    name: "cloudflare-pay-kit",
    githubUrl: "https://github.com/Bortala5827/cloudflare-pay-kit",
    description: "从 rcj 支付系统提炼的开源模板，专注国际受众。把支付 + 部署经验抽象成可复用方案。",
    icon: "💳",
    tags: ["开源", "支付", "Cloudflare"]
  },
  {
    id: "proj_rcj_supportly",
    name: "rcj-supportly",
    githubUrl: "https://github.com/Bortala5827/rcj-supportly",
    description: "基于 Cloudflare Workers + D1 + GitHub Actions 的客服/支持系统，CI/CD 全自动。",
    icon: "🛠️",
    tags: ["Workers", "D1", "CI/CD"]
  },
  {
    id: "proj_rcj_dinner",
    name: "rcj-dinner",
    githubUrl: "https://github.com/Bortala5827/rcj-dinner",
    description: "私人情侣点餐 App，双实例白标 + 个人版，移动端 UI + PWA（dinner.955827.xyz）。",
    icon: "🍜",
    tags: ["PWA", "移动端", "白标"]
  },
  {
    id: "proj_facetalk",
    name: "facetalk",
    githubUrl: "https://github.com/Bortala5827/facetalk",
    description: "三语（中 / 英 / 日）站点，AI 激活相关能力打磨中。",
    icon: "🗣️",
    tags: ["三语", "i18n", "AI"]
  },
  {
    id: "proj_rcj_lab",
    name: "rcj-lab (955827.xyz)",
    githubUrl: "https://github.com/Bortala5827/rcj-lab",
    description: "主站 hub，下挂 facetalk / speak 等子项目，承载 AI 网关 functions/api/ai-chat.js 与全站工具聚合。",
    icon: "🌐",
    tags: ["hub", "AI 网关", "工具聚合"]
  },
];
