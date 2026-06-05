import { createClient } from "@supabase/supabase-js";

const url  = process.env.SUPABASE_URL  ?? process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Server-side client (uses service role key – never expose to browser)
export const supabaseAdmin = createClient(url, key);

export const BUCKET = "school-docs";
