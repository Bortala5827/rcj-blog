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

export const albums: Album[] = [];
