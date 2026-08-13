"use client";
/* eslint-disable @next/next/no-img-element, jsx-a11y/media-has-caption */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ContentKind } from "@/lib/content";
import { slugify } from "@/lib/studio";
import { createStudioRepository } from "@/lib/studio-repository";
import type { IdeaSuggestion } from "@/lib/deepseek";
import type { NoteAttachment, NoteConflict, StudioNote, StudioRepository, SyncState } from "@/lib/studio-contracts";

const WECHAT_TEMPLATE = `【微信对话记录｜私密】
记录时间：由系统自动生成
聊天对象：［昵称即可］
场景：［私聊／群聊／转发］

—— 对话原文 ——
［对方］：
［我］：

—— 我想留下的部分 ——
［一句话、一个瞬间，或你的补充］

我的感受／后续：
［可留空］`;

const PROJECT_TEMPLATE = `【项目记录｜私密】
项目想解决什么：

我的角色：

过程：
1. 
2. 
3. 

结果／目前进展：

项目链接（可留空）：`;

type RecoveryEnvelope = { kind: ContentKind; title: string; bodyMarkdown: string; rawIdea: string | null; baseUpdatedAt: string | null; savedAt: string };
const recoveryKey = (id: string) => `living-desk:outbox:${id}:v2`;

const statusText: Record<SyncState, string> = {
  idle: "等待书写", saving: "正在同步…", synced: "已同步到私人抽屉", offline: "离线，已保留在本机", retrying: "正在重试…", error: "保存失败", conflict: "发现两个版本",
};

export function StudioEditor({ noteId = "new", initialKind = "ideas" }: { noteId?: string; initialKind?: ContentKind }) {
  const router = useRouter();
  const [repository, setRepository] = useState<StudioRepository | null>(null);
  const [id, setId] = useState(noteId);
  const [baseUpdatedAt, setBaseUpdatedAt] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState(() => new Date().toISOString());
  const [kind, setKind] = useState<ContentKind>(initialKind);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rawIdea, setRawIdea] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<NoteConflict | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [suggestion, setSuggestion] = useState<IdeaSuggestion | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishedNotice, setPublishedNotice] = useState("");
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [attachmentState, setAttachmentState] = useState("等待添加图片或语音");
  const [publicTitle, setPublicTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [publicBody, setPublicBody] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    let cancelled = false;
    void createStudioRepository().then(async (repo) => {
      if (cancelled) return;
      setRepository(repo);
      const stored = localStorage.getItem(recoveryKey(noteId));
      const recovery = stored ? JSON.parse(stored) as RecoveryEnvelope : null;
      const note = noteId === "new" ? null : await repo.getNote(noteId);
      if (cancelled) return;
      if (recovery && (!note || recovery.savedAt > note.updatedAt)) {
        setKind(recovery.kind); setTitle(recovery.title); setBody(recovery.bodyMarkdown); setRawIdea(recovery.rawIdea); setBaseUpdatedAt(recovery.baseUpdatedAt); setSyncState("offline");
      } else if (note) {
        setKind(note.kind); setTitle(note.title); setBody(note.bodyMarkdown); setRawIdea(note.rawIdea ?? null); setBaseUpdatedAt(note.updatedAt); setCapturedAt(note.capturedAt);
        setAttachments(await repo.listAttachments(note.id));
      }
      setReady(true);
    }).catch((reason) => { if (!cancelled) { setError(reason instanceof Error ? reason.message : "无法打开原稿"); setSyncState("error"); setReady(true); } });
    return () => { cancelled = true; };
  }, [noteId]);

  useEffect(() => {
    if (!ready || !repository) return;
    if (firstRender.current) { firstRender.current = false; return; }
    const envelope: RecoveryEnvelope = { kind, title, bodyMarkdown: body, rawIdea, baseUpdatedAt, savedAt: new Date().toISOString() };
    localStorage.setItem(recoveryKey(id), JSON.stringify(envelope));
    setSyncState("saving"); setError("");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void save(envelope); }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  // `save` intentionally reads the repository/state snapshot captured by this render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUpdatedAt, body, id, kind, rawIdea, ready, repository, title]);

  async function save(envelope: RecoveryEnvelope): Promise<StudioNote | null> {
    if (!repository || (!envelope.title.trim() && !envelope.bodyMarkdown.trim())) { setSyncState("idle"); return null; }
    try {
      if (id === "new" || !envelope.baseUpdatedAt) {
        const created = await repository.createNote({ kind: envelope.kind, title: envelope.title, bodyMarkdown: envelope.bodyMarkdown, rawIdea: envelope.rawIdea });
        setId(created.id); setBaseUpdatedAt(created.updatedAt); setCapturedAt(created.capturedAt); localStorage.removeItem(recoveryKey("new")); localStorage.removeItem(recoveryKey(created.id)); router.replace(`/studio/notes/${created.id}`);
        setSyncState("synced");
        return created;
      } else {
        const result = await repository.updateNote({ id, kind: envelope.kind, title: envelope.title, bodyMarkdown: envelope.bodyMarkdown, rawIdea: envelope.rawIdea, baseUpdatedAt: envelope.baseUpdatedAt });
        if ("cloud" in result) { setConflict(result); setSyncState("conflict"); return null; }
        setBaseUpdatedAt(result.updatedAt); localStorage.removeItem(recoveryKey(id));
        setSyncState("synced");
        return result;
      }
    } catch (reason) {
      setSyncState(navigator.onLine ? "error" : "offline"); setError(reason instanceof Error ? reason.message : "内容仍保留在本机，请稍后重试");
      return null;
    }
  }

  function applyVersion(note: StudioNote) {
    setKind(note.kind); setTitle(note.title); setBody(note.bodyMarkdown); setRawIdea(note.rawIdea ?? null); setBaseUpdatedAt(note.updatedAt); setConflict(null); setSyncState("synced"); localStorage.removeItem(recoveryKey(id));
  }

  async function keepMine() {
    if (!repository || !conflict) return;
    setSyncState("retrying");
    const result = await repository.updateNote({ id, kind: conflict.mine.kind, title: conflict.mine.title, bodyMarkdown: conflict.mine.bodyMarkdown, rawIdea: conflict.mine.rawIdea, baseUpdatedAt: conflict.cloud.updatedAt });
    if ("cloud" in result) { setConflict(result); setSyncState("conflict"); } else applyVersion(result);
  }

  async function saveBoth() {
    if (!repository || !conflict) return;
    setSyncState("retrying");
    await repository.createNote({ kind: conflict.mine.kind, title: `${conflict.mine.title || "无题"}（手机版本）`, bodyMarkdown: conflict.mine.bodyMarkdown, rawIdea: conflict.mine.rawIdea });
    applyVersion(conflict.cloud);
  }

  async function organize() {
    if (!body.trim()) return;
    setOrganizing(true); setError(""); setRawIdea((current) => current ?? body);
    try {
      const response = await fetch("/api/ideas/organize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawIdea: body }) });
      const payload = await response.json() as { suggestion?: IdeaSuggestion; error?: string };
      if (!response.ok || !payload.suggestion) throw new Error(payload.error || "整理失败");
      setSuggestion(payload.suggestion);
    } catch (reason) { setError(`${reason instanceof Error ? reason.message : "整理失败"}，原稿没有改变。`); }
    finally { setOrganizing(false); }
  }

  function insertTemplate() { setKind("daily"); setBody((current) => current.trim() ? `${current.trimEnd()}\n\n${WECHAT_TEMPLATE}` : WECHAT_TEMPLATE); }
  function insertProjectTemplate() { setKind("projects"); setBody((current) => current.trim() ? `${current.trimEnd()}\n\n${PROJECT_TEMPLATE}` : PROJECT_TEMPLATE); }
  async function addAttachments(files: FileList | null) {
    if (!files?.length || !repository || id === "new") { setError("请先写一点文字，等原稿保存后再添加附件。"); return; }
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/"); const isAudio = file.type.startsWith("audio/");
      const limit = isAudio ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
      if ((!isImage && !isAudio) || file.size > limit) { setError(`${file.name} 的格式或大小不符合要求。图片不超过 10MB，语音不超过 25MB。`); continue; }
      localStorage.setItem(`living-desk:pending-attachment:${id}`, JSON.stringify({ name: file.name, type: file.type, size: file.size, savedAt: new Date().toISOString() }));
      setAttachmentState(`正在上传 ${file.name}…`);
      try { const item = await repository.uploadAttachment(id, file); setAttachments((items) => [item, ...items]); localStorage.removeItem(`living-desk:pending-attachment:${id}`); setAttachmentState(`${file.name} 已安全放入私人附件`); }
      catch (reason) { setAttachmentState(`${file.name} 尚未上传，可重新选择后重试`); setError(reason instanceof Error ? reason.message : "附件上传失败，文字不受影响"); }
    }
  }
  async function removeAttachment(item: NoteAttachment) {
    if (!repository || !window.confirm(`移除 ${item.fileName} 吗？`)) return;
    try { await repository.deleteAttachment(item); setAttachments((items) => items.filter((candidate) => candidate.id !== item.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "附件移除失败"); }
  }
  function startPublish() { setPublicTitle(title); setExcerpt(body.replace(/[#*_>`]/g, "").trim().slice(0, 100)); setPublicBody(body); setPublishOpen(true); }
  async function publish() {
    if (!repository || id === "new" || !publicTitle.trim()) return;
    try { await repository.publishSnapshot({ sourceNoteId: id, kind, slug: slugify(publicTitle), title: publicTitle, excerpt, body: publicBody }); setPublishOpen(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "发布失败"); }
  }

  async function saveAndPublish() {
    if (!repository || (!title.trim() && !body.trim())) return;
    setPublishedNotice(""); setError("");
    const saved = await save({ kind, title, bodyMarkdown: body, rawIdea, baseUpdatedAt, savedAt: new Date().toISOString() });
    if (!saved) return;
    try {
      const snapshots = await repository.listSnapshots();
      const existing = snapshots.find((item) => item.sourceNoteId === saved.id && !item.withdrawnAt);
      if (existing) await repository.withdrawSnapshot(existing.id);
      const publicName = saved.title.trim() || (saved.kind === "daily" ? `日常记录 ${new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(saved.capturedAt))}` : saved.kind === "projects" ? "新项目记录" : "新的奇思妙想");
      await repository.publishSnapshot({ sourceNoteId: saved.id, kind: saved.kind, slug: slugify(publicName), title: publicName, excerpt: saved.bodyMarkdown.replace(/[#*_>`]/g, "").trim().slice(0, 100), body: saved.bodyMarkdown });
      setPublishedNotice("已保存，并直接上传到公开网页。刷新对应栏目即可看到。 ");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "原稿已保存，但公开上传没有完成。"); }
  }

  const wordCount = useMemo(() => body.trim().replace(/\s/g, "").length, [body]);
  return <div className="editor-layout">
    <aside className="privacy-banner compact" role="status"><strong>{statusText[syncState]}</strong><p>{syncState === "offline" || syncState === "error" ? "未发送的内容仍保留在这台设备。" : "公开内容必须另做副本并再次确认。"}</p></aside>
    <div className="editor-toolbar"><Link href="/studio">← 全部原稿</Link><button type="button" disabled={!ready || syncState === "saving"} onClick={() => save({ kind, title, bodyMarkdown: body, rawIdea, baseUpdatedAt, savedAt: new Date().toISOString() })}>立即保存</button></div>
    {error && <aside className="recovery-notice" role="alert"><strong>这张纸还没有放稳</strong><span>{error}</span><button type="button" onClick={() => setError("")}>知道了</button></aside>}
    {publishedNotice && <aside className="direct-publish-notice" role="status"><strong>已经放到网页上</strong><span>{publishedNotice}</span><Link href={`/${kind}`}>现在去查看 →</Link></aside>}
    <article className="editor-paper">
      <time className="capture-time" dateTime={capturedAt}>自动记录时间：{new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "long", timeStyle: "short" }).format(new Date(capturedAt))}</time>
      <div className="kind-tabs" role="group" aria-label="记录类型">{(["ideas", "daily", "projects"] as ContentKind[]).map((value) => <button type="button" key={value} className={kind === value ? "active" : ""} onClick={() => setKind(value)}>{value === "ideas" ? "奇思妙想" : value === "daily" ? "日常记录" : "项目"}</button>)}</div>
      {kind === "daily" && <div className="conversation-template-action"><span>时间由系统自动生成；也可以直接粘贴微信里的文字。</span><button type="button" onClick={insertTemplate}>贴一张微信对话格式</button></div>}
      {kind === "projects" && <div className="conversation-template-action"><span>用角色、过程和结果快速搭起项目作品页。</span><button type="button" onClick={insertProjectTemplate}>贴一张项目格式</button></div>}
      <label className="sr-only" htmlFor="note-title">标题</label><input id="note-title" className="note-title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="标题可以留空…" />
      <label className="sr-only" htmlFor="note-body">正文</label><textarea id="note-body" className="note-body-input" value={body} onChange={(event) => setBody(event.target.value)} placeholder="先写下来，不必急着完整。" />
      {kind === "ideas" && <section className="idea-organizer"><div><strong>让纸片整理员帮忙</strong><span>点击后只发送当前文字给 DeepSeek，原始输入会另外保留。</span></div><button type="button" disabled={organizing || !body.trim()} onClick={organize}>{organizing ? "正在整理…" : "帮我整理"}</button>{suggestion && <div className="idea-suggestion"><p className="eyebrow">AI SUGGESTION · 每一项都由你决定</p><label>核心标题<input value={suggestion.title} onChange={(event) => setSuggestion({ ...suggestion, title: event.target.value })} /></label><label>摘要<input value={suggestion.excerpt} onChange={(event) => setSuggestion({ ...suggestion, excerpt: event.target.value })} /></label><label>详细正文<textarea rows={8} value={suggestion.body} onChange={(event) => setSuggestion({ ...suggestion, body: event.target.value })} /></label><small>标签：{suggestion.tags.join(" · ") || "无"}</small><div><button type="button" onClick={() => setSuggestion(null)}>全部丢掉</button><button type="button" onClick={() => setTitle(suggestion.title)}>只采用标题</button><button type="button" onClick={() => setBody(suggestion.body)}>只采用正文</button><button type="button" onClick={() => { setTitle(suggestion.title); setBody(suggestion.body); setSuggestion(null); }}>采用标题和正文</button></div></div>}</section>}
      {rawIdea && <details className="raw-idea"><summary>查看采用 AI 前的原始想法</summary><pre>{rawIdea}</pre></details>}
      <section className="attachment-editor" aria-label="私人附件">
        <div><strong>图片与语音</strong><span role="status">{attachmentState}</span></div>
        <label className={id === "new" ? "is-disabled" : ""}>选择附件<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,audio/mpeg,audio/mp4,audio/webm,audio/wav" multiple disabled={id === "new"} onChange={(event) => { void addAttachments(event.target.files); event.currentTarget.value = ""; }} /></label>
        <div className="attachment-list">{attachments.map((item) => <article key={item.id}>{item.kind === "image" && item.previewUrl ? <img src={item.previewUrl} alt={item.fileName} /> : item.kind === "audio" && item.previewUrl ? <audio controls src={item.previewUrl} /> : <span>{item.kind === "audio" ? "语音" : "图片"}</span>}<p>{item.fileName}<small>{Math.ceil(item.byteSize / 1024)} KB</small></p><button type="button" onClick={() => removeAttachment(item)}>移除</button></article>)}</div>
      </section>
      <footer><span>{wordCount} 字</span><span>支持 Markdown 原稿</span></footer>
    </article>
    <div className="editor-actions direct-publish-actions"><p><strong>保存并发布：一次完成。</strong><br />系统会先保存私密原稿，再把当前标题和正文上传到公开网页。</p><div><button type="button" disabled={syncState === "saving" || (!title.trim() && !body.trim())} onClick={startPublish}>先编辑公开版本</button><button type="button" className="primary-button" disabled={syncState === "saving" || (!title.trim() && !body.trim())} onClick={saveAndPublish}>保存并直接发布到网页 →</button></div></div>
    {conflict && <div className="modal-backdrop"><section className="publish-modal" role="dialog" aria-modal="true" aria-labelledby="conflict-title"><p className="eyebrow">TWO VERSIONS</p><h2 id="conflict-title">发现两个版本</h2><p>另一台设备保存过更新的内容。请选择要留下哪一份，不会偷偷覆盖。</p><div className="modal-actions"><button type="button" onClick={() => applyVersion(conflict.cloud)}>保留云端</button><button type="button" onClick={saveBoth}>两份都留</button><button type="button" className="primary-button" onClick={keepMine}>保留我的</button></div></section></div>}
    {publishOpen && <div className="modal-backdrop"><section className="publish-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><p className="eyebrow">PUBLIC COPY</p><h2 id="publish-title">制作公开版本</h2><label>公开标题<input value={publicTitle} onChange={(event) => setPublicTitle(event.target.value)} /></label><label>公开摘要<textarea rows={3} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} /></label><label>公开正文<textarea rows={8} value={publicBody} onChange={(event) => setPublicBody(event.target.value)} /></label><div className="modal-actions"><button type="button" onClick={() => setPublishOpen(false)}>继续保密</button><button type="button" className="primary-button" onClick={publish}>确认公开副本</button></div></section></div>}
  </div>;
}
