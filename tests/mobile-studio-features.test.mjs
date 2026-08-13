import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const [daily, editor, messages, messageRoute, moderationRoute, migration, publicRepo] = await Promise.all([
  readFile(new URL("../components/DailyComposition.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/StudioEditor.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/MessageBoard.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/messages/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/messages/moderation/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/0002_mobile_studio_sync.sql", import.meta.url), "utf8"),
  readFile(new URL("../lib/public-repository.ts", import.meta.url), "utf8"),
]);
const moderationSource = await readFile(new URL("../lib/chinese-moderation.ts", import.meta.url), "utf8");

test("daily composition is oldest-first and offers stable date navigation", () => {
  assert.match(daily, /sort\(\(a, b\).*getTime\(\) - entryDateTime\(b\)\.getTime\(\)/s);
  assert.match(daily, /type="date"/);
  assert.match(daily, /history\.replaceState/);
  assert.match(daily, /Asia\/Shanghai/);
});

test("daily composition includes browser-published daily snapshots", () => {
  assert.match(daily, /SNAPSHOTS_KEY/);
  assert.match(daily, /localStorage\.getItem\(SNAPSHOTS_KEY\)/);
  assert.match(daily, /snapshot\.kind === "daily"|item\.kind === "daily"/);
});

test("mobile editor automatically timestamps and preserves recovery/conflicts", () => {
  assert.match(editor, /记录时间：由系统自动生成/);
  assert.doesNotMatch(editor, /填写日期/);
  for (const state of ["offline", "retrying", "conflict", "synced"]) assert.match(editor, new RegExp(state));
  assert.match(editor, /保留云端/); assert.match(editor, /两份都留/); assert.match(editor, /保留我的/);
  assert.match(editor, /查看采用 AI 前的原始想法/);
});

test("anonymous messages are avatar-free, moderated, throttled, and fail closed", () => {
  assert.match(messages, /这里不接受恶评，请认真说话/);
  assert.doesNotMatch(messages, /avatar|头像|glow/i);
  assert.match(messageRoute, /consumeMessageQuota/);
  assert.match(messageRoute, /decision = \{ decision: "review"/);
  assert.match(moderationRoute, /requireOwner/);
  assert.match(migration, /moderation_state = 'approved'/);
});

test("Chinese adversarial moderation covers threats, abuse, privacy exposure, spam, and ambiguous hostility", () => {
  for (const phrase of ["去死", "傻逼", "人肉你", "曝光你", "地址", "刷单", "滚", "闭嘴"]) assert.ok(moderationSource.includes(phrase), phrase);
  assert.match(messageRoute, /deterministicChineseModeration/);
  assert.match(messageRoute, /else try \{ decision = await moderateMessage/);
});

test("public repository merges snapshots without slug collisions", () => {
  assert.match(publicRepo, /normalizeStaticSlugs/);
  assert.match(publicRepo, /while \(used\.has/);
  assert.match(publicRepo, /active_public_posts/);
});

test("built browser assets contain no credential-looking DeepSeek key", async () => {
  const root = fileURLToPath(new URL("../dist/client/", import.meta.url));
  async function walk(directory) { const entries = await readdir(directory, { withFileTypes: true }); return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat(); }
  const files = await walk(root);
  for (const file of files.filter((value) => /\.(?:js|html|css)$/.test(value))) assert.doesNotMatch(await readFile(file, "utf8"), /sk-[a-zA-Z0-9]{24,}/, file);
});
