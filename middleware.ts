import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { AccessTokenPayload } from "@/lib/auth/tokens";

function getSecret(): Uint8Array {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error("JWT_SECRET is not set");
    return new TextEncoder().encode(s);
}

// Add path prefixes that require authentication here
const PROTECTED_PAGE_PREFIXES = ["/account", "/settings"];
const PROTECTED_API_PREFIXES = ["/api/calendar", "/api/tokens"];

function isProtectedPage(pathname: string): boolean {
    return PROTECTED_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
}

function isProtectedApi(pathname: string): boolean {
    return PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isPage = isProtectedPage(pathname);
    const isApi = isProtectedApi(pathname);

    if (!isPage && !isApi) {
        return NextResponse.next();
    }

    const token = request.cookies.get("access_token")?.value;

    if (!token) {
        if (isApi) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        const user = payload as unknown as AccessTokenPayload;

        // Forward user identity to server components via request headers
        const response = NextResponse.next();
        response.headers.set("x-user-id", user.sub);
        response.headers.set("x-user-email", user.email);
        return response;
    } catch {
        // Token expired or tampered
        if (isApi) {
            const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            res.cookies.delete("access_token");
            return res;
        }
        const res = NextResponse.redirect(new URL("/auth/login", request.url));
        res.cookies.delete("access_token");
        return res;
    }
}

export const config = {
    matcher: [
        "/account/:path*",
        "/settings/:path*",
        "/api/calendar/:path*",
        "/api/tokens/:path*",
    ],
};
