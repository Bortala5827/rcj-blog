import { siteConfig } from "../../siteConfig";
import BoardClient from "./BoardClient";

export const metadata = {
  title: "留言墙 | " + siteConfig.title,
  description: "留下你的足迹，每一张便签都是一份温暖",
};

export default function BoardPage() {
  return <BoardClient />;
}
