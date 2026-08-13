import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getEntries, type ContentKind, type PublicEntry } from "./content";
import { readPublicConfig } from "./config";

function normalizeStaticSlugs(items: PublicEntry[]) {
  const counts = new Map<string, number>();
  return items.map((item) => {
    const count = (counts.get(item.slug) ?? 0) + 1; counts.set(item.slug, count);
    return count === 1 ? item : { ...item, slug: `${item.slug}-${count}` };
  });
}

function mapCloudPost(row: Record<string, unknown>): PublicEntry {
  return { kind: row.kind as ContentKind, slug: String(row.slug), title: String(row.title), excerpt: String(row.excerpt ?? ""), body: String(row.body ?? "").split(/\n{2,}/).filter(Boolean), date: String(row.published_at), deskObjectKey: row.desk_object_key as PublicEntry["deskObjectKey"], tags: ["公开快照"], example: false };
}

export async function getMergedPublicEntries(kind: ContentKind): Promise<PublicEntry[]> {
  const seeded = normalizeStaticSlugs(getEntries(kind));
  const config = readPublicConfig();
  if (!config.NEXT_PUBLIC_SUPABASE_URL || !config.NEXT_PUBLIC_SUPABASE_ANON_KEY) return seeded;
  const client = createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.from("active_public_posts").select("id,kind,slug,title,excerpt,body,desk_object_key,published_at").eq("kind", kind);
  if (error) return seeded;
  const used = new Set(seeded.map((item) => item.slug));
  const cloud = (data ?? []).map(mapCloudPost).map((item) => {
    if (!used.has(item.slug)) { used.add(item.slug); return item; }
    let index = 2; while (used.has(`${item.slug}-${index}`)) index += 1;
    const safe = { ...item, slug: `${item.slug}-${index}` }; used.add(safe.slug); return safe;
  });
  return [...cloud, ...seeded];
}

export async function getMergedPublicEntry(kind: ContentKind, slug: string) {
  return (await getMergedPublicEntries(kind)).find((item) => item.slug === slug) ?? null;
}
