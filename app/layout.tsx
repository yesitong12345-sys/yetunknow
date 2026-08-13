import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "我的私人书桌",
    template: "%s｜我的私人书桌",
  },
  description: "一张收集奇思妙想、日常碎片与项目作品的手工书桌。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "我的私人书桌",
    description: "奇思妙想、日常碎片与项目作品。",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4eedb",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
