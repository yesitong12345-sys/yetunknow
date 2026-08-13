"use client";

/**
 * THESIS: the photographed desk is the interface, never a backdrop behind cards.
 * OWN-WORLD: fibrous paper, worn book cloth, graphite, crayon, tape, wood, soft shadow.
 * STORY: recognize four personal objects, then open ideas, days, work, or the locked studio.
 * FIRST VIEWPORT: one intact desk; the title lives inside the open notebook.
 * FORM: Experience mode, spatial still-life index pinned by the user's reference image.
 */

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { SNAPSHOTS_KEY, type LocalSnapshot } from "@/lib/studio";
import { DailyRevealLink } from "./DailyRevealLink";
import { IdeaNotesStack } from "./IdeaNotesStack";

const sceneObjects = [
  { href: "/ideas", className: "scene-notes", label: "灵感便签", title: "奇思妙想", note: "翻下一张空白便签" },
  { href: "/daily", className: "scene-book", label: "手账", title: "日常记录", note: "碰一下，翻开看看" },
  { href: "/projects", className: "scene-toolbox", label: "纸板工具盒", title: "项目作品", note: "打开工具盒" },
  { href: "/auth", className: "scene-drawer", label: "上锁抽屉", title: "私人记录台", note: "封条拦住了抽屉" },
] as const;

export function DeskScene() {
  const reduceMotion = useReducedMotion();
  const [latestGrowth, setLatestGrowth] = useState<LocalSnapshot | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SNAPSHOTS_KEY);
    const snapshots = stored ? JSON.parse(stored) as LocalSnapshot[] : [];
    const local = snapshots.find((item) => !item.withdrawnAt) ?? null;
    void fetch("/api/public/latest").then((response) => response.json()).then((payload: { latest?: { title: string; kind: LocalSnapshot["kind"] } | null }) => queueMicrotask(() => setLatestGrowth(payload.latest ? { ...local, id: "cloud-latest", sourceNoteId: "", slug: "", excerpt: "", body: "", publishedAt: new Date().toISOString(), withdrawnAt: null, ...payload.latest } : local))).catch(() => queueMicrotask(() => setLatestGrowth(local)));
  }, []);

  function openWithSpace(event: KeyboardEvent<HTMLAnchorElement>, href: string) {
    if (event.key === " " || event.key === "Spacebar" || event.code === "Space") {
      event.preventDefault();
      window.location.assign(href);
    }
  }

  return (
    <section className="desk-v2" aria-label="私人书桌：四个可探索入口">
      <motion.div
        className="desk-v2-stage"
        initial={{ opacity: 0, filter: "blur(8px)", scale: 0.992 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={reduceMotion ? { duration: 0.01 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="desk-v2-photo" aria-hidden="true" />

        {sceneObjects.map((object) => {
          if (object.href === "/ideas") {
            return <div key={object.href} className="scene-object scene-notes"><IdeaNotesStack /></div>;
          }
          if (object.href === "/daily") {
            return <div key={object.href} className="scene-object scene-book"><DailyRevealLink /></div>;
          }
          return (
            <div key={object.href} className={`scene-object ${object.className}`}>
              <Link href={object.href} aria-label={`${object.label}：${object.title}`} onKeyDown={(event: KeyboardEvent<HTMLAnchorElement>) => openWithSpace(event, object.href)}>
                <span className="scene-object-crop" aria-hidden="true" />
                {object.href === "/auth" && <span className="drawer-seal" aria-hidden="true" />}
                <span className="scene-object-tag">
                  <small>{object.label}</small>
                  <strong>{object.title}</strong>
                  <i>{object.note}</i>
                  <b aria-hidden="true">↗</b>
                </span>
              </Link>
            </div>
          );
        })}

        {latestGrowth && (
          <motion.aside
            className="scene-growth"
            initial={{ opacity: 0, clipPath: "inset(100% 0 0 0)", y: 18 }}
            animate={{ opacity: 1, clipPath: "inset(0% 0 0 0)", y: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <small>刚长出的公开纸片</small>
            <strong>{latestGrowth.title}</strong>
            <Link href={`/${latestGrowth.kind}`}>去看看 ↗</Link>
          </motion.aside>
        )}
      </motion.div>
    </section>
  );
}
