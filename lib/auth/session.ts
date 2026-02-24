import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "./tokens";

export interface SessionUser {
    userId: number;
    email: string;
}

/**
 * Returns the authenticated user from the request headers set by middleware,
 * or null if the request is unauthenticated.
 *
 * Only call this from server components or server actions on routes that pass
 * through the auth middleware.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
    const hdrs = await headers();
    const userIdStr = hdrs.get("x-user-id");
    const email = hdrs.get("x-user-email");

    if (!userIdStr || !email) return null;

    const userId = Number(userIdStr);
    if (!Number.isFinite(userId)) return null;

    return { userId, email };
}

/**
 * Returns the authenticated user from middleware-set headers (preferred) or by verifying
 * the access token cookie directly. Works on all pages.
 *
 * Checking headers first ensures that on the same request where middleware refreshed
 * the token, the new identity is visible even though the new cookie is not yet in
 * the incoming request (it is in the Set-Cookie response header).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
    // Prefer headers set by middleware — available even when the cookie was just refreshed
    const hdrs = await headers();
    const userIdStr = hdrs.get("x-user-id");
    const email = hdrs.get("x-user-email");
    if (userIdStr && email) {
        const userId = Number(userIdStr);
        if (Number.isFinite(userId)) return { userId, email };
    }

    // Fallback: verify cookie directly
    const jar = await cookies();
    const token = jar.get("access_token")?.value;
    if (!token) return null;
    try {
        const payload = await verifyAccessToken(token);
        const userId = Number(payload.sub);
        if (!Number.isFinite(userId)) return null;
        return { userId, email: payload.email };
    } catch {
        return null;
    }
}
