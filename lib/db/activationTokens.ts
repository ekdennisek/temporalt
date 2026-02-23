import sql from "sql-template-tag";
import { z } from "zod";
import { none, one, oneOrNone } from "../queries";

const ActivationTokenSchema = z.object({
    activationTokenId: z.number(),
    userId: z.number(),
    tokenHash: z.string(),
    expiresAt: z.coerce.date(),
    usedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
});

type ActivationToken = z.infer<typeof ActivationTokenSchema>;

export async function createActivationToken(opts: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
}): Promise<ActivationToken> {
    return one(
        sql`
            INSERT INTO activation_tokens ("userId", "tokenHash", "expiresAt")
            VALUES (${opts.userId}, ${opts.tokenHash}, ${opts.expiresAt})
            RETURNING *
        `,
        ActivationTokenSchema,
    );
}

/** Invalidates all unused activation tokens for a user (e.g. on re-registration). */
export async function invalidateActivationTokens(userId: number): Promise<void> {
    await none(
        sql`
            UPDATE activation_tokens
            SET "usedAt" = NOW()
            WHERE "userId" = ${userId} AND "usedAt" IS NULL
        `,
    );
}

/**
 * Atomically marks the token as used and returns it.
 * Returns undefined if the token is not found, already used, or expired.
 */
export async function consumeActivationToken(
    tokenHash: string,
): Promise<ActivationToken | undefined> {
    return oneOrNone(
        sql`
            UPDATE activation_tokens
            SET "usedAt" = NOW()
            WHERE "tokenHash" = ${tokenHash}
              AND "usedAt" IS NULL
              AND "expiresAt" > NOW()
            RETURNING *
        `,
        ActivationTokenSchema,
    );
}
