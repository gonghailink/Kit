import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import type { ServerBuild } from "@remix-run/cloudflare";

// The server build is generated at build time; bypass type resolution for the compiled output.
// @ts-ignore
import * as build from "../build/server/index.js";

const handleRequest = createPagesFunctionHandler({
  build: build as unknown as ServerBuild,
  mode: process.env.NODE_ENV,
  getLoadContext: ({ context }) => context,
});

export const onRequest = handleRequest;
