import { drizzle } from "drizzle-orm/d1";
import * as schema from "../drizzle/schema";

export function createDb(env: any) {
    if (!env.DB) {
        throw new Error("D1 database binding 'DB' not found in environment variables.");
    }
    return drizzle(env.DB, { schema });
}
