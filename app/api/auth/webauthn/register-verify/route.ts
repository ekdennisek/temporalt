import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { z } from "zod";
import { tx } from "@/lib/queries";
import { consumeChallenge, savePasskey } from "@/lib/db/passkeys";
import { createUser, findUserByEmail, findUserById } from "@/lib/db/users";
import { createRefreshToken } from "@/lib/db/refreshTokens";
import { createActivationToken, invalidateActivationTokens } from "@/lib/db/activationTokens";
import {
    generateActivationToken,
    generateRefreshToken,
    hashActivationToken,
    hashRefreshToken,
    refreshTokenExpiresAt,
    setAuthCookies,
    signAccessToken,
} from "@/lib/auth/tokens";
import { sendMail } from "@/lib/email/mailer";
import { activationEmail } from "@/lib/email/templates/activation";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

const BodySchema = z.object({
    email: z.string().email(),
    challenge: z.string(),
    credential: z.unknown(),
});

const ACTIVATION_TTL_MS = 24 * 60 * 60 * 1000;

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
        return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 400 });
    }

    // Verify the submitted email matches the user the challenge was issued for.
    // Without this check an attacker could complete a ceremony for their own email,
    // then substitute a victim's email in the verify request and attach their
    // passkey to the victim's account.
    if (challengeRow.userId !== null) {
        const expectedUser = await findUserById(challengeRow.userId);
        if (!expectedUser || expectedUser.emailLower !== email.trim().toLowerCase()) {
            return NextResponse.json({ error: "Email mismatch" }, { status: 400 });
        }
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

    const {
        credential: cred,
        aaguid,
        credentialDeviceType,
        credentialBackedUp,
    } = verification.registrationInfo;

    const user = await tx(async () => {
        let existingUser = await findUserByEmail(email);

        if (!existingUser) {
            existingUser = await createUser({ email, passwordHash: null });
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

        if (existingUser.status === "pending") {
            await invalidateActivationTokens(existingUser.userId);

            const rawToken = generateActivationToken();
            const tokenHash = hashActivationToken(rawToken);
            const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
            await createActivationToken({ userId: existingUser.userId, tokenHash, expiresAt });

            const activationUrl = `${APP_URL}/api/auth/verify-email?token=${rawToken}`;
            await sendMail({ to: email, ...activationEmail(activationUrl) });
        }

        return existingUser;
    });

    if (user.status === "pending") {
        return NextResponse.json(
            { message: "Check your email to activate your account." },
            { status: 201 },
        );
    }

    // User is already active (added a passkey to an existing verified account) — log them in.
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
