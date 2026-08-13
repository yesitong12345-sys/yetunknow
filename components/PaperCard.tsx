import Link from "next/link";
import type { PublicEntry } from "@/lib/content";

export function PaperCard({ entry, index = 0 }: { entry: PublicEntry; index?: number }) {
  return (
    <article className={`paper-card paper-${entry.kind}`} style={{ "--tilt": `${index % 2 ? 1.2 : -1.1}deg` } as React.CSSProperties}>
      <div className="tape" aria-hidden="true" />
      <p className="card-meta"><span>{entry.tags[0]}</span><time dateTime={entry.date}>{entry.date}</time></p>
      <h2><Link href={`/${entry.kind}/${entry.slug}`}>{entry.title}</Link></h2>
      <p>{entry.excerpt}</p>
      <Link href={`/${entry.kind}/${entry.slug}`} className="scribble-link" aria-label={`阅读《${entry.title}》`}>
        翻开看看 <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
