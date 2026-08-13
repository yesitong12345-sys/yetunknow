import Link from "next/link";
import { getEntries } from "@/lib/content";
import { HomeGrowth } from "./HomeGrowth";
import { DailyRevealLink } from "./DailyRevealLink";

const sections = [
  { href: "/ideas", crop: "mobile-crop-notes", label: "灵感便签", title: "奇思妙想", items: getEntries("ideas") },
  { href: "/daily", crop: "mobile-crop-book", label: "翻开的手账", title: "日常记录", items: getEntries("daily") },
  { href: "/projects", crop: "mobile-crop-toolbox", label: "纸板工具盒", title: "项目作品", items: getEntries("projects") },
] as const;

export function MobileHome() {
  return (
    <section className="mobile-home-v2">
      <div className="mobile-scene-photo" role="img" aria-label="俯视的手工美术书桌，摆放着便签、手账、工具盒和抽屉" />
      <nav className="mobile-object-nav" aria-label="公开内容入口">
        {sections.map((section) => (
          <article key={section.href} className="mobile-object-section">
            {section.href === "/daily" ? <DailyRevealLink mode="mobile" /> : (
              <Link href={section.href} className="mobile-object-main">
                <span className={`mobile-object-crop ${section.crop}`} aria-hidden="true" />
                <span className="mobile-object-title"><small>{section.label}</small><strong>{section.title}</strong><b aria-hidden="true">↗</b></span>
              </Link>
            )}
            <div className="mobile-object-recents">
              {section.items.slice(0, 2).map((item) => (
                <Link key={item.slug} href={`/${item.kind}/${item.slug}`}><span>{item.title}</span><time>{item.date.slice(5).replace("-", ".")}</time></Link>
              ))}
            </div>
          </article>
        ))}
      </nav>

      <HomeGrowth className="mobile-growth" />

      <Link href="/auth" className="mobile-locked-drawer">
        <span className="mobile-drawer-crop" aria-hidden="true" />
        <span className="mobile-drawer-seal" aria-hidden="true" />
        <span><small>上锁抽屉</small><strong>私人记录台</strong><i>仅本人可以打开</i></span>
        <b aria-hidden="true">→</b>
      </Link>
    </section>
  );
}
