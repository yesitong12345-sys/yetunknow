import { DetailPage } from "@/components/DetailPage";
import { getEntries } from "@/lib/content";
import { getMergedPublicEntry } from "@/lib/public-repository";
import { LocalSnapshotDetail } from "@/components/LocalSnapshotDetail";

export function generateStaticParams() { return getEntries("daily").map(({ slug }) => ({ slug })); }
export default async function DailyDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const decodedSlug = decodeURIComponent(slug); const entry = await getMergedPublicEntry("daily", decodedSlug); return entry ? <DetailPage entry={entry} /> : <LocalSnapshotDetail kind="daily" slug={decodedSlug} />;
}
