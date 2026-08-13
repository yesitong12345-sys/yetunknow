import type { Metadata } from "next";
import Link from "next/link";
import { OwnerLoginForm } from "@/components/OwnerLoginForm";
import { selectRuntimeMode } from "@/lib/config";

export const metadata: Metadata = { title: "打开上锁抽屉", robots: { index: false, follow: false } };

export default function AuthPage() {
  const mode = selectRuntimeMode();
  return <main className="auth-shell">
    <section className="auth-card">
      <div className="lock-illustration" aria-hidden="true"><span>✦</span></div>
      <p className="eyebrow">OWNER ONLY · 不开放注册</p>
      <h1>打开上锁抽屉</h1>
      <p>只有书桌主人可以进入。登录状态会在手机微信和桌面浏览器之间分别安全保存。</p>
      {mode === "misconfigured" && <aside role="alert"><strong>云端记录台尚未配置</strong><p>正式环境已安全关闭，不会退回成只存这台手机的假同步。</p></aside>}
      {mode === "local-demo" && <aside><strong>当前是本地演示</strong><p>可以体验交互，但内容只在这台浏览器保存，请勿写入极敏感信息。</p></aside>}
      <OwnerLoginForm localDemo={mode === "local-demo"} />
      <Link href="/" className="quiet-link">← 回到公开桌面</Link>
    </section>
  </main>;
}
