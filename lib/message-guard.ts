export type GuardResult = { ok: true } | { ok: false; reason: "empty" | "too-long" | "bot" | "spam" };

export function checkAnonymousMessage(input: { body: string; website?: string }): GuardResult {
  const body = input.body.trim();
  if (input.website) return { ok: false, reason: "bot" };
  if (!body) return { ok: false, reason: "empty" };
  if (body.length > 2000) return { ok: false, reason: "too-long" };
  const links = body.match(/https?:\/\//gi)?.length ?? 0;
  const repeated = /(.)\1{9,}/u.test(body);
  if (links > 2 || repeated) return { ok: false, reason: "spam" };
  return { ok: true };
}
