import { createCookieSessionStorage, redirect } from "@remix-run/cloudflare";
import * as jose from "jose";
import { createDb } from "./db.server";
import { users, workspaces } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const SESSION_SECRET_KEY = "JWT_KW";

export function getSessionStorage(env: any) {
    const secret = env[SESSION_SECRET_KEY] || "default_secret_key_change_me";
    return createCookieSessionStorage({
        cookie: {
            name: "__session",
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secrets: [secret],
            secure: process.env.NODE_ENV === "production",
        },
    });
}

// Password Hashing (using PBKDF2 via Web Crypto)
async function hashPassword(password: string) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    const key = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );
    const hash = new Uint8Array(key);

    // Return salt:hash in base64
    return `${btoa(String.fromCharCode(...salt))}:${btoa(String.fromCharCode(...hash))}`;
}

async function verifyPassword(password: string, storedHash: string) {
    const [saltBase64, hashBase64] = storedHash.split(":");
    const salt = new Uint8Array(atob(saltBase64).split("").map((c) => c.charCodeAt(0)));
    const originalHash = new Uint8Array(atob(hashBase64).split("").map((c) => c.charCodeAt(0)));

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    const key = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );
    const derivedHash = new Uint8Array(key);

    if (derivedHash.length !== originalHash.length) return false;
    return derivedHash.every((val, i) => val === originalHash[i]);
}

// JWT Utilities
async function signJWT(payload: any, env: any) {
    const secret = new TextEncoder().encode(env[SESSION_SECRET_KEY] || "default_secret_key_change_me");
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secret);
}

async function verifyJWT(token: string, env: any) {
    try {
        const secret = new TextEncoder().encode(env[SESSION_SECRET_KEY] || "default_secret_key_change_me");
        const { payload } = await jose.jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

// Auth Helpers
export async function getSession(request: Request, env: any) {
    const storage = getSessionStorage(env);
    return storage.getSession(request.headers.get("Cookie"));
}

export async function getUser(request: Request, env: any) {
    const session = await getSession(request, env);
    const token = session.get("jwt");
    if (!token) return { user: null };

    const payload = await verifyJWT(token, env);
    if (!payload || !payload.sub) return { user: null };

    const db = createDb(env);
    const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub as string),
    });

    return { user: user || null };
}

export async function requireAuth(request: Request, env: any) {
    const { user } = await getUser(request, env);
    if (!user) {
        throw redirect("/login");
    }
    return { user };
}

export async function login(email: string, password: string, env: any) {
    const db = createDb(env);
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user || !(await verifyPassword(password, user.password_hash))) {
        return { error: "Email 或密碼錯誤" };
    }

    const token = await signJWT({ sub: user.id, email: user.email }, env);
    return { token, user };
}

export async function signup(email: string, password: string, env: any) {
    const db = createDb(env);

    // Check whitelist if configured
    const whitelist = env.REGISTRATION_WHITELIST?.trim();
    if (whitelist) {
        const allowedEmails = whitelist.split(',').map((e: string) => e.trim().toLowerCase());
        if (!allowedEmails.includes(email.toLowerCase())) {
            return { error: "此 Email 未被授權註冊，請聯絡管理員" };
        }
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });
    if (existingUser) {
        return { error: "此 Email 已被註冊" };
    }

    const password_hash = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
        email,
        password_hash,
    }).returning();

    // 自動為新用戶創建預設 workspace
    await db.insert(workspaces).values({
        user_id: newUser.id,
        title: "我的工作區",
        sort_order: 0,
    });

    const token = await signJWT({ sub: newUser.id, email: newUser.email }, env);
    return { token, user: newUser };
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string, env: any) {
    const db = createDb(env);
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user || !(await verifyPassword(oldPassword, user.password_hash))) {
        return { error: "目前的密碼錯誤" };
    }

    const password_hash = await hashPassword(newPassword);
    await db.update(users)
        .set({ password_hash, updated_at: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(users.id, userId));

    return { success: true };
}

export async function logout(request: Request, env: any) {
    const storage = getSessionStorage(env);
    const session = await storage.getSession(request.headers.get("Cookie"));
    return redirect("/login", {
        headers: {
            "Set-Cookie": await storage.destroySession(session),
        },
    });
}
