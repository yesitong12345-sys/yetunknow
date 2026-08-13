import { initialNotes, NOTES_KEY, SNAPSHOTS_KEY, type PrivateNote } from "./studio";
import type { ConditionalUpdate, NoteAttachment, NoteConflict, PublicSnapshot, StudioNote, StudioRepository } from "./studio-contracts";

function toStudioNote(note: PrivateNote): StudioNote {
  return { ...note, capturedAt: note.createdAt };
}

function localStorageOrThrow() {
  if (typeof window === "undefined") throw new Error("本地演示适配器只能在浏览器中使用");
  return window.localStorage;
}

export const localDemoStudioRepository: StudioRepository = {
  async listNotes() {
    const value = localStorageOrThrow().getItem(NOTES_KEY);
    return (value ? JSON.parse(value) as PrivateNote[] : initialNotes).map(toStudioNote);
  },
  async getNote(id) {
    return (await this.listNotes()).find((note) => note.id === id) ?? null;
  },
  async createNote(draft) {
    const now = new Date().toISOString();
    const note: StudioNote = { ...draft, id: crypto.randomUUID(), capturedAt: now, createdAt: now, updatedAt: now };
    const notes = await this.listNotes();
    localStorageOrThrow().setItem(NOTES_KEY, JSON.stringify([note, ...notes]));
    return note;
  },
  async updateNote(update: ConditionalUpdate): Promise<StudioNote | NoteConflict> {
    const notes = await this.listNotes();
    const cloud = notes.find((note) => note.id === update.id);
    if (!cloud) throw new Error("找不到这张纸");
    const mine: StudioNote = { ...cloud, ...update, updatedAt: new Date().toISOString() };
    if (cloud.updatedAt !== update.baseUpdatedAt) return { cloud, mine };
    localStorageOrThrow().setItem(NOTES_KEY, JSON.stringify(notes.map((note) => note.id === mine.id ? mine : note)));
    return mine;
  },
  async deleteNote(id) {
    const snapshots = await this.listSnapshots();
    if (snapshots.some((snapshot) => snapshot.sourceNoteId === id)) throw new Error("请先处理这张原稿的公开副本");
    const notes = await this.listNotes();
    localStorageOrThrow().setItem(NOTES_KEY, JSON.stringify(notes.filter((note) => note.id !== id)));
  },
  async listAttachments(noteId) {
    const value = localStorageOrThrow().getItem(`living-desk:attachments:${noteId}:v1`);
    return value ? JSON.parse(value) as NoteAttachment[] : [];
  },
  async uploadAttachment(noteId, file) {
    const items = await this.listAttachments(noteId);
    const attachment: NoteAttachment = { id: crypto.randomUUID(), noteId, kind: file.type.startsWith("audio/") ? "audio" : "image", storagePath: "local-demo", fileName: file.name, mimeType: file.type, byteSize: file.size, createdAt: new Date().toISOString(), previewUrl: URL.createObjectURL(file) };
    localStorageOrThrow().setItem(`living-desk:attachments:${noteId}:v1`, JSON.stringify([attachment, ...items].map((item) => { const copy = { ...item }; delete copy.previewUrl; return copy; })));
    return attachment;
  },
  async deleteAttachment(attachment) {
    const items = await this.listAttachments(attachment.noteId);
    localStorageOrThrow().setItem(`living-desk:attachments:${attachment.noteId}:v1`, JSON.stringify(items.filter((item) => item.id !== attachment.id)));
  },
  async importLocal(preview) {
    return { importedNotes: 0, importedSnapshots: 0, skipped: [...preview.notes.map((note) => note.id), ...preview.snapshots.map((snapshot) => snapshot.id)], conflicts: [] };
  },
  async listSnapshots() {
    const value = localStorageOrThrow().getItem(SNAPSHOTS_KEY);
    return value ? JSON.parse(value) as PublicSnapshot[] : [];
  },
  async publishSnapshot(input) {
    const snapshot: PublicSnapshot = { ...input, id: crypto.randomUUID(), publishedAt: new Date().toISOString(), withdrawnAt: null };
    const snapshots = await this.listSnapshots();
    localStorageOrThrow().setItem(SNAPSHOTS_KEY, JSON.stringify([snapshot, ...snapshots]));
    return snapshot;
  },
  async withdrawSnapshot(id) {
    const snapshots = await this.listSnapshots();
    localStorageOrThrow().setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots.map((item) => item.id === id ? { ...item, withdrawnAt: new Date().toISOString() } : item)));
  },
};

export async function createStudioRepository(): Promise<StudioRepository> {
  const { selectClientRuntimeMode } = await import("./config");
  const mode = selectClientRuntimeMode();
  if (mode === "local-demo") return localDemoStudioRepository;
  if (mode === "misconfigured") throw new Error("正式环境缺少云端记录台配置，已拒绝使用本地假同步");
  const { cloudStudioRepository } = await import("./supabase/repository");
  return cloudStudioRepository;
}
