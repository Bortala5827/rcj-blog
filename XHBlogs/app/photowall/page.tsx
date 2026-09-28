import { siteConfig } from "../../siteConfig";
import PhotoWallClient from "./PhotoWallClient";

export const metadata = {
  title: "光影画廊 | " + siteConfig.title,
};

export default function PhotoWallPage() {
  return <PhotoWallClient />;
}