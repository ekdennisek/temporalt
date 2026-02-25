import sql from "sql-template-tag";
import { z } from "zod";
import { none, one, oneOrNone } from "../queries";
import { tx } from "../queries";

type RotateResult =
    | { ok: true; token: RefreshToken }
    | { ok: false; reason: "not_found" | "reuse" | "locked" };

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
 * Returns a discriminated result:
 *   - { ok: true, token } on success
 *   - { ok: false, reason: "locked" } if a concurrent request holds the lock (caller should return 409)
 *   - { ok: false, reason: "not_found" | "reuse" } if the token is invalid (caller should return 401)
 */
export async function rotateRefreshToken(opts: {
    oldTokenHash: string;
    newTokenHash: string;
    newExpiresAt: Date;
}): Promise<RotateResult> {
    return tx(async () => {
        // Lock the row exclusively; SKIP LOCKED means concurrent requests skip past immediately
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

        if (!old) {
            // Distinguish "locked by a concurrent peer" from "genuinely not found / revoked".
            // A plain SELECT (no SKIP LOCKED) will wait briefly for any holding lock to release,
            // then return the row (possibly now rotated by the winner, with replacedBy set).
            const fallback = await oneOrNone(
                sql`
                    SELECT "replacedBy", "revokedAt" FROM refresh_tokens
                    WHERE "tokenHash" = ${opts.oldTokenHash}
                      AND "expiresAt" > NOW()
                    LIMIT 1
                `,
                z.object({
                    replacedBy: z.number().nullable(),
                    revokedAt: z.coerce.date().nullable(),
                }),
            );
            if (fallback?.replacedBy !== null && fallback?.replacedBy !== undefined) {
                // Row was just rotated by a concurrent peer — caller should return 409
                return { ok: false, reason: "locked" };
            }
            return { ok: false, reason: "not_found" };
        }

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
            return { ok: false, reason: "reuse" };
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

        return { ok: true, token: newToken };
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
