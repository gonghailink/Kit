import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

// The server build is generated at build time; bypass type resolution for the compiled output.
// @ts-ignore
import * as build from "../build/server/index.js";

const handleRequest = createPagesFunctionHandler({
  // @ts-expect-error - Type mismatch between build and runtime ServerBuild types
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: ({ context }) => context,
});

export const onRequest = handleRequest;
