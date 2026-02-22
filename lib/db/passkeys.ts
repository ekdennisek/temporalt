import sql from "sql-template-tag";
import { z } from "zod";
import { many, none, one, oneOrNone } from "../queries";

const PasskeySchema = z.object({
    passkeyId: z.number(),
    userId: z.number(),
    credentialId: z.instanceof(Buffer),
    credentialPublicKey: z.instanceof(Buffer),
    counter: z.number(),
    aaguid: z.string().nullable(),
    deviceType: z.string().nullable(),
    backedUp: z.boolean(),
    transports: z.array(z.string()),
    name: z.string().nullable(),
    createdAt: z.coerce.date(),
    lastUsedAt: z.coerce.date().nullable(),
});

export type Passkey = z.infer<typeof PasskeySchema>;

const ChallengeSchema = z.object({
    webauthnChallengeId: z.number(),
    challenge: z.string(),
    userId: z.number().nullable(),
    purpose: z.enum(["registration", "authentication"]),
    expiresAt: z.coerce.date(),
    createdAt: z.coerce.date(),
});

export async function createChallenge(opts: {
    challenge: string;
    userId: number | null;
    purpose: "registration" | "authentication";
    expiresAt: Date;
}): Promise<void> {
    await none(
        sql`
            INSERT INTO webauthn_challenges ("challenge", "userId", "purpose", "expiresAt")
            VALUES (${opts.challenge}, ${opts.userId}, ${opts.purpose}, ${opts.expiresAt})
        `,
    );
}

/**
 * Atomically consumes a challenge. Returns the challenge row if valid, or
 * undefined if not found or expired. Prevents replay attacks.
 */
export async function consumeChallenge(challenge: string) {
    return oneOrNone(
        sql`
            DELETE FROM webauthn_challenges
            WHERE "challenge" = ${challenge} AND "expiresAt" > NOW()
            RETURNING *
        `,
        ChallengeSchema,
    );
}

export async function savePasskey(opts: {
    userId: number;
    credentialId: Uint8Array;
    credentialPublicKey: Uint8Array;
    counter: number;
    aaguid: string;
    deviceType: string;
    backedUp: boolean;
    transports: string[];
    name?: string;
}): Promise<Passkey> {
    const credId = Buffer.from(opts.credentialId);
    const credPk = Buffer.from(opts.credentialPublicKey);
    return one(
        sql`
            INSERT INTO passkeys
              ("userId", "credentialId", "credentialPublicKey", "counter",
               "aaguid", "deviceType", "backedUp", "transports", "name")
            VALUES
              (${opts.userId}, ${credId}, ${credPk}, ${opts.counter},
               ${opts.aaguid}, ${opts.deviceType}, ${opts.backedUp},
               ${opts.transports}, ${opts.name ?? null})
            RETURNING *
        `,
        PasskeySchema,
    );
}

export async function findPasskeysByUser(userId: number): Promise<Passkey[]> {
    return many(
        sql`SELECT * FROM passkeys WHERE "userId" = ${userId} ORDER BY "createdAt"`,
        PasskeySchema,
    );
}

export async function findPasskeyByCredentialId(
    credentialId: Uint8Array,
): Promise<Passkey | undefined> {
    const credId = Buffer.from(credentialId);
    return oneOrNone(
        sql`SELECT * FROM passkeys WHERE "credentialId" = ${credId}`,
        PasskeySchema,
    );
}

export async function updatePasskeyCounter(
    passkeyId: number,
    counter: number,
): Promise<void> {
    await none(
        sql`
            UPDATE passkeys
            SET "counter" = ${counter}, "lastUsedAt" = NOW()
            WHERE "passkeyId" = ${passkeyId}
        `,
    );
}
