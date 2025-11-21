import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { Database } from "./types";

export function createSupabaseServerClient(request: Request, env: any) {
  const headers = new Headers();

  const supabase = createServerClient<Database>(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
          });
        },
      },
    }
  );

  return { supabase, headers };
}

// 取得當前使用者
export async function getUser(request: Request, env: any) {
  const { supabase, headers } = createSupabaseServerClient(request, env);
  const { data: { user }, error } = await supabase.auth.getUser();

  return { user, error, headers };
}

// 檢查是否已登入，未登入則重定向
export async function requireAuth(request: Request, env: any) {
  const { user, error, headers } = await getUser(request, env);

  if (error || !user) {
    throw new Response("Unauthorized", {
      status: 302,
      headers: {
        ...Object.fromEntries(headers),
        Location: "/login",
      },
    });
  }

  return { user, headers };
}
