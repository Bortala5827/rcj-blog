import { siteConfig } from "@/siteConfig";
import MusicClient from "./MusicClient";

// 🌟 这里是服务端渲染，完美支持 metadata
export const metadata = {
  title: "Music | " + siteConfig.title,
};

export default function MusicPage() {
  return <MusicClient />;
}