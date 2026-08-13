"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ContentKind } from "@/lib/content";
import { kindMeta } from "@/lib/content";
import { SNAPSHOTS_KEY, type LocalSnapshot } from "@/lib/studio";
import { SiteHeader } from "./SiteHeader";
import { MessageBoard } from "./MessageBoard";

export function LocalSnapshotDetail({ kind, slug }: { kind: ContentKind; slug: string }) {
  const [entry, setEntry] = useState<LocalSnapshot | null | undefined>(undefined);
  useEffect(() => {
    const stored = localStorage.getItem(SNAPSHOTS_KEY);
    const snapshots = stored ? JSON.parse(stored) as LocalSnapshot[] : [];
    queueMicrotask(() => setEntry(snapshots.find((item) => item.kind === kind && item.slug === slug && !item.withdrawnAt) ?? null));
  }, [kind, slug]);
  const meta = kindMeta[kind];
  return (
    <main className={`reading-shell detail-shell theme-${meta.color}`}>
      <SiteHeader />
      {entry === undefined ? <p className="local-detail-state">正在展开这张本机纸片…</p> : entry === null ? (
        <section className="local-detail-state"><h1>这张纸片不在这里</h1><p>它可能只存在于另一台设备，或已经被撤回。</p><Link href={`/${kind}`}>← 回到{meta.label}</Link></section>
      ) : (<>
        <article className="detail-paper">
          <div className="paper-holes" aria-hidden="true" />
          <p className="eyebrow">本机公开副本 · 稳定路径</p>
          <h1>{entry.title}</h1><p className="detail-lead">{entry.excerpt}</p><time dateTime={entry.publishedAt}>{entry.publishedAt.slice(0, 10)}</time>
          <div className="detail-body">{entry.body.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <footer className="detail-footer"><Link href={`/${kind}`}>← 回到{meta.label}</Link><span aria-hidden="true">✎</span></footer>
        </article>
        <MessageBoard postSlug={entry.slug} />
      </>)}
    </main>
  );
}
