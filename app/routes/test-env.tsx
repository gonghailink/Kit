import type { LoaderFunctionArgs } from "react-router";

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;

  return {
    hasJwtKw: !!env.JWT_KW,
    jwtKwLength: env.JWT_KW?.length || 0,
  };
}

export default function TestEnv() {
  return <div>Check the network tab for environment variable info</div>;
}
