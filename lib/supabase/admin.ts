import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireMessageAdminConfig } from "../config";

export function createMessageAdminClient() {
  const config = requireMessageAdminConfig();
  return createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
