"use client";

import { useEffect, useState } from "react";

type QueueMessage = { id: string; post_slug: string; alias: string; body: string; moderation_state: "approved" | "rejected" | "review" | "removed"; created_at: string; owner_reply: string | null };

export function ModerationQueue() {
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try { const response = await fetch("/api/messages/moderation", { cache: "no-store" }); const payload = await response.json() as { messages?: QueueMessage[] }; if (response.ok) setMessages(payload.messages ?? []); }
    finally { setReady(true); }
  }
  useEffect(() => { void load(); }, []);

  async function act(id: string, action: "approve" | "reject" | "remove" | "reply", reply?: string) {
    setError("");
    const response = await fetch("/api/messages/moderation", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reply }) });
    if (!response.ok) { setError("操作没有完成，请重试。"); return; }
    await load();
  }

  if (!ready || messages.length === 0) return null;
  return <section className="moderation-queue"><div className="section-title"><h2>门口的纸片管理员</h2><span>审核、回复与撤下记录</span></div>{error && <p role="alert">{error}</p>}
    {messages.map((message) => <article key={message.id}><header><strong>{message.alias || "匿名访客"}</strong><span>{message.moderation_state === "approved" ? "已展示" : message.moderation_state === "review" ? "等你确认" : "已拦截"}</span></header><p>{message.body}</p><small>{message.post_slug} · {new Date(message.created_at).toLocaleString("zh-CN")}</small><div>
      {message.moderation_state !== "approved" && <button type="button" onClick={() => act(message.id, "approve")}>允许展示</button>}
      {message.moderation_state === "review" && <button type="button" onClick={() => act(message.id, "reject")}>确认拦截</button>}
      {message.moderation_state === "approved" && <button type="button" onClick={() => { const reply = window.prompt("写给主人回复", message.owner_reply ?? ""); if (reply !== null) void act(message.id, "reply", reply); }}>{message.owner_reply ? "修改回复" : "主人回复"}</button>}
      {message.moderation_state === "approved" && <button type="button" onClick={() => act(message.id, "remove")}>从页面撤下</button>}
    </div>{message.owner_reply && <aside><strong>当前回复</strong><p>{message.owner_reply}</p></aside>}</article>)}
  </section>;
}
