CREATE TABLE refresh_tokens (
    "refreshTokenId" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "userId"         BIGINT      NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
    "tokenHash"      TEXT        NOT NULL UNIQUE,
    "family"         UUID        NOT NULL,
    "issuedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expiresAt"      TIMESTAMPTZ NOT NULL,
    "revokedAt"      TIMESTAMPTZ,
    "replacedBy"     BIGINT      REFERENCES refresh_tokens("refreshTokenId")
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens ("userId");
CREATE INDEX idx_refresh_tokens_family  ON refresh_tokens ("family");
