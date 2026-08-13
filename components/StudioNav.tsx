"use client";
import Link from "next/link";

export function StudioNav() {
  return (
    <header className="studio-nav">
      <Link href="/studio" className="studio-brand"><span aria-hidden="true">▣</span> 上锁抽屉</Link>
      <nav aria-label="私人记录导航">
        <Link href="/studio">全部原稿</Link>
        <Link href="/studio/new" className="new-note-link">＋ 新纸片</Link>
        <Link href="/">回到桌面</Link>
        <button type="button" className="studio-signout" onClick={async () => { await fetch("/api/auth/session", { method: "DELETE" }); window.location.assign("/auth"); }}>安全退出</button>
      </nav>
    </header>
  );
}
