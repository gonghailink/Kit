import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { createSupabaseServerClient, getUser } from "~/lib/supabase.server";
import { Bookmark, Loader2 } from "lucide-react";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await getUser(request, context.cloudflare.env);

  // 已登入則直接跳轉到 dashboard
  if (user) {
    return redirect("/dashboard");
  }

  return json({});
}

type ActionData =
  | { error: string; success?: never }
  | { success: string; error?: never };

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const { supabase, headers } = createSupabaseServerClient(request, context.cloudflare.env);
    const formData = await request.formData();
    const intent = formData.get("intent");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return json<ActionData>(
        { error: "請輸入 Email 和密碼" },
        { status: 400, headers }
      );
    }

    if (intent === "login") {
      // 登入
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return json<ActionData>({ error: error.message }, { status: 400, headers });
      }

      return redirect("/dashboard", { headers });
    } else if (intent === "signup") {
      // 註冊
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return json<ActionData>({ error: error.message }, { status: 400, headers });
      }

      return json<ActionData>(
        { success: "註冊成功！請檢查您的 Email 以驗證帳號。" },
        { headers }
      );
    }

    return json<ActionData>({ error: "無效的操作" }, { status: 400, headers });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Bookmark className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            書籤管理器
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isSignUp ? "建立您的帳號" : "登入您的帳號"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <Form method="post" className="space-y-6">
            <input type="hidden" name="intent" value={isSignUp ? "signup" : "login"} />

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                密碼
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {actionData && "error" in actionData && actionData.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {actionData.error}
              </div>
            )}

            {/* Success Message */}
            {actionData && "success" in actionData && actionData.success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
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
