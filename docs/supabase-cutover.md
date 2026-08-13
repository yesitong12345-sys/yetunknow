# 私人书桌云端启用清单

本地开发在缺少云端配置时会显示“本地演示”，正式环境则安全关闭，不会悄悄退回浏览器存储。

## 1. 创建项目与数据库

1. 新建一个 Supabase 项目。
2. 按顺序执行：
   - `supabase/migrations/0001_living_desk.sql`
   - `supabase/migrations/0002_mobile_studio_sync.sql`
3. 在 Authentication 中只创建一个主人账户，不在网站提供公开注册。
4. 复制该账户 UUID，作为 `SITE_OWNER_USER_ID`。

## 2. 服务器环境值

依据 `.env.example` 配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SITE_OWNER_USER_ID`
- `SUPABASE_SERVICE_ROLE_KEY`：仅供隔离的匿名留言审核写入模块使用，绝不能进入浏览器或日志。
- `DEEPSEEK_API_KEY`：必须使用全新轮换的密钥；聊天中曾经出现过的旧密钥永久视为泄漏。
- `DEEPSEEK_MODEL=deepseek-v4-flash`
- 可选 `MESSAGE_HASH_SALT`：生产环境应使用随机服务器秘密，用于匿名限流散列。

禁止给后三项添加 `NEXT_PUBLIC_` 前缀。不要把真实值写入仓库、截图、错误信息或聊天。

## 3. 登录与 HTTPS

- 在 Supabase Auth URL Configuration 中填写正式 HTTPS 站点地址。
- 第一阶段使用主人邮箱和密码，避免微信内置浏览器跳出后丢失 magic-link Cookie。
- `/studio/**` 必须保持动态渲染、`private, no-store`，并在服务端核对账户 UUID。
- 登录后分别在微信手机端和桌面端验证同一条记录能够同步。

## 4. 匿名留言规则

“门口的纸片管理员”执行三态审核：

- `approved`：立即公开。
- `rejected`：不进入任何公开查询。
- `review`：AI 超时、格式异常或判断不确定时交给主人，永不自动放行。

公开页面不显示头像、头像光效或个人资料，只显示匿名昵称、正文、自动时间和主人回复。页面固定展示“这里不接受恶评，请认真说话。”

## 5. 上线验收

1. 以匿名、主人、另一个账户分别验证 RLS 和 Storage。
2. 验证手机记录、自动时间、离线恢复、两设备冲突、图片、语音、AI 整理、留言审核、主人回复、发布与撤回。
3. 确认浏览器资源中没有任何 API 密钥。
4. 云端验收通过前，不删除浏览器旧记录，也不宣称跨设备同步已经可用。

## 回滚

如果云端验收失败：关闭 `/studio/**`，继续提供静态公开站点；保留 Supabase 表和私人附件以便排查。不要回滚成正式环境下的静默 `localStorage` 模式。
