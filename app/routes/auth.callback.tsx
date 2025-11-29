import { redirect, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createSupabaseServerClient } from "~/lib/supabase.server";

// Supabase Auth 回調處理
export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const { supabase, headers } = createSupabaseServerClient(request, context.cloudflare.env);
    await supabase.auth.exchangeCodeForSession(code);
    return redirect("/dashboard", { headers });
  }

  return redirect("/login");
}
