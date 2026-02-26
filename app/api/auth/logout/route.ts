import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeRefreshToken } from "@/lib/db/refreshTokens";
import { clearAuthCookies, hashRefreshToken } from "@/lib/auth/tokens";

export async function POST() {
    const jar = await cookies();
    const rawRefreshToken = jar.get("refresh_token")?.value;

    if (rawRefreshToken) {
        await revokeRefreshToken(hashRefreshToken(rawRefreshToken));
    }

    await clearAuthCookies();

    return NextResponse.json({ message: "Logged out." });
}
