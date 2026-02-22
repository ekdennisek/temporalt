CREATE TABLE passkeys (
    "passkeyId"           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "userId"              BIGINT  NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
    "credentialId"        BYTEA   NOT NULL UNIQUE,
    "credentialPublicKey" BYTEA   NOT NULL,
    "counter"             BIGINT  NOT NULL DEFAULT 0,
    "aaguid"              TEXT,
    "deviceType"          TEXT,
    "backedUp"            BOOLEAN NOT NULL DEFAULT FALSE,
    "transports"          TEXT[]  DEFAULT '{}',
    "name"                TEXT,
    "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "lastUsedAt"          TIMESTAMPTZ
);

CREATE INDEX idx_passkeys_user_id ON passkeys ("userId");
