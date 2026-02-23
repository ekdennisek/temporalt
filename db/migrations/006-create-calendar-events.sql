CREATE TABLE calendar_events (
  "eventId"   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId"    BIGINT NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
  "type"      TEXT NOT NULL DEFAULT 'event',
  "title"     TEXT NOT NULL,
  "date"      DATE NOT NULL,
  "startTime" TIME,
  "endTime"   TIME,
  "notes"     TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON calendar_events ("userId", "date");
