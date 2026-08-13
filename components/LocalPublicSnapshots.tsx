"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ContentKind } from "@/lib/content";
import { SNAPSHOTS_KEY, type LocalSnapshot } from "@/lib/studio";

export function LocalPublicSnapshots({ kind }: { kind: ContentKind }) {
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<LocalSnapshot[]>([]);
  useEffect(() => {
    const stored = localStorage.getItem(SNAPSHOTS_KEY);
    const snapshots = stored ? JSON.parse(stored) as LocalSnapshot[] : [];
    queueMicrotask(() => setItems(snapshots.filter((item) => item.kind === kind && !item.withdrawnAt)));
  }, [kind]);
  return items.map((item) => (
    <motion.article key={item.id} className={`paper-card paper-${kind} local-snapshot`} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 35, scale: 0.86, rotate: -5 }} animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}>
      <div className="tape" aria-hidden="true" />
      <p className="card-meta"><span>本机公开副本</span><time dateTime={item.publishedAt}>{item.publishedAt.slice(0, 10)}</time></p>
      <h2><Link href={`/${item.kind}/${item.slug}`}>{item.title}</Link></h2>
      <p>{item.excerpt}</p>
      <Link className="scribble-link" href={`/${item.kind}/${item.slug}`}>阅读公开正文 <span aria-hidden="true">↗</span></Link>
    </motion.article>
  ));
}
