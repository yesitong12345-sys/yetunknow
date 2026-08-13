import type { Metadata } from "next";
import { DailyComposition } from "@/components/DailyComposition";
import { SiteHeader } from "@/components/SiteHeader";
import { getMergedPublicEntries } from "@/lib/public-repository";

export const metadata: Metadata = { title: "日常记录" };

export default async function DailyPage() {
  return <main className="reading-shell daily-composition-shell"><SiteHeader /><DailyComposition entries={await getMergedPublicEntries("daily")} /></main>;
}
