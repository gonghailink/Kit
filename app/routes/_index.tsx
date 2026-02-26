import { redirect, type LoaderFunctionArgs } from "react-router";
import { getUser } from "~/lib/auth.server";

// 首頁：已登入則跳轉到 dashboard，未登入則跳轉到 login
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await getUser(request, context.cloudflare.env);

  if (user) {
    return redirect("/dashboard");
  }

  return redirect("/login");
}
