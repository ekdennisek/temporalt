CREATE TABLE users (
    "userId"       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "email"        TEXT NOT NULL,
    "emailLower"   TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "status"       TEXT NOT NULL DEFAULT 'pending'
                        CHECK ("status" IN ('pending', 'active', 'suspended')),
    "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
