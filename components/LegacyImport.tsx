"use client";

import { useEffect, useState } from "react";
import { NOTES_KEY, SNAPSHOTS_KEY, type LocalSnapshot, type PrivateNote } from "@/lib/studio";
import { createStudioRepository } from "@/lib/studio-repository";
import type { ImportPreview, ImportResult } from "@/lib/studio-contracts";

function readPreview(): ImportPreview {
  const noteRows = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]") as PrivateNote[];
  const snapshotRows = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]") as LocalSnapshot[];
  return { notes: noteRows.map((note) => ({ ...note, capturedAt: note.createdAt })), snapshots: snapshotRows, duplicates: [] };
}

export function LegacyImport() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { queueMicrotask(() => { const next = readPreview(); if (next.notes.length || next.snapshots.length) setPreview(next); }); }, []);
  if (!preview) return null;
  async function run() { if (!window.confirm(`确认把 ${preview!.notes.length} 条原稿和 ${preview!.snapshots.length} 个公开副本导入云端吗？`)) return; setBusy(true); try { setResult(await (await createStudioRepository()).importLocal(preview!)); } finally { setBusy(false); } }
  return <section className="legacy-import"><p className="eyebrow">ONE-TIME IMPORT</p><h2>发现这台浏览器里的旧纸片</h2><p>私密原稿 {preview.notes.length} 条，公开副本 {preview.snapshots.length} 个。先预览数量，确认后才上传；完成后也不会自动删除本机记录。</p><button type="button" disabled={busy} onClick={run}>{busy ? "正在搬进云端…" : "确认并导入"}</button>{result && <aside role="status"><strong>导入结果</strong><p>原稿 {result.importedNotes} 条，公开副本 {result.importedSnapshots} 个；跳过 {result.skipped.length} 项，冲突 {result.conflicts.length} 项。</p><small>本机旧记录仍然保留。确认云端内容完整后，再由你决定是否清理。</small></aside>}</section>;
}
