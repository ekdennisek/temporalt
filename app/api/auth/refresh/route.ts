import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
    clearAuthCookies,
    generateRefreshToken,
    hashRefreshToken,
    refreshTokenExpiresAt,
    setAuthCookies,
    signAccessToken,
} from "@/lib/auth/tokens";
import { rotateRefreshToken } from "@/lib/db/refreshTokens";
import { findUserById } from "@/lib/db/users";

export async function POST() {
    const jar = await cookies();
    const rawOldToken = jar.get("refresh_token")?.value;

    if (!rawOldToken) {
        return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const oldTokenHash = hashRefreshToken(rawOldToken);
    const rawNewToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(rawNewToken);
    const newExpiresAt = refreshTokenExpiresAt();

    const result = await rotateRefreshToken({
        oldTokenHash,
        newTokenHash,
        newExpiresAt,
    });

    if (!result.ok) {
        if (result.reason === "locked") {
            // A concurrent request is already rotating this token.
            // Do NOT clear cookies — the winner's Set-Cookie will arrive on the response.
            return NextResponse.json({ error: "Concurrent refresh" }, { status: 409 });
        }
        // Genuine failure: not found, expired, revoked, or reuse detected.
        await clearAuthCookies();
        return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const user = await findUserById(result.token.userId);
    if (!user || user.status !== "active") {
        await clearAuthCookies();
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await signAccessToken({
        sub: String(user.userId),
        email: user.email,
        status: "active",
    });

    await setAuthCookies(accessToken, rawNewToken);

    return NextResponse.json({ userId: user.userId, email: user.email });
}
