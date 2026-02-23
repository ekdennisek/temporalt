import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createChallenge, findPasskeysByUser } from "@/lib/db/passkeys";
import { findUserByEmail } from "@/lib/db/users";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const RP_NAME = process.env.WEBAUTHN_RP_NAME ?? "Temporalt";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Find the user if they already exist, so we can exclude existing credentials
    const user = await findUserByEmail(email);
    const existingPasskeys = user ? await findPasskeysByUser(user.userId) : [];

    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: email,
        userDisplayName: email,
        attestationType: "none",
        authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
        },
        excludeCredentials: existingPasskeys.map((pk) => ({
            id: pk.credentialId.toString("base64url"),
            transports: pk.transports as AuthenticatorTransportFuture[],
        })),
    });

    await createChallenge({
        challenge: options.challenge,
        userId: user?.userId ?? null,
        purpose: "registration",
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    });

    return NextResponse.json({ options, email });
}
