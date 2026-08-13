# 我的私人书桌

一份以桌面端为主体验的剪纸涂鸦个人网站原型。公开内容包括奇思妙想、精选日常和项目作品；私人记录台演示了“私密原稿 → 单独整理公开副本 → 明确确认 → 撤回”的完整流程。

## 本地运行

要求 Node.js 22.13+ 和 pnpm。

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。在 Windows PowerShell 中脚本可以直接运行，不依赖 POSIX 环境变量语法。

## 上传到 GitHub

解压交付包后，可直接把整个文件夹上传到新的 GitHub 仓库。`.env`、依赖目录、构建缓存和本机日志均已排除；`.env.example` 只保留变量名称，不包含真实密钥。部署前复制 `.env.example` 为 `.env.local`，并在本机或部署平台填写自己的配置。任何曾经粘贴到聊天中的 API 密钥都应先在服务商后台撤销并重新生成。

网站入口文件是 `app/page.tsx`，访问域名根路径 `/` 即可打开首页。仓库已包含 `vercel.json`；在 Vercel 导入 GitHub 仓库后，框架会识别为 Next.js，构建命令使用 `pnpm build`。需要使用云端记录、登录、AI 整理或留言功能时，请在 Vercel 项目设置中按照 `.env.example` 添加环境变量。

磁盘空间紧张时，可以把依赖存储与虚拟依赖目录放到其他盘：

```powershell
pnpm install --store-dir E:\CodexPnpmStore --virtual-store-dir E:\CodexVirtualStore\living-desk
```

## 验证

```bash
pnpm lint
pnpm build
pnpm test
openspec validate living-desk-personal-site
```

浏览器验收脚本位于 `work/browser-qa.cjs`，覆盖 1440×900、1920×1080、390×844 微信 User-Agent、键盘顺序、自动保存、发布、撤回和减少动态模式。

## 数据与隐私

当前 `/studio` 是明确标注的本地交互演示，数据只存于当前浏览器的 `localStorage`。它不是正式身份认证或云端隐私存储，不应记录极敏感信息。

正式数据结构与 RLS 策略位于 `supabase/migrations/0001_living_desk.sql`。接入步骤见 `docs/supabase-cutover.md`。在完成服务端 Supabase SSR Cookie、owner 路由守卫和真实三账户测试之前，不应公开部署私人记录功能。

## 内容替换

`lib/content.ts` 内含 3 条奇思妙想、3 条日常和 2 个项目，全部明确标记为示例内容。替换项目条目时只使用真实截图、真实链接和可验证成果，不要把占位叙述当成个人经历。
