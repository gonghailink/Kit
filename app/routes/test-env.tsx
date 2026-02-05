import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;

  return json({
    hasJwtKw: !!env.JWT_KW,
    jwtKwLength: env.JWT_KW?.length || 0,
  });
}

export default function TestEnv() {
  return <div>Check the network tab for environment variable info</div>;
}
