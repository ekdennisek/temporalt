import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
    generateRefreshToken,
    hashActivationToken,
    hashRefreshToken,
    refreshTokenExpiresAt,
    setAuthCookies,
    signAccessToken,
} from "@/lib/auth/tokens";
import { consumeActivationToken } from "@/lib/db/activationTokens";
import { createRefreshToken } from "@/lib/db/refreshTokens";
import { activateUser, findUserById } from "@/lib/db/users";
import { tx } from "@/lib/queries";

export async function GET(request: NextRequest) {
    const rawToken = request.nextUrl.searchParams.get("token");

    if (!rawToken) {
        return NextResponse.redirect(new URL("/auth/register?error=missing_token", request.url));
    }

    const tokenHash = hashActivationToken(rawToken);

    const activationToken = await tx(async () => {
        const token = await consumeActivationToken(tokenHash);
        if (!token) return null;
        await activateUser(token.userId);
        return token;
    });

    if (!activationToken) {
        return NextResponse.redirect(new URL("/auth/register?error=invalid_token", request.url));
    }

    const user = await findUserById(activationToken.userId);
    if (!user || user.status !== "active") {
        return NextResponse.redirect(new URL("/auth/register?error=invalid_token", request.url));
    }

    // Issue tokens so the user is logged in immediately after verification
    const accessToken = await signAccessToken({
        sub: String(user.userId),
        email: user.email,
        status: "active",
    });

    const rawRefreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = refreshTokenExpiresAt();
    const family = randomUUID();

    await createRefreshToken({
        userId: user.userId,
        tokenHash: refreshTokenHash,
        family,
        expiresAt,
    });

    await setAuthCookies(accessToken, rawRefreshToken);

    return NextResponse.redirect(new URL("/", request.url));
}
