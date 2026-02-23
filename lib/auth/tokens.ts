import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

function getSecret(): Uint8Array {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error("JWT_SECRET is not set");
    return new TextEncoder().encode(s);
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;        // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface AccessTokenPayload {
    sub: string;    // userId as string
    email: string;
    status: "active";
}

// --- JWT ---

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return new SignJWT({ email: payload.email, status: payload.status })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
        .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, getSecret());
    return {
        sub: payload.sub as string,
        email: payload["email"] as string,
        status: "active",
    };
}

// --- Refresh token ---

/** Generates a cryptographically random opaque refresh token value. */
export function generateRefreshToken(): string {
    return randomBytes(32).toString("base64url");
}

/** SHA-256 hash of the raw token — this is what gets stored in the database. */
export function hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiresAt(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
}

// --- Activation token ---

export function generateActivationToken(): string {
    return randomBytes(32).toString("base64url");
}

/** SHA-256 hash of a raw activation token — this is what gets stored in the database. */
export function hashActivationToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

// --- Cookie helpers ---

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function setAuthCookies(
    accessToken: string,
    refreshToken: string,
): Promise<void> {
    const jar = await cookies();
    jar.set("access_token", accessToken, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });
    jar.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: "lax",
        path: "/api/auth/refresh",
        maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
}

export async function clearAuthCookies(): Promise<void> {
    const jar = await cookies();
    jar.delete("access_token");
    // refresh_token is scoped to /api/auth/refresh so we must set path explicitly
    jar.set("refresh_token", "", {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: "lax",
        path: "/api/auth/refresh",
        maxAge: 0,
    });
}
