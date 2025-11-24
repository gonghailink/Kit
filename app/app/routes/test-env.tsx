import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;

  return json({
    hasSupabaseUrl: !!env.SUPABASE_URL,
    hasViteSupabaseUrl: !!env.VITE_SUPABASE_URL,
    hasSupabaseAnonKey: !!env.SUPABASE_ANON_KEY,
    hasViteSupabaseKey: !!env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    supabaseUrlPrefix: env.SUPABASE_URL?.substring(0, 30),
    anonKeyPrefix: env.SUPABASE_ANON_KEY?.substring(0, 20),
    anonKeyFormat: env.SUPABASE_ANON_KEY?.startsWith("eyJ") ? "JWT (correct)" : "Not JWT (incorrect)",
  });
}

export default function TestEnv() {
  return <div>Check the network tab for environment variable info</div>;
}
