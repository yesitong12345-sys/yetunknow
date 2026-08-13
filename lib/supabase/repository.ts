import { createSupabaseBrowserClient } from "./browser";
import type { ConditionalUpdate, NoteAttachment, NoteConflict, NoteDraft, PublicSnapshot, StudioNote, StudioRepository } from "../studio-contracts";

type NoteRow = {
  id: string; owner_id: string; kind: StudioNote["kind"]; title: string; body_markdown: string;
  raw_idea: string | null; captured_at: string; created_at: string; updated_at: string;
};

function mapNote(row: NoteRow): StudioNote {
  return { id: row.id, ownerId: row.owner_id, kind: row.kind, title: row.title, bodyMarkdown: row.body_markdown, rawIdea: row.raw_idea, capturedAt: row.captured_at, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapSnapshot(row: Record<string, unknown>): PublicSnapshot {
  return {
    id: String(row.id), sourceNoteId: String(row.source_note_id), kind: row.kind as PublicSnapshot["kind"],
    slug: String(row.slug), title: String(row.title), excerpt: String(row.excerpt ?? ""), body: String(row.body),
    publishedAt: String(row.published_at), withdrawnAt: row.withdrawn_at ? String(row.withdrawn_at) : null,
  };
}

function mapAttachment(row: Record<string, unknown>, previewUrl?: string): NoteAttachment {
  return { id: String(row.id), noteId: String(row.note_id), kind: row.media_kind as NoteAttachment["kind"], storagePath: String(row.storage_path), fileName: String(row.file_name), mimeType: String(row.mime_type), byteSize: Number(row.byte_size), createdAt: String(row.created_at), previewUrl };
}

async function ownerId() {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("登录已失效，请重新登录");
  return data.user.id;
}

export const cloudStudioRepository: StudioRepository = {
  async listNotes() {
    const { data, error } = await createSupabaseBrowserClient().from("private_notes").select("*").order("captured_at", { ascending: false });
    if (error) throw error;
    return (data as NoteRow[]).map(mapNote);
  },
  async getNote(id) {
    const { data, error } = await createSupabaseBrowserClient().from("private_notes").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapNote(data as NoteRow) : null;
  },
  async createNote(draft: NoteDraft) {
    const owner_id = await ownerId();
    const { data, error } = await createSupabaseBrowserClient().from("private_notes").insert({ owner_id, kind: draft.kind, title: draft.title, body_markdown: draft.bodyMarkdown, raw_idea: draft.rawIdea ?? null }).select("*").single();
    if (error) throw error;
    return mapNote(data as NoteRow);
  },
  async updateNote(update: ConditionalUpdate): Promise<StudioNote | NoteConflict> {
    const client = createSupabaseBrowserClient();
    const { data, error } = await client.from("private_notes").update({ kind: update.kind, title: update.title, body_markdown: update.bodyMarkdown, raw_idea: update.rawIdea ?? null }).eq("id", update.id).eq("updated_at", update.baseUpdatedAt).select("*").maybeSingle();
    if (error) throw error;
    if (data) return mapNote(data as NoteRow);
    const cloud = await this.getNote(update.id);
    if (!cloud) throw new Error("找不到这张纸");
    return { cloud, mine: { ...cloud, ...update, updatedAt: new Date().toISOString() } };
  },
  async deleteNote(id) {
    const { error } = await createSupabaseBrowserClient().from("private_notes").delete().eq("id", id);
    if (error) throw error;
  },
  async listAttachments(noteId) {
    const client = createSupabaseBrowserClient();
    const { data, error } = await client.from("private_note_attachments").select("*").eq("note_id", noteId).order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(async (row) => {
      const { data: signed } = await client.storage.from("private-assets").createSignedUrl(String(row.storage_path), 3600);
      return mapAttachment(row, signed?.signedUrl);
    }));
  },
  async uploadAttachment(noteId, file) {
    const client = createSupabaseBrowserClient();
    const owner_id = await ownerId();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-100) || "attachment";
    const storage_path = `${owner_id}/${noteId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await client.storage.from("private-assets").upload(storage_path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const media_kind = file.type.startsWith("audio/") ? "audio" : "image";
    const { data, error } = await client.from("private_note_attachments").insert({ owner_id, note_id: noteId, media_kind, storage_path, file_name: file.name, mime_type: file.type, byte_size: file.size }).select("*").single();
    if (error) { await client.storage.from("private-assets").remove([storage_path]); throw error; }
    const { data: signed } = await client.storage.from("private-assets").createSignedUrl(storage_path, 3600);
    return mapAttachment(data, signed?.signedUrl);
  },
  async deleteAttachment(attachment) {
    const client = createSupabaseBrowserClient();
    const { error } = await client.from("private_note_attachments").delete().eq("id", attachment.id);
    if (error) throw error;
    if (attachment.storagePath !== "local-demo") await client.storage.from("private-assets").remove([attachment.storagePath]);
  },
  async importLocal(preview) {
    const client = createSupabaseBrowserClient(); const owner_id = await ownerId();
    let importedNotes = 0; let importedSnapshots = 0; const skipped: string[] = []; const conflicts: string[] = []; const mapping = new Map<string, string>();
    for (const note of preview.notes) {
      const { data: existing } = await client.from("private_notes").select("id").eq("owner_id", owner_id).eq("import_source", "browser-v1").eq("import_source_id", note.id).maybeSingle();
      if (existing) { mapping.set(note.id, existing.id); skipped.push(note.id); continue; }
      const { data, error } = await client.from("private_notes").insert({ owner_id, kind: note.kind, title: note.title, body_markdown: note.bodyMarkdown, raw_idea: note.rawIdea ?? null, captured_at: note.capturedAt, import_source: "browser-v1", import_source_id: note.id }).select("id").single();
      if (error) { conflicts.push(note.id); continue; } mapping.set(note.id, data.id); importedNotes += 1;
    }
    for (const snapshot of preview.snapshots) {
      const source_note_id = mapping.get(snapshot.sourceNoteId); if (!source_note_id) { skipped.push(snapshot.id); continue; }
      const { data: slugExists } = await client.from("public_posts").select("id").eq("slug", snapshot.slug).maybeSingle(); if (slugExists) { conflicts.push(snapshot.slug); continue; }
      const { error } = await client.from("public_posts").insert({ owner_id, source_note_id, kind: snapshot.kind, slug: snapshot.slug, title: snapshot.title, excerpt: snapshot.excerpt, body: snapshot.body, desk_object_key: snapshot.kind === "ideas" ? "note" : snapshot.kind === "daily" ? "journal" : "toolbox", published_at: snapshot.publishedAt, withdrawn_at: snapshot.withdrawnAt });
      if (error) conflicts.push(snapshot.slug); else importedSnapshots += 1;
    }
    return { importedNotes, importedSnapshots, skipped, conflicts };
  },
  async listSnapshots() {
    const { data, error } = await createSupabaseBrowserClient().from("public_posts").select("*").order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapSnapshot);
  },
  async publishSnapshot(input) {
    const owner_id = await ownerId();
    const { data, error } = await createSupabaseBrowserClient().from("public_posts").insert({ owner_id, source_note_id: input.sourceNoteId, kind: input.kind, slug: input.slug, title: input.title, excerpt: input.excerpt, body: input.body, desk_object_key: input.kind === "ideas" ? "note" : input.kind === "daily" ? "journal" : "toolbox" }).select("*").single();
    if (error) throw error;
    return mapSnapshot(data);
  },
  async withdrawSnapshot(id) {
    const { error } = await createSupabaseBrowserClient().from("public_posts").update({ withdrawn_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  },
};
