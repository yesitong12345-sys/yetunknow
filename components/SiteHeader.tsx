import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="回到我的私人书桌首页">
        <span aria-hidden="true" className="brand-sprout">✦</span>
        我的私人书桌
      </Link>
      <nav aria-label="主要导航">
        <Link href="/ideas">奇思妙想</Link>
        <Link href="/daily">日常</Link>
        <Link href="/projects">项目</Link>
        <Link href="/auth" className="nav-lock">上锁抽屉</Link>
      </nav>
    </header>
  );
}
