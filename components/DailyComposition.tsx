"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicEntry } from "@/lib/content";
import { SNAPSHOTS_KEY, type LocalSnapshot } from "@/lib/studio";

function entryDateTime(entry: PublicEntry) {
  const value = new Date(entry.date.length === 10 ? `${entry.date}T12:00:00+08:00` : entry.date);
  return Number.isNaN(value.getTime()) ? new Date(0) : value;
}

function anchorFor(entry: PublicEntry) {
  return `daily-${entryDateTime(entry).toISOString().replace(/[:.]/g, "-")}-${entry.slug}`;
}

export function DailyComposition({ entries }: { entries: PublicEntry[] }) {
  const [localEntries, setLocalEntries] = useState<PublicEntry[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SNAPSHOTS_KEY);
      const snapshots = stored ? JSON.parse(stored) as LocalSnapshot[] : [];
      const dailyEntries = snapshots
        .filter((snapshot) => snapshot.kind === "daily" && !snapshot.withdrawnAt)
        .map((snapshot): PublicEntry => ({
          kind: "daily",
          slug: snapshot.slug,
          title: snapshot.title,
          excerpt: snapshot.excerpt,
          body: snapshot.body.split(/\n{2,}/).filter(Boolean),
          date: snapshot.publishedAt,
          deskObjectKey: "journal",
          tags: ["本机公开副本"],
          example: false,
        }));
      queueMicrotask(() => setLocalEntries(dailyEntries));
    } catch {
      queueMicrotask(() => setLocalEntries([]));
    }
  }, []);

  const ordered = useMemo(() => {
    const merged = new Map(entries.map((entry) => [entry.slug, entry]));
    for (const entry of localEntries) merged.set(entry.slug, entry);
    return [...merged.values()].sort((a, b) => entryDateTime(a).getTime() - entryDateTime(b).getTime());
  }, [entries, localEntries]);
  const [selected, setSelected] = useState(ordered.at(-1)?.date.slice(0, 10) ?? "");

  function locate() {
    const sameDay = ordered.filter((entry) => entry.date.slice(0, 10) === selected);
    const target = sameDay[0] ?? ordered.find((entry) => entry.date.slice(0, 10) >= selected) ?? ordered.at(-1);
    if (!target) return;
    const id = anchorFor(target);
    history.replaceState(null, "", `#${id}`);
    const element = document.getElementById(id);
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  return (
    <section className="daily-composition-wrap" aria-labelledby="daily-composition-title">
      <aside className="daily-locator" aria-label="按日期定位日常记录">
        <label htmlFor="daily-date">翻到某一天</label>
        <input id="daily-date" type="date" value={selected} onChange={(event) => setSelected(event.target.value)} />
        <button type="button" onClick={locate}>定位这一天</button>
      </aside>
      <article className="daily-composition-paper">
        <header>
          <p className="eyebrow">DAILY COMPOSITION · 从前往后</p>
          <h1 id="daily-composition-title">日常记录</h1>
          <p>最早的信息在上面，最新的消息会接着写在最下面。</p>
        </header>
        <div className="daily-composition-entries">
          {ordered.map((entry) => {
            const value = entryDateTime(entry);
            const id = anchorFor(entry);
            return (
              <section className="daily-composition-entry" id={id} tabIndex={-1} key={entry.slug}>
                <time dateTime={value.toISOString()}>{new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(value)}</time>
                <h2>{entry.title}</h2>
                {entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <a className="daily-anchor-link" href={`#${id}`} aria-label={`定位到 ${entry.title}`}>#</a>
              </section>
            );
          })}
        </div>
      </article>
    </section>
  );
}
