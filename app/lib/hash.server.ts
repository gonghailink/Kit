import { eq } from "drizzle-orm";
import { users } from "~/drizzle/schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "~/drizzle/schema";

export async function bumpUserDataHash(
    db: DrizzleD1Database<typeof schema>,
    userId: string
): Promise<string> {
    const newHash = crypto.randomUUID();
    await db
        .update(users)
        .set({ data_hash: newHash })
        .where(eq(users.id, userId));
    return newHash;
}
