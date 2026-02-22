import sql from "sql-template-tag";
import { z } from "zod";
import { none, one, oneOrNone } from "../queries";
import { tx } from "../queries";

const RefreshTokenSchema = z.object({
    refreshTokenId: z.number(),
    userId: z.number(),
    tokenHash: z.string(),
    family: z.string(),
    issuedAt: z.coerce.date(),
    expiresAt: z.coerce.date(),
    revokedAt: z.coerce.date().nullable(),
    replacedBy: z.number().nullable(),
});

type RefreshToken = z.infer<typeof RefreshTokenSchema>;

export async function createRefreshToken(opts: {
    userId: number;
    tokenHash: string;
    family: string;
    expiresAt: Date;
}): Promise<RefreshToken> {
    return one(
        sql`
            INSERT INTO refresh_tokens ("userId", "tokenHash", "family", "expiresAt")
            VALUES (${opts.userId}, ${opts.tokenHash}, ${opts.family}, ${opts.expiresAt})
            RETURNING *
        `,
        RefreshTokenSchema,
    );
}

/**
 * Rotates a refresh token atomically:
 * - Locks the old row (SKIP LOCKED handles concurrent requests)
 * - Detects reuse if the token was already replaced
 * - Inserts a new token in the same family
 * - Marks the old token as replaced
 *
 * Returns the new token row on success, or null if:
 *   - Token not found / expired / already revoked → caller should return 401
 *   - Reuse detected → caller should return 401 (family is revoked)
 */
export async function rotateRefreshToken(opts: {
    oldTokenHash: string;
    newTokenHash: string;
    newExpiresAt: Date;
}): Promise<RefreshToken | null> {
    return tx(async () => {
        // Lock the row exclusively; SKIP LOCKED means concurrent requests get null immediately
        const old = await oneOrNone(
            sql`
                SELECT * FROM refresh_tokens
                WHERE "tokenHash" = ${opts.oldTokenHash}
                  AND "revokedAt" IS NULL
                  AND "expiresAt" > NOW()
                FOR UPDATE SKIP LOCKED
            `,
            RefreshTokenSchema,
        );

        if (!old) return null;

        if (old.replacedBy !== null) {
            // Token has already been rotated — this is a reuse attempt.
            // Revoke the entire family to invalidate all sessions derived from it.
            await none(
                sql`
                    UPDATE refresh_tokens
                    SET "revokedAt" = NOW()
                    WHERE "family" = ${old.family}
                `,
            );
            return null;
        }

        const newToken = await one(
            sql`
                INSERT INTO refresh_tokens ("userId", "tokenHash", "family", "expiresAt")
                VALUES (${old.userId}, ${opts.newTokenHash}, ${old.family}, ${opts.newExpiresAt})
                RETURNING *
            `,
            RefreshTokenSchema,
        );

        await none(
            sql`
                UPDATE refresh_tokens
                SET "replacedBy" = ${newToken.refreshTokenId}, "revokedAt" = NOW()
                WHERE "refreshTokenId" = ${old.refreshTokenId}
            `,
        );

        return newToken;
    });
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
    await none(
        sql`
            UPDATE refresh_tokens
            SET "revokedAt" = NOW()
            WHERE "tokenHash" = ${tokenHash} AND "revokedAt" IS NULL
        `,
    );
}

export async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await none(
        sql`
            UPDATE refresh_tokens
            SET "revokedAt" = NOW()
            WHERE "userId" = ${userId} AND "revokedAt" IS NULL
        `,
    );
}
