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

async function verifyToken(token: string): Promise<AccessTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as AccessTokenPayload;
    } catch {
        return null;
    }
}

function buildAuthedResponse(
    request: NextRequest,
    user: { sub: string; email: string },
    setCookieHeaders?: string[],
): NextResponse {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("x-user-id");
    requestHeaders.delete("x-user-email");
    requestHeaders.set("x-user-id", user.sub);
    requestHeaders.set("x-user-email", user.email);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (setCookieHeaders) {
        for (const c of setCookieHeaders) {
            response.headers.append("Set-Cookie", c);
        }
    }
    return response;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProtPage = isProtectedPage(pathname);
    const isProtApi = isProtectedApi(pathname);
    const isProtected = isProtPage || isProtApi;

    // Strip any client-supplied identity headers to prevent spoofing.
    // buildAuthedResponse() will re-add them with verified values for authenticated requests.
    const sanitizedHeaders = new Headers(request.headers);
    sanitizedHeaders.delete("x-user-id");
    sanitizedHeaders.delete("x-user-email");

    // Step 1: Try the existing access token
    const accessToken = request.cookies.get("access_token")?.value;
    if (accessToken) {
        const user = await verifyToken(accessToken);
        if (user) {
            return buildAuthedResponse(request, { sub: user.sub, email: user.email });
        }
        // Token present but invalid (expired/tampered) — fall through to refresh
    }

    // Step 2: Attempt silent refresh using the refresh token
    const hasRefreshToken = !!request.cookies.get("refresh_token")?.value;

    if (!hasRefreshToken) {
        if (isProtected) {
            if (isProtApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        return NextResponse.next({ request: { headers: sanitizedHeaders } });
    }

    let refreshResponse: Response;
    try {
        const refreshUrl = new URL("/api/auth/refresh", request.url).toString();
        refreshResponse = await fetch(refreshUrl, {
            method: "POST",
            headers: { cookie: request.headers.get("cookie") ?? "" },
        });
    } catch {
        if (isProtected) {
            if (isProtApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        return NextResponse.next({ request: { headers: sanitizedHeaders } });
    }

    if (refreshResponse.ok) {
        const body = (await refreshResponse.json()) as { userId: number; email: string };
        const setCookieHeaders = refreshResponse.headers.getSetCookie();
        return buildAuthedResponse(
            request,
            { sub: String(body.userId), email: body.email },
            setCookieHeaders,
        );
    }

    if (refreshResponse.status === 409) {
        // Concurrent refresh race — the winning request will have set fresh cookies.
        // For page requests: redirect to the same URL (once) so the browser re-requests
        // with the freshly-set cookies from the winning request.
        // For API requests: return 503 so the client can retry immediately.
        const isRetry = request.nextUrl.searchParams.has("_retry");
        if (isProtApi) {
            return NextResponse.json(
                { error: "Concurrent refresh, retry immediately" },
                { status: 503, headers: { "Retry-After": "0" } },
            );
        }
        if (!isRetry) {
            const retryUrl = new URL(request.url);
            retryUrl.searchParams.set("_retry", "1");
            return NextResponse.redirect(retryUrl);
        }
        // Already retried — give up
        if (isProtected) {
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        return NextResponse.next({ request: { headers: sanitizedHeaders } });
    }

    // 401 or other error — refresh token is invalid/revoked; cookies were cleared by the endpoint
    if (isProtected) {
        if (isProtApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.next({ request: { headers: sanitizedHeaders } });
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/refresh).*)"],
};
