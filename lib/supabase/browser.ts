"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireCloudConfig } from "../config";

export function createSupabaseBrowserClient() {
  const config = requireCloudConfig();
  return createBrowserClient(config.url, config.anonKey);
}
