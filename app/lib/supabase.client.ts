import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  // 單例模式：避免重複建立客戶端
  if (client) return client;

  if (typeof window === "undefined") {
    throw new Error("createSupabaseBrowserClient can only be used in the browser");
  }

  client = createBrowserClient<Database>(
    window.ENV.VITE_SUPABASE_URL,
    window.ENV.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );

  return client;
}
