import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Prevent CSS changes from triggering full page reloads.
// Without this, the cloudflare dev proxy treats CSS changes as SSR module
// invalidations and sends a full-reload signal, causing the page to lose styles.
function cssHmrFix(): Plugin {
  return {
    name: "css-hmr-fix",
    enforce: "pre",
    handleHotUpdate({ file, modules }) {
      if (file.endsWith(".css")) {
        // Only return CSS modules for HMR update, preventing the change
        // from propagating to route modules which would trigger full reload
        return modules.filter((m) => m.type === "css" || m.file?.endsWith(".css"));
      }
    },
  };
}

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
  },
  server: {
    headers: {
      "Cache-Control": "no-store",
    },
  },
  plugins: [
    // Block Chrome's /.well-known/* probe requests from reaching the app router
    {
      name: "block-well-known",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/.well-known/")) {
            res.statusCode = 404;
            res.end();
            return;
          }
          next();
        });
      },
    },
    cloudflareDevProxy(),
    reactRouter(),
    tsconfigPaths(),
    cssHmrFix(),
  ],
});
