import "server-only";
import { createHash } from "node:crypto";

const windows = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 4;

export function anonymousClientHash(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const agent = request.headers.get("user-agent")?.slice(0, 180) ?? "unknown";
  const salt = process.env.MESSAGE_HASH_SALT || process.env.SITE_OWNER_USER_ID || "local-demo";
  return createHash("sha256").update(`${salt}:${forwarded}:${agent}`).digest("hex");
}

export function consumeMessageQuota(hash: string, now = Date.now()) {
  const recent = (windows.get(hash) ?? []).filter((value) => now - value < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now); windows.set(hash, recent); return true;
}
