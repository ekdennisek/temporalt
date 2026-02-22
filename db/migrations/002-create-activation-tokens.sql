CREATE TABLE activation_tokens (
    "activationTokenId" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "userId"            BIGINT      NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
    "tokenHash"         TEXT        NOT NULL UNIQUE,
    "expiresAt"         TIMESTAMPTZ NOT NULL,
    "usedAt"            TIMESTAMPTZ,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activation_tokens_user_id ON activation_tokens ("userId");
