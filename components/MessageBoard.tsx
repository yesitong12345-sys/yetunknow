"use client";

import { useEffect, useState } from "react";

type PublicMessage = { id: string; alias: string; body: string; created_at: string; owner_reply: string | null; owner_replied_at: string | null };

export function MessageBoard({ postSlug }: { postSlug: string }) {
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [alias, setAlias] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void fetch(`/api/messages?post=${encodeURIComponent(postSlug)}`).then((response) => response.json()).then((payload: { messages?: PublicMessage[] }) => setMessages(payload.messages ?? [])).catch(() => setMessages([])); }, [postSlug]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    const form = event.currentTarget as HTMLFormElement;
    const website = new FormData(form).get("website")?.toString() ?? "";
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postSlug, alias, body, website }) });
      const payload = await response.json() as { state?: string; message?: PublicMessage | string; error?: string };
      if (!response.ok && response.status !== 202) throw new Error(payload.error || "留言没有送达");
      if (payload.state === "approved" && typeof payload.message === "object") setMessages((items) => [...items, payload.message as PublicMessage]);
      setNotice(typeof payload.message === "string" ? payload.message : payload.state === "approved" ? "留言已经贴上去了。" : "留言已交给主人确认。");
      if (payload.state === "approved" || payload.state === "review") setBody("");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "留言没有送达"); }
    finally { setBusy(false); }
  }

  return <section className="message-board" aria-labelledby={`messages-${postSlug}`}>
    <header className="no-abuse-notice"><span aria-hidden="true">!</span><div><p className="eyebrow">门口的纸片管理员</p><h2 id={`messages-${postSlug}`}>这里不接受恶评，请认真说话。</h2><p>可以匿名提问、表达感受或礼貌地提出不同意见。攻击、羞辱、骚扰和垃圾信息不会被展示。</p></div></header>
    <form className="anonymous-message-form" onSubmit={submit}>
      <label>怎么称呼你（可不填）<input value={alias} maxLength={40} onChange={(event) => setAlias(event.target.value)} placeholder="匿名访客" /></label>
      <label>匿名提问或留言<textarea required minLength={1} maxLength={2000} rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="认真写下想说的话…" /></label>
      <label className="message-honeypot" aria-hidden="true">网站<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button type="submit" disabled={busy || !body.trim()}>{busy ? "纸片管理员正在看…" : "匿名贴上去"}</button>
      {notice && <p role="status">{notice}</p>}
    </form>
    <div className="public-message-list">{messages.map((message) => <article key={message.id}><div className="message-meta"><strong>{message.alias || "匿名访客"}</strong><time dateTime={message.created_at}>{new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" }).format(new Date(message.created_at))}</time></div><p>{message.body}</p>{message.owner_reply && <aside><strong>书桌主人回复</strong><p>{message.owner_reply}</p>{message.owner_replied_at && <time dateTime={message.owner_replied_at}>{new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" }).format(new Date(message.owner_replied_at))}</time>}</aside>}</article>)}</div>
  </section>;
}
