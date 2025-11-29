import type { AppLoadContext } from "@remix-run/cloudflare";

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: {
      env: Record<string, string>;
    };
  }
}
