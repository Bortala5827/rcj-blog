// 照片墙数据：目前为空，等待主人上传自己的照片。
// 添加相册示例：
// {
//   id: "my-trip",
//   title: "某次出行",
//   description: "一句话说明",
//   cover: "/你的封面.jpg",            // 把图片放进 public/ 后引用
//   date: "2026.09",
//   photos: [{ url: "/照片1.jpg", caption: "说明" }]
// }
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "life-slices",
    title: "生活碎片",
    description: "日常里随手截下的光",
    cover: "/blog-photo-1.png",
    date: "2026.08",
    photos: [
      { url: "/blog-photo-1.png", caption: "随手一拍" },
      { url: "/blog-photo-2.jpg", caption: "某一刻" },
      { url: "/life-1-portrait-suit.jpg", caption: "正装肖像" },
      { url: "/life-2-team.jpg", caption: "团队活动" },
      { url: "/life-3-sketch-portrait.jpg", caption: "素描肖像" },
      { url: "/life-4-fire-sketch.jpg", caption: "主题素描" },
    ],
  },
];
