"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ContentKind } from "@/lib/content";
import { createStudioRepository } from "@/lib/studio-repository";
import type { PublicSnapshot, StudioNote, StudioRepository } from "@/lib/studio-contracts";
import { ModerationQueue } from "./ModerationQueue";
import { LegacyImport } from "./LegacyImport";

const labels: Record<ContentKind, string> = { ideas: "奇思妙想", daily: "日常记录", projects: "项目" };

export function StudioDashboard() {
  const [notes, setNotes] = useState<StudioNote[]>([]);
  const [snapshots, setSnapshots] = useState<PublicSnapshot[]>([]);
  const [repository, setRepository] = useState<StudioRepository | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ContentKind | "all">("all");
  const [status, setStatus] = useState("正在拉开抽屉…");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void createStudioRepository().then(async (repo) => {
      const [nextNotes, nextSnapshots] = await Promise.all([repo.listNotes(), repo.listSnapshots()]);
      if (!cancelled) { setRepository(repo); setNotes(nextNotes); setSnapshots(nextSnapshots); setStatus(process.env.NODE_ENV === "production" ? "已从私人云端同步" : "本地演示 · 不跨设备同步"); }
    }).catch((reason) => { if (!cancelled) { setStatus("无法读取记录"); setError(reason instanceof Error ? reason.message : "请稍后重试"); } });
    return () => { cancelled = true; };
  }, []);

  const visibleNotes = useMemo(() => notes.filter((note) => {
    const matchesKind = kind === "all" || note.kind === kind;
    const needle = query.trim().toLocaleLowerCase("zh-CN");
    return matchesKind && (!needle || `${note.title}\n${note.bodyMarkdown}`.toLocaleLowerCase("zh-CN").includes(needle));
  }), [kind, notes, query]);
  const activeSnapshots = snapshots.filter((item) => !item.withdrawnAt);

  async function withdraw(id: string) {
    if (!repository || !window.confirm("确认撤回公开副本吗？私密原稿会完整保留。")) return;
    try { await repository.withdrawSnapshot(id); setSnapshots((items) => items.map((item) => item.id === id ? { ...item, withdrawnAt: new Date().toISOString() } : item)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "撤回失败"); }
  }

  async function removeNote(note: StudioNote) {
    if (!repository || !window.confirm(`确认删除“${note.title || "无题纸片"}”吗？此操作无法撤销。`)) return;
    try { await repository.deleteNote(note.id); setNotes((items) => items.filter((item) => item.id !== note.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "删除失败"); }
  }

  return <div className="studio-content">
    <section className="studio-heading"><div><p className="eyebrow">PRIVATE STUDIO · PHONE + DESKTOP</p><h1>今天想接住什么？</h1><p>所有新记录先成为私密原稿，只有制作并确认公开副本后才会出现在桌面。</p></div><Link href="/studio/new" className="primary-button">＋ 新建私密记录</Link></section>
    <nav className="mobile-quick-capture" aria-label="快速新增内容">
      <Link href="/studio/new?kind=daily"><span aria-hidden="true">◷</span><strong>记一条日常</strong><small>自动时间，打开就写</small></Link>
      <Link href="/studio/new?kind=ideas"><span aria-hidden="true">✦</span><strong>加一个奇思妙想</strong><small>可让 AI 帮忙整理</small></Link>
      <Link href="/studio/new?kind=projects"><span aria-hidden="true">▣</span><strong>新建项目</strong><small>角色、过程、成果模板</small></Link>
    </nav>
    <aside className="privacy-banner" role="status"><strong>{status}</strong><p>“已同步”只在云端确认写入后出现；离线内容会保留在恢复队列。</p></aside>
    {error && <aside className="recovery-notice" role="alert"><strong>有一张纸没有放好</strong><span>{error}</span><button type="button" onClick={() => setError("")}>知道了</button></aside>}
    <section className="studio-stats" aria-label="记录状态概览"><div><strong>{notes.length}</strong><span>私密原稿</span></div><div><strong>{activeSnapshots.length}</strong><span>公开副本</span></div><div><strong>{snapshots.filter((item) => item.withdrawnAt).length}</strong><span>已撤回</span></div></section>
    <section className="studio-filter" aria-label="筛选原稿">
      <label>搜索<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题或正文关键词" /></label>
      <label>类型<select value={kind} onChange={(event) => setKind(event.target.value as ContentKind | "all")}><option value="all">全部</option><option value="ideas">奇思妙想</option><option value="daily">日常记录</option><option value="projects">项目</option></select></label>
    </section>
    <section className="note-stack"><div className="section-title"><h2>抽屉里的原稿</h2><span>{visibleNotes.length} 张符合条件</span></div>
      {visibleNotes.map((note) => { const snapshot = snapshots.find((item) => item.sourceNoteId === note.id && !item.withdrawnAt); return <article className="private-note-row" key={note.id}>
        <span className={`kind-dot kind-${note.kind}`} aria-hidden="true" /><div><p>{labels[note.kind]} · 私密</p><h3><Link href={`/studio/notes/${note.id}`}>{note.title || "无题纸片"}</Link></h3><time>{new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(note.updatedAt))}</time></div>
        <span className={`note-state ${snapshot ? "is-public" : ""}`}>{snapshot ? "已有公开快照" : "仅自己可见"}</span><div className="note-row-actions"><Link href={`/studio/notes/${note.id}`} aria-label={`编辑${note.title}`}>编辑</Link><button type="button" onClick={() => removeNote(note)}>删除</button></div>
      </article>; })}
      {visibleNotes.length === 0 && <p className="loading-note">这里暂时没有符合条件的纸片。</p>}
    </section>
    {activeSnapshots.length > 0 && <section className="published-stack"><div className="section-title"><h2>已经公开到桌面</h2><span>公开快照不会随原稿自动改变</span></div>{activeSnapshots.map((snapshot) => <article className="snapshot-row" key={snapshot.id}><div><small>公开副本</small><h3>{snapshot.title}</h3><p>{snapshot.excerpt}</p></div><button type="button" onClick={() => withdraw(snapshot.id)}>撤回公开副本</button></article>)}</section>}
    <ModerationQueue />
    <LegacyImport />
  </div>;
}
