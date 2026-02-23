import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tx } from "@/lib/queries";
import { createUser, findUserByEmail } from "@/lib/db/users";
import {
    createActivationToken,
    invalidateActivationTokens,
} from "@/lib/db/activationTokens";
import { hashPassword } from "@/lib/auth/password";
import {
    generateActivationToken,
    hashActivationToken,
} from "@/lib/auth/tokens";
import { sendMail } from "@/lib/email/mailer";
import { activationEmail } from "@/lib/email/templates/activation";

const BodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(12, "Password must be at least 12 characters"),
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
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 },
        );
    }

    const { email, password } = parsed.data;
    const existingUser = await findUserByEmail(email);

    if (existingUser?.status === "active") {
        // Don't reveal that the email is registered — respond identically to success
        return NextResponse.json({ message: "Check your email to activate your account." });
    }

    const passwordHash = await hashPassword(password);

    await tx(async () => {
        let userId: number;

        if (existingUser?.status === "pending") {
            // Re-registration: update the password and resend activation
            await invalidateActivationTokens(existingUser.userId);
            const { none } = await import("@/lib/queries");
            const sql = (await import("sql-template-tag")).default;
            await none(
                sql`
                    UPDATE users
                    SET "passwordHash" = ${passwordHash}, "updatedAt" = NOW()
                    WHERE "userId" = ${existingUser.userId}
                `,
            );
            userId = existingUser.userId;
        } else {
            const user = await createUser({ email, passwordHash });
            userId = user.userId;
        }

        const rawToken = generateActivationToken();
        const tokenHash = hashActivationToken(rawToken);
        const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);

        await createActivationToken({ userId, tokenHash, expiresAt });

        const appUrl = process.env.APP_URL ?? "";
        const activationUrl = `${appUrl}/api/auth/verify-email?token=${rawToken}`;

        await sendMail({ to: email, ...activationEmail(activationUrl) });
    });

    return NextResponse.json({ message: "Check your email to activate your account." });
}
