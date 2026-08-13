/**
 * The production schema is PostgreSQL-first and lives in
 * supabase/migrations/0001_living_desk.sql. This starter's D1 binding remains
 * unused because Supabase is an explicit product decision for owner auth,
 * Postgres, Storage, and RLS.
 */
export const persistenceProvider = "supabase" as const;
