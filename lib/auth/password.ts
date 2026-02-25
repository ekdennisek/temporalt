import argon2 from "argon2";

const OPTIONS = { type: argon2.argon2id } as const;

// Computed once at module load. Used to perform a verify() even when the user
// is not found, so the response time doesn't reveal whether an email is registered.
const DUMMY_HASH_PROMISE = argon2.hash("dummy", OPTIONS);

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password, OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
}

/**
 * Timing-safe credential check. Always runs argon2.verify() regardless of
 * whether the user was found, preventing email enumeration via timing attacks.
 *
 * Returns true only when a real hash was provided AND it matches the password.
 */
export async function checkPassword(
    storedHash: string | null | undefined,
    password: string,
): Promise<boolean> {
    const hash = storedHash ?? (await DUMMY_HASH_PROMISE);
    const valid = await argon2.verify(hash, password);
    return valid && storedHash != null;
}
