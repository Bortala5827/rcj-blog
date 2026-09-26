// 本文件可由控制台自动生成，也可手动修改

export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  url?: string;
  tags: string[];
};

export const projectsData: Project[] = [
  {
    id: "proj_rcj_shop",
    name: "rcj-shop",
    githubUrl: "https://github.com/Bortala5827/rcj-shop",
    url: "https://shop.955827.xyz",
    description: "跑在 Cloudflare Pages + 共享 D1 上的极简小商城，零构建单文件。支付以闲鱼为主、PayPal 次之。",
    icon: "🛒",
    tags: ["Cloudflare", "D1", "独立产品"]
  },
  {
    id: "proj_rcj_supportly",
    name: "rcj-supportly",
    githubUrl: "https://github.com/Bortala5827/rcj-supportly",
    url: "https://support.955827.xyz",
    description: "基于 Cloudflare Workers + D1 + GitHub Actions 的客服/支持系统，CI/CD 全自动。",
    icon: "🛠️",
    tags: ["Workers", "D1", "CI/CD"]
  },
  {
    id: "proj_rcj_dinner",
    name: "rcj-dinner",
    githubUrl: "https://github.com/Bortala5827/rcj-dinner",
    url: "https://dinner.955827.xyz",
    description: "私人情侣点餐 App，双实例白标 + 个人版，移动端 UI + PWA。",
    icon: "🍜",
    tags: ["PWA", "移动端", "白标"]
  },
  {
    id: "proj_facetalk",
    name: "facetalk",
    githubUrl: "https://github.com/Bortala5827/facetalk",
    url: "https://facetalk.955827.xyz",
    description: "匿名面试 / 语音互选平台：免登录、60 秒语音试聊，双方都同意才配对；PWA + 轻量 WebView，三语即开即用。",
    icon: "🗣️",
    tags: ["匿名互选", "语音试聊", "PWA"]
  },
  {
    id: "proj_rcj_lab",
    name: "rcj-lab (955827.xyz)",
    githubUrl: "https://github.com/Bortala5827/rcj-lab",
    url: "https://955827.xyz",
    description: "主站 hub，下挂 facetalk / speak 等子项目，承载 AI 网关 functions/api/ai-chat.js 与全站工具聚合。",
    icon: "🌐",
    tags: ["hub", "AI 网关", "工具聚合"]
  },
];
