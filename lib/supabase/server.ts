import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireCloudConfig } from "../config";

export async function createSupabaseServerClient() {
  const config = requireCloudConfig();
  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        for (const item of items) {
          try {
            cookieStore.set(item.name, item.value, item.options);
          } catch {
            // Server Components cannot always write cookies. Route handlers can.
          }
        }
      },
    },
  });
}
