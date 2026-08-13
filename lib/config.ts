import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
});

const serverSchema = publicSchema.extend({
  SITE_OWNER_USER_ID: z.string().uuid().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  DEEPSEEK_API_KEY: z.string().min(20).optional(),
  DEEPSEEK_MODEL: z.string().min(1).default("deepseek-v4-flash"),
});

export type RuntimeMode = "cloud" | "local-demo" | "misconfigured";

export function readPublicConfig(env: NodeJS.ProcessEnv = process.env) {
  return publicSchema.parse(env);
}

export function readServerConfig(env: NodeJS.ProcessEnv = process.env) {
  return serverSchema.parse(env);
}

export function selectRuntimeMode(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeMode {
  const hasCloud = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env.SITE_OWNER_USER_ID,
  );
  if (hasCloud) return "cloud";
  return env.NODE_ENV === "production" ? "misconfigured" : "local-demo";
}

export function selectClientRuntimeMode(env: NodeJS.ProcessEnv = process.env): RuntimeMode {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return "cloud";
  return env.NODE_ENV === "production" ? "misconfigured" : "local-demo";
}

export function requireCloudConfig(env: NodeJS.ProcessEnv = process.env) {
  const config = readServerConfig(env);
  if (
    !config.NEXT_PUBLIC_SUPABASE_URL ||
    !config.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !config.SITE_OWNER_USER_ID
  ) {
    throw new Error("云端记录台尚未完成配置");
  }
  return {
    url: config.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ownerUserId: config.SITE_OWNER_USER_ID,
  };
}

export function redactSecret(value: string) {
  return value.length < 8 ? "[REDACTED]" : `${value.slice(0, 3)}…[REDACTED]`;
}

export function requireMessageAdminConfig(env: NodeJS.ProcessEnv = process.env) {
  const base = requireCloudConfig(env);
  const config = readServerConfig(env);
  if (!config.SUPABASE_SERVICE_ROLE_KEY) throw new Error("匿名留言写入通道尚未配置");
  return { ...base, serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY };
}
