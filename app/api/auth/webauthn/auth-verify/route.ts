import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { z } from "zod";
import {
    consumeChallenge,
    findPasskeyByCredentialId,
    updatePasskeyCounter,
} from "@/lib/db/passkeys";
import { findUserById } from "@/lib/db/users";
import { createRefreshToken } from "@/lib/db/refreshTokens";
import {
    generateRefreshToken,
    hashRefreshToken,
    refreshTokenExpiresAt,
    setAuthCookies,
    signAccessToken,
} from "@/lib/auth/tokens";
import { randomUUID } from "crypto";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

const BodySchema = z.object({
    challenge: z.string(),
    credential: z.unknown(),
});

export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { challenge: clientChallenge, credential } = parsed.data;

    const credentialAsResponse = credential as { id: string; [key: string]: unknown };

    const challengeRow = await consumeChallenge(clientChallenge);
    if (!challengeRow || challengeRow.purpose !== "authentication") {
        return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 400 });
    }

    // Look up the passkey by credential ID from the assertion response
    const credentialId = isoBase64URL.toBuffer(credentialAsResponse.id);
    const passkey = await findPasskeyByCredentialId(credentialId);

    if (!passkey) {
        return NextResponse.json({ error: "Unknown credential" }, { status: 401 });
    }

    let verification;
    try {
        verification = await verifyAuthenticationResponse({
            response: credential as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: APP_URL,
            expectedRPID: RP_ID,
            credential: {
                id: passkey.credentialId.toString("base64url"),
                publicKey: Uint8Array.from(passkey.credentialPublicKey),
                counter: passkey.counter,
                transports: passkey.transports as Parameters<
                    typeof verifyAuthenticationResponse
                >[0]["credential"]["transports"],
            },
        });
    } catch {
        return NextResponse.json({ error: "Verification failed" }, { status: 401 });
    }

    if (!verification.verified) {
        return NextResponse.json({ error: "Verification failed" }, { status: 401 });
    }

    await updatePasskeyCounter(passkey.passkeyId, verification.authenticationInfo.newCounter);

    const user = await findUserById(passkey.userId);
    if (!user || user.status !== "active") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await signAccessToken({
        sub: String(user.userId),
        email: user.email,
        status: "active",
    });

    const rawRefreshToken = generateRefreshToken();
    await createRefreshToken({
        userId: user.userId,
        tokenHash: hashRefreshToken(rawRefreshToken),
        family: randomUUID(),
        expiresAt: refreshTokenExpiresAt(),
    });

    await setAuthCookies(accessToken, rawRefreshToken);

    return NextResponse.json({ userId: user.userId, email: user.email });
}
