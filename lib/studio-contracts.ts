import type { ContentKind } from "./content";

export type SyncState =
  | "idle"
  | "saving"
  | "synced"
  | "offline"
  | "retrying"
  | "error"
  | "conflict";

export type StudioNote = {
  id: string;
  ownerId?: string;
  kind: ContentKind;
  title: string;
  bodyMarkdown: string;
  rawIdea?: string | null;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteDraft = Pick<StudioNote, "kind" | "title" | "bodyMarkdown"> & {
  rawIdea?: string | null;
};

export type NoteAttachment = {
  id: string;
  noteId: string;
  kind: "image" | "audio";
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
  previewUrl?: string;
};

export type PublicSnapshot = {
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

export type ConditionalUpdate = NoteDraft & {
  id: string;
  baseUpdatedAt: string;
};

export type NoteConflict = {
  mine: StudioNote;
  cloud: StudioNote;
};

export type ImportPreview = {
  notes: StudioNote[];
  snapshots: PublicSnapshot[];
  duplicates: string[];
};
export type ImportResult = { importedNotes: number; importedSnapshots: number; skipped: string[]; conflicts: string[] };

export interface StudioRepository {
  listNotes(): Promise<StudioNote[]>;
  getNote(id: string): Promise<StudioNote | null>;
  createNote(draft: NoteDraft): Promise<StudioNote>;
  updateNote(update: ConditionalUpdate): Promise<StudioNote | NoteConflict>;
  deleteNote(id: string): Promise<void>;
  listAttachments(noteId: string): Promise<NoteAttachment[]>;
  uploadAttachment(noteId: string, file: File): Promise<NoteAttachment>;
  deleteAttachment(attachment: NoteAttachment): Promise<void>;
  importLocal(preview: ImportPreview): Promise<ImportResult>;
  listSnapshots(): Promise<PublicSnapshot[]>;
  publishSnapshot(snapshot: Omit<PublicSnapshot, "id" | "publishedAt" | "withdrawnAt">): Promise<PublicSnapshot>;
  withdrawSnapshot(id: string): Promise<void>;
}
