import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { z } from "zod";
import { tx } from "@/lib/queries";
import { consumeChallenge, savePasskey } from "@/lib/db/passkeys";
import { createUser, findUserByEmail } from "@/lib/db/users";
import { createRefreshToken } from "@/lib/db/refreshTokens";
import {
    generateRefreshToken,
    hashRefreshToken,
    refreshTokenExpiresAt,
    setAuthCookies,
    signAccessToken,
} from "@/lib/auth/tokens";
import { randomUUID } from "crypto";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

const BodySchema = z.object({
    email: z.string().email(),
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

    const { email, challenge: clientChallenge, credential } = parsed.data;

    const challengeRow = await consumeChallenge(clientChallenge);
    if (!challengeRow || challengeRow.purpose !== "registration") {
        return NextResponse.json(
            { error: "Invalid or expired challenge" },
            { status: 400 },
        );
    }

    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response: credential as Parameters<typeof verifyRegistrationResponse>[0]["response"],
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: APP_URL,
            expectedRPID: RP_ID,
        });
    } catch {
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { credential: cred, aaguid, credentialDeviceType, credentialBackedUp } =
        verification.registrationInfo;

    const user = await tx(async () => {
        let existingUser = await findUserByEmail(email);

        if (!existingUser) {
            existingUser = await createUser({ email, passwordHash: null });
        }

        // Passkey-registered users are immediately active (no email verification needed
        // because the authenticator proves presence, not email ownership).
        // If their account was pending (password reg without verification), activate it now.
        if (existingUser.status === "pending") {
            const { none } = await import("@/lib/queries");
            const sql = (await import("sql-template-tag")).default;
            await none(
                sql`UPDATE users SET "status" = 'active', "updatedAt" = NOW() WHERE "userId" = ${existingUser.userId}`,
            );
            existingUser = { ...existingUser, status: "active" };
        }

        await savePasskey({
            userId: existingUser.userId,
            credentialId: Buffer.from(cred.id, "base64url"),
            credentialPublicKey: Uint8Array.from(cred.publicKey),
            counter: cred.counter,
            aaguid,
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: (cred.transports ?? []) as string[],
        });

        return existingUser;
    });

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

    return NextResponse.json({ userId: user.userId, email: user.email }, { status: 201 });
}
