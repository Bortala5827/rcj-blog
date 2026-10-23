import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ProjectsBoard from './ProjectsBoard';
import {siteConfig} from "@/siteConfig";

export const metadata = {
  title: "Projects | " + siteConfig.title,
  description: "Open-source projects & code repos",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <ProjectsBoard />
        </div>
      </PageTransition>
    </div>
  );
}