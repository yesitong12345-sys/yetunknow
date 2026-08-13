import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [schema, studio, content] = await Promise.all([
  readFile(new URL("../supabase/migrations/0001_living_desk.sql", import.meta.url), "utf8"),
  readFile(new URL("../lib/studio.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
]);

test("private source and public snapshot are separate records", () => {
  assert.match(schema, /create table public\.private_notes/i);
  assert.match(schema, /create table public\.public_posts/i);
  assert.match(schema, /source_note_id uuid not null references public\.private_notes/i);
  assert.doesNotMatch(schema, /private_notes[\s\S]{0,500}visibility/i);
  assert.match(studio, /sourceNoteId/);
  assert.match(studio, /withdrawnAt/);
});

test("seeded public content is explicitly marked as example material", () => {
  const entryCount = (content.match(/, example: true/g) ?? []).length;
  assert.ok(entryCount >= 1);
  for (const kind of ["ideas", "daily", "projects"]) assert.ok((content.match(new RegExp(`kind: "${kind}"`, "g")) ?? []).length >= 1);
});
