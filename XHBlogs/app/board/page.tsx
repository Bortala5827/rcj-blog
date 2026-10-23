import { siteConfig } from "../../siteConfig";
import BoardClient from "./BoardClient";

export const metadata = {
  title: "Wall | " + siteConfig.title,
  description: "Leave your trace — every note is a little warmth",
};

export default function BoardPage() {
  return <BoardClient />;
}
