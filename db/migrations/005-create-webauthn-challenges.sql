CREATE TABLE webauthn_challenges (
    "webauthnChallengeId" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "challenge"           TEXT        NOT NULL UNIQUE,
    "userId"              BIGINT      REFERENCES users("userId") ON DELETE CASCADE,
    "purpose"             TEXT        NOT NULL CHECK ("purpose" IN ('registration', 'authentication')),
    "expiresAt"           TIMESTAMPTZ NOT NULL,
    "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webauthn_challenges_expires_at ON webauthn_challenges ("expiresAt");
