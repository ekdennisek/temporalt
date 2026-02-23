import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail } from "@/lib/db/users";
import { createRefreshToken } from "@/lib/db/refreshTokens";
import { checkPassword } from "@/lib/auth/password";
import {
    generateRefreshToken,
    hashRefreshToken,
    refreshTokenExpiresAt,
    setAuthCookies,
    signAccessToken,
} from "@/lib/auth/tokens";
import { randomUUID } from "crypto";

const BodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const INVALID_CREDENTIALS = { error: "Invalid credentials" };

export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

    const { email, password } = parsed.data;
    const user = await findUserByEmail(email);

    // checkPassword always runs argon2.verify() — prevents timing-based email enumeration
    const valid = await checkPassword(user?.passwordHash, password);

    if (!valid || !user || user.status !== "active") {
        return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

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

    return NextResponse.json({
        userId: user.userId,
        email: user.email,
    });
}
