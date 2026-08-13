"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SNAPSHOTS_KEY, type LocalSnapshot } from "@/lib/studio";

export function HomeGrowth({ className = "" }: { className?: string }) {
  const [latest, setLatest] = useState<LocalSnapshot | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SNAPSHOTS_KEY);
    const snapshots = stored ? JSON.parse(stored) as LocalSnapshot[] : [];
    const local = snapshots.find((item) => !item.withdrawnAt) ?? null;
    void fetch("/api/public/latest").then((response) => response.json()).then((payload: { latest?: { title: string; kind: LocalSnapshot["kind"] } | null }) => queueMicrotask(() => setLatest(payload.latest ? { ...local, id: "cloud-latest", sourceNoteId: "", slug: "", excerpt: "", body: "", publishedAt: new Date().toISOString(), withdrawnAt: null, ...payload.latest } : local))).catch(() => queueMicrotask(() => setLatest(local)));
  }, []);

  if (!latest) return null;

  return (
    <aside className={`home-growth ${className}`}>
      <small>刚长出的公开纸片</small>
      <strong>{latest.title}</strong>
      <Link href={`/${latest.kind}`}>去看看 ↗</Link>
    </aside>
  );
}
