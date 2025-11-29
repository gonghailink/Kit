import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

// The server build is generated at build time
// @ts-ignore
import * as build from "../build/server/index.js";

const handleRequest = createPagesFunctionHandler({
  // @ts-expect-error - Type mismatch between build-time and runtime ServerBuild types
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: ({ context }) => context,
});

export const onRequest = handleRequest;
