"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OwnerLoginForm({ localDemo }: { localDemo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "登录失败");
      router.replace("/studio"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "登录失败"); }
    finally { setBusy(false); }
  }

  if (localDemo) return <a className="primary-button" href="/studio">进入本地演示抽屉 →</a>;
  return <form className="owner-login-form" onSubmit={submit}>
    <label>主人邮箱<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>密码<input type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    <button className="primary-button" type="submit" disabled={busy}>{busy ? "正在开锁…" : "打开我的抽屉"}</button>
  </form>;
}
