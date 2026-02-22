import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rotateRefreshToken } from "@/lib/db/refreshTokens";
import { findUserById } from "@/lib/db/users";
import {
    clearAuthCookies,
    generateRefreshToken,
    hashRefreshToken,
    refreshTokenExpiresAt,
    setAuthCookies,
    signAccessToken,
} from "@/lib/auth/tokens";

export async function POST(_request: NextRequest) {
    const jar = await cookies();
    const rawOldToken = jar.get("refresh_token")?.value;

    if (!rawOldToken) {
        return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const oldTokenHash = hashRefreshToken(rawOldToken);
    const rawNewToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(rawNewToken);
    const newExpiresAt = refreshTokenExpiresAt();

    const newTokenRow = await rotateRefreshToken({
        oldTokenHash,
        newTokenHash,
        newExpiresAt,
    });

    if (!newTokenRow) {
        // Token not found, expired, already rotated (reuse attack), or locked by concurrent request
        await clearAuthCookies();
        return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const user = await findUserById(newTokenRow.userId);
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

    return NextResponse.json({ message: "Token refreshed." });
}
