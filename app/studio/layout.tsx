import type { Metadata } from "next";
import { StudioNav } from "@/components/StudioNav";
import { requireOwner } from "@/lib/auth";

export const metadata: Metadata = { title: "上锁抽屉", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return <main className="studio-shell"><StudioNav />{children}</main>;
}
