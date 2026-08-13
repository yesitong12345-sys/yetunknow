import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sql = await readFile(new URL("../supabase/migrations/0001_living_desk.sql", import.meta.url), "utf8");

test("private notes enable RLS and define owner policies for every mutation", () => {
  assert.match(sql, /alter table public\.private_notes enable row level security/i);
  for (const verb of ["select", "insert", "update", "delete"]) {
    assert.match(sql, new RegExp(`create policy[^;]+private notes[^;]+for ${verb}[^;]+auth\\.uid\\(\\)[^;]+owner_id`, "is"));
  }
  assert.match(sql, /revoke all on public\.private_notes from anon/i);
});

test("anonymous public access excludes withdrawn rows", () => {
  assert.match(sql, /anonymous reads active public snapshots[^;]+withdrawn_at is null/is);
  assert.match(sql, /owners read all their public snapshots[^;]+auth\.uid\(\)[^;]+owner_id/is);
  assert.match(sql, /anonymous reads active projects[^;]+published_at is not null and withdrawn_at is null/is);
});

test("anonymous snapshot grants exclude internal ownership identifiers", () => {
  assert.match(sql, /create view public\.active_public_posts[\s\S]+where withdrawn_at is null/i);
  const anonGrant = sql.match(/grant select \(([^)]+)\) on public\.public_posts to anon/i)?.[1] ?? "";
  assert.ok(anonGrant.length > 0);
  assert.doesNotMatch(anonGrant, /owner_id|source_note_id/i);
});

test("public and private assets have separate bucket policies", () => {
  assert.match(sql, /'public-assets'.+true/is);
  assert.match(sql, /'private-assets'.+false/is);
  assert.match(sql, /owner reads private assets[^;]+authenticated[^;]+bucket_id = 'private-assets'[^;]+owner_id/is);
  assert.doesNotMatch(sql, /owner reads private assets[^;]+to anon/is);
});
