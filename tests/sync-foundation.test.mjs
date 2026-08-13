import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [config, contracts, repository, deepseek, migration, envExample, studioLayout, auth] = await Promise.all([
  readFile(new URL("../lib/config.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/studio-contracts.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/studio-repository.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/deepseek.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/0002_mobile_studio_sync.sql", import.meta.url), "utf8"),
  readFile(new URL("../.env.example", import.meta.url), "utf8"),
  readFile(new URL("../app/studio/layout.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/auth.ts", import.meta.url), "utf8"),
]);

test("production refuses silent local fallback", () => {
  assert.match(config, /NODE_ENV === "production" \? "misconfigured" : "local-demo"/);
  assert.match(repository, /正式环境缺少云端记录台配置/);
  assert.match(repository, /localDemoStudioRepository/);
});

test("studio contract models synchronization and conflicts", () => {
  for (const value of ["synced", "offline", "retrying", "conflict"]) assert.match(contracts, new RegExp(`"${value}"`));
  assert.match(contracts, /baseUpdatedAt/);
  assert.match(repository, /cloud\.updatedAt !== update\.baseUpdatedAt/);
});

test("DeepSeek key is server-only and redacted from examples", () => {
  assert.match(deepseek, /import "server-only"/);
  assert.match(deepseek, /process|readServerConfig/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_DEEPSEEK/);
  assert.doesNotMatch(envExample, /sk-[a-zA-Z0-9]{16,}/);
});

test("migration protects private files and only exposes approved messages", () => {
  assert.match(migration, /private_note_attachments enable row level security/i);
  assert.match(migration, /anonymous reads approved messages[^;]+moderation_state = 'approved'/is);
  assert.match(migration, /unique index[^;]+import_identity/is);
  assert.match(migration, /captured_at timestamptz not null default now\(\)/i);
});

test("owner and different-user SQL contracts depend on auth.uid ownership", () => {
  assert.match(migration, /owners manage their private attachments[^;]+auth\.uid\(\)[^;]+owner_id/is);
  assert.match(migration, /owner manages all messages[^;]+auth\.uid\(\)[^;]+reviewed_by/is);
  assert.doesNotMatch(migration, /grant insert[^;]+public_messages to anon/i);
});

test("private routes check the server session before rendering", () => {
  assert.match(studioLayout, /await requireOwner\(\)/);
  assert.match(studioLayout, /force-dynamic/);
  assert.match(studioLayout, /force-no-store/);
  assert.match(auth, /data\.user\.id !== config\.ownerUserId/);
});
