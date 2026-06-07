import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "school-docs";

function getConfig() {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getConfig();
  return Boolean(url && key);
}

let client: SupabaseClient | null = null;

// Lazy init — avoids build failure when env vars are absent at module load time
export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const { url, key } = getConfig();
    client = createClient(url, key);
  }
  return client;
}
