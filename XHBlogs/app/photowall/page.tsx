import { siteConfig } from "../../siteConfig";
import PhotoWallClient from "./PhotoWallClient";

export const metadata = {
  title: "Gallery | " + siteConfig.title,
};

export default function PhotoWallPage() {
  return <PhotoWallClient />;
}