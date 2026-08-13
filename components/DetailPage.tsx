import Link from "next/link";
import type { PublicEntry } from "@/lib/content";
import { kindMeta } from "@/lib/content";
import { SiteHeader } from "./SiteHeader";
import { MessageBoard } from "./MessageBoard";

export function DetailPage({ entry }: { entry: PublicEntry }) {
  const meta = kindMeta[entry.kind];
  return (
    <main className={`reading-shell detail-shell theme-${meta.color}`}>
      <SiteHeader />
      <article className="detail-paper">
        <div className="paper-holes" aria-hidden="true" />
        <p className="eyebrow">{meta.singular} · {entry.tags[0]}</p>
        <h1>{entry.title}</h1>
        <p className="detail-lead">{entry.excerpt}</p>
        <time dateTime={entry.date}>{entry.date}</time>
        <div className="detail-body">
          {entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        {entry.kind === "projects" && (
          <section className="project-facts" aria-label="项目摘要">
            <div><h2>我的角色</h2><p>{entry.role}</p></div>
            <div><h2>过程</h2><ol>{entry.process?.map((step) => <li key={step}>{step}</li>)}</ol></div>
            <div><h2>结果</h2><p>{entry.result}</p></div>
          </section>
        )}
        <footer className="detail-footer">
          <Link href={`/${entry.kind}`}>← 回到{meta.label}</Link>
          <span aria-hidden="true">✎</span>
        </footer>
      </article>
      <MessageBoard postSlug={entry.slug} />
    </main>
  );
}
