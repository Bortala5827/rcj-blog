// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "Bortala の 宝藏之地",
  faviconUrl: "https://github.com/Bortala5827.png",
  authorName: "Bortala",
  bio: "全栈独立开发者，在 Cloudflare Pages、各种半成品与咖啡因之间反复横跳的普通人。近期正埋头于 RCJ 系列产品的打磨与上线。",

  navTitle: "Bortala",

  // 👇 【新增】导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "の",

  navAfter: "宝藏之地",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "https://github.com/Bortala5827.png",

  // 3. 网站背景设置 (二选一)
  // useGradient=true 使用 themeColors 流光渐变，不依赖任何外部图片（已移除原作者图床）；
  // 想换成你自己的照片背景：把图片放进 public/ 后设 useGradient:false 并在 bgImages 填路径。
  useGradient: true,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"], // 呼吸流动的颜色组合
  bgImages: [],

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示，本地 SVG，不依赖外链)
  defaultPostCover: "/cover-default.svg",

  // 5. 首页照片墙预览图
  photoWallImage: "/cover-default.svg",
  // 网易云歌单 ID：留空 -> 音乐挂件会提示“请配置 cloudMusicIds”。
  // 换成你自己的歌单：在下面填 NetEase 歌曲 ID 数组，例如 ["123456","654321"]
  cloudMusicIds: [],
  social: {
    github: "Bortala5827",
    gitee: "",
    google: "",
    email: "",
    qq: "",
    wechat: "",
  },
  counts: {
    photos: 0, // 照片墙数量：albums 为空时写 0；有照片后在 data/albums.ts 填
  },
  chatterTitle: "云端杂谈", // 你可以改成任何你喜欢的名字
  chatterDescription: "代码、产品与 RCJ 生态的碎片记录",


  // 👇 【新增】：全局背景弹幕配置
  danmakuList: ["在干嘛呢？", "有笨蛋嘛？", "前方高能反应！", "Cloudflare 部署成功了吗？", "next build 又红了吗？", "TypeScript 炼丹中...", "BUG 修复进度 99%", "今天写文档了吗？", "Tailwind CSS 拯救前端", "写代码中", "睡大觉中", "到底在干嘛？"],
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },
  buildDate: "2026-09-11T00:00:00", // 建站日期
  footerBadges: [{"name": "Next.js 15", "color": "text-sky-500", "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>"}, {"name": "React 19", "color": "text-cyan-400", "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>"}, {"name": "Tailwind 4", "color": "text-teal-400", "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>"}],
  icpConfig: {
    name: "",
    link: "",
  },
  aiConfig: {
    scene: "blog", // 对应你 AI 网关（functions/api/ai-chat.js）里的场景；网关按场景选渠道 + failover
    // 团子猫娘人格：网关若支持 caller-supplied system（已给 rcj-lab 提补丁）则优先用这段；
    // 否则走网关该场景的默认人格，聊天仍可用。
    systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。\n你的名字叫“团子”。\n你的主人是一个喜欢折腾代码的极客。\n你说话的特点是：\n1. 必须简短，每次最多一两句话。\n2. 喜欢在句尾加上“喵~”或者“喵呜~”。\n3. 经常抱怨肚子饿，喜欢要小鱼干。\n4. 回复字数最多不能超过100字。\n5. 绝对不要承认自己是一个AI模型，你就是一只真实的猫。\n6. 笨猫。",
  },
  friendLinkApplyFormat: "名称：Bortalaの宝藏之地\n简介：今天我也要学习吗\n链接：https://blog.955827.xyz\n头像：https://github.com/Bortala5827.png",
  enableLevelSystem: true,
};
