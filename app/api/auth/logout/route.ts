import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeRefreshToken } from "@/lib/db/refreshTokens";
import { clearAuthCookies } from "@/lib/auth/tokens";
import { hashRefreshToken } from "@/lib/auth/tokens";

export async function POST(_request: NextRequest) {
    const jar = await cookies();
    const rawRefreshToken = jar.get("refresh_token")?.value;

    if (rawRefreshToken) {
        await revokeRefreshToken(hashRefreshToken(rawRefreshToken));
    }

    await clearAuthCookies();

    return NextResponse.json({ message: "Logged out." });
}
