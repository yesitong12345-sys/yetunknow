import { StudioEditor } from "@/components/StudioEditor";
import type { ContentKind } from "@/lib/content";

export default async function NewNotePage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const initialKind: ContentKind = kind === "daily" || kind === "projects" ? kind : "ideas";
  return <StudioEditor noteId="new" initialKind={initialKind} />;
}
