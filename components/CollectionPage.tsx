import type { ContentKind } from "@/lib/content";
import { kindMeta } from "@/lib/content";
import { PaperCard } from "./PaperCard";
import { SiteHeader } from "./SiteHeader";
import { LocalPublicSnapshots } from "./LocalPublicSnapshots";
import { getMergedPublicEntries } from "@/lib/public-repository";

export async function CollectionPage({ kind }: { kind: ContentKind }) {
  const meta = kindMeta[kind];
  const items = await getMergedPublicEntries(kind);
  return (
    <main className={`reading-shell theme-${meta.color}`}>
      <SiteHeader />
      <section className="collection-hero">
        <p className="eyebrow">桌面第 {kind === "ideas" ? "一" : kind === "daily" ? "二" : "三"} 格</p>
        <h1>{meta.label}</h1>
        <p>{meta.kicker}</p>
        <span className="pencil-loop" aria-hidden="true" />
        <span className={`collection-book-asset collection-book-${kind}`} aria-hidden="true" />
      </section>
      <section className="card-grid" aria-label={`${meta.label}公开内容`}>
        <LocalPublicSnapshots kind={kind} />
        {items.map((entry, index) => <PaperCard key={`${entry.slug}-${index}`} entry={entry} index={index} />)}
      </section>
      <p className="example-note">这里目前都是清楚标注的示例内容，等你用自己的记录慢慢替换。</p>
    </main>
  );
}
