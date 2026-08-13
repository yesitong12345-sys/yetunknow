import type { ContentKind } from "./content";

export type PrivateNote = {
  id: string;
  kind: ContentKind;
  title: string;
  bodyMarkdown: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalSnapshot = {
  id: string;
  sourceNoteId: string;
  kind: ContentKind;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string;
  withdrawnAt: string | null;
};

export const NOTES_KEY = "living-desk:private-notes:v1";
export const SNAPSHOTS_KEY = "living-desk:public-snapshots:v1";
export const RECOVERY_KEY = "living-desk:recovery:v1";

export const initialNotes: PrivateNote[] = [
  {
    id: "demo-private-1", kind: "ideas", title: "示例私密原稿：还没整理的念头",
    bodyMarkdown: "这是一条本地演示原稿。它不会出现在公开内容里，除非你主动制作并确认公开副本。\n\n请不要在尚未连接 Supabase 前输入真正敏感的信息。",
    createdAt: "2026-08-08T09:30:00.000Z", updatedAt: "2026-08-08T09:30:00.000Z",
  },
];

export function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(title: string) {
  const latin = title.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");
  return `${latin || "paper"}-${Date.now().toString(36)}`;
}
