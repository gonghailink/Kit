import "react-router";

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Record<string, string>;
    };
  }
}
