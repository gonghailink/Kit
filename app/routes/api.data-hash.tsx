import { data, type LoaderFunctionArgs } from "react-router";
import { getUser } from "~/lib/auth.server";
import { createDb } from "~/lib/db.server";
import { shares, users } from "~/drizzle/schema";
import { eq } from "drizzle-orm";

export async function loader({ request, context }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const shareToken = url.searchParams.get("shareToken");

    const db = createDb(context.cloudflare.env);

    if (shareToken) {
        // 分享頁面：透過 share_token 查到擁有者的 data_hash
        const share = await db
            .select({ user_id: shares.user_id })
            .from(shares)
            .where(eq(shares.share_token, shareToken))
            .get();

        if (!share) {
            return data({ hash: null }, { status: 404 });
        }

        const user = await db
            .select({ data_hash: users.data_hash })
            .from(users)
            .where(eq(users.id, share.user_id))
            .get();

        return { hash: user?.data_hash ?? null };
    }

    // 已登入使用者
    const { user } = await getUser(request, context.cloudflare.env);
    if (!user) {
        return data({ hash: null }, { status: 401 });
    }

    return { hash: user.data_hash };
}
