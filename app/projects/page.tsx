import type { Metadata } from "next";
import { CollectionPage } from "@/components/CollectionPage";

export const metadata: Metadata = { title: "项目作品" };
export default function ProjectsPage() { return <CollectionPage kind="projects" />; }
