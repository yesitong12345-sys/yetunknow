import type { Metadata } from "next";
import { CollectionPage } from "@/components/CollectionPage";

export const metadata: Metadata = { title: "奇思妙想" };
export default function IdeasPage() { return <CollectionPage kind="ideas" />; }
