import "server-only";
import { requireCloudConfig, selectRuntimeMode } from "./config";
import { createSupabaseServerClient } from "./supabase/server";

export async function requireOwner() {
  const mode = selectRuntimeMode();
  if (mode === "local-demo") return { id: "local-demo-owner", mode } as const;
  if (mode === "misconfigured") throw new Error("云端记录台尚未配置");
  const config = requireCloudConfig();
  const { data, error } = await (await createSupabaseServerClient()).auth.getUser();
  if (error || !data.user || data.user.id !== config.ownerUserId) throw new Error("无权打开这只抽屉");
  return { id: data.user.id, mode } as const;
}
