import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Fallback no-op client when env vars are missing (mock-data mode)
export const supabase = createClient(
  supabaseUrl  ?? "https://placeholder.supabase.co",
  supabaseKey  ?? "placeholder-key",
);
