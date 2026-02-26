import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { createChallenge, findPasskeysByUser } from "@/lib/db/passkeys";
import { findUserByEmail } from "@/lib/db/users";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || user.status !== "active") {
        // Return a generic challenge with no allowed credentials — the browser
        // will prompt for any passkey and we'll fail at verify time. This
        // prevents user enumeration via the options endpoint.
        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            userVerification: "preferred",
        });
        return NextResponse.json({ options });
    }

    const passkeys = await findPasskeysByUser(user.userId);

    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "preferred",
        allowCredentials: passkeys.map((pk) => ({
            id: pk.credentialId.toString("base64url"),
            transports: pk.transports as AuthenticatorTransportFuture[],
        })),
    });

    await createChallenge({
        challenge: options.challenge,
        userId: user.userId,
        purpose: "authentication",
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    });

    return NextResponse.json({ options });
}
