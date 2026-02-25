import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { getUser, login, signup, getSessionStorage } from "~/lib/auth.server";
import { BookmarkSimple as Bookmark, CircleNotch as Loader2 } from "@phosphor-icons/react";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await getUser(request, context.cloudflare.env);

  // 已登入則直接跳轉到 dashboard
  if (user) {
    return redirect("/dashboard");
  }

  return json({});
}

type ActionData = { error?: string; success?: string };

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const env = context.cloudflare.env;
    const formData = await request.formData();
    const intent = formData.get("intent");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return json<ActionData>(
        { error: "請輸入 Email 和密碼" },
        { status: 400 }
      );
    }

    if (intent === "login") {
      // 登入
      const result = await login(email, password, env);

      if ("error" in result) {
        return json<ActionData>({ error: result.error }, { status: 400 });
      }

      const storage = getSessionStorage(env);
      const session = await storage.getSession();
      session.set("jwt", result.token);

      return redirect("/dashboard", {
        headers: {
          "Set-Cookie": await storage.commitSession(session),
        },
      });
    } else if (intent === "signup") {
      // 註冊
      const result = await signup(email, password, env);

      if ("error" in result) {
        return json<ActionData>({ error: result.error }, { status: 400 });
      }

      const storage = getSessionStorage(env);
      const session = await storage.getSession();
      session.set("jwt", result.token);

      return redirect("/dashboard", {
        headers: {
          "Set-Cookie": await storage.commitSession(session),
        },
      });
    }

    return json<ActionData>({ error: "無效的操作" }, { status: 400 });
  } catch (error) {
    console.error("Login action error:", error);
    return json<ActionData>(
      { error: error instanceof Error ? error.message : "登入時發生錯誤" },
      { status: 500 }
    );
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSignUp, setIsSignUp] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="grid justify-items-center text-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/90 text-primary-foreground shadow-sm">
            <img src="/favicon-white.svg" alt="Kit" className="h-full w-full object-contain p-[1px] rounded-xl" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground">
            Kit
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? "建立您的帳號" : "登入您的帳號"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card backdrop-blur-sm border border-border rounded-3xl shadow-xl p-8">
          <Form method="post" className="space-y-6">
            <input type="hidden" name="intent" value={isSignUp ? "signup" : "login"} />

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-input bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                密碼
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {actionData && "error" in actionData && actionData.error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {actionData.error}
              </div>
            )}

            {/* Success Message */}
            {actionData && "success" in actionData && actionData.success && (
              <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm">
                {actionData.success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  處理中...
                </>
              ) : isSignUp ? (
                "註冊"
              ) : (
                "登入"
              )}
            </button>
          </Form>

          {/* Toggle Sign Up / Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              {isSignUp ? "已有帳號？點此登入" : "沒有帳號？點此註冊"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
