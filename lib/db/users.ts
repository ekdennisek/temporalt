import sql from "sql-template-tag";
import { z } from "zod";
import { none, one, oneOrNone } from "../queries";

export const UserSchema = z.object({
    userId: z.number(),
    email: z.string(),
    emailLower: z.string(),
    passwordHash: z.string().nullable(),
    status: z.enum(["pending", "active", "suspended"]),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

export async function findUserByEmail(email: string): Promise<User | undefined> {
    return oneOrNone(
        sql`SELECT * FROM users WHERE "emailLower" = ${email.trim().toLowerCase()}`,
        UserSchema,
    );
}

export async function findUserById(userId: number): Promise<User | undefined> {
    return oneOrNone(sql`SELECT * FROM users WHERE "userId" = ${userId}`, UserSchema);
}

export async function createUser(opts: {
    email: string;
    passwordHash: string | null;
}): Promise<User> {
    const emailLower = opts.email.trim().toLowerCase();
    return one(
        sql`
            INSERT INTO users ("email", "emailLower", "passwordHash")
            VALUES (${opts.email}, ${emailLower}, ${opts.passwordHash})
            RETURNING *
        `,
        UserSchema,
    );
}

export async function activateUser(userId: number): Promise<void> {
    await none(
        sql`
            UPDATE users
            SET "status" = 'active', "updatedAt" = NOW()
            WHERE "userId" = ${userId}
        `,
    );
}

export async function updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
    await none(
        sql`
            UPDATE users
            SET "passwordHash" = ${passwordHash}, "updatedAt" = NOW()
            WHERE "userId" = ${userId}
        `,
    );
}
