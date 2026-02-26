ALTER TABLE calendar_events
  ADD COLUMN "birthMonth" SMALLINT,
  ADD COLUMN "birthDay"   SMALLINT,
  ADD COLUMN "birthYear"  SMALLINT;

CREATE INDEX ON calendar_events ("userId", "birthMonth")
  WHERE "type" = 'birthday';

ALTER TABLE calendar_events
  ADD CONSTRAINT birthday_fields_check CHECK (
    ("type" = 'birthday' AND "birthMonth" IS NOT NULL AND "birthDay" IS NOT NULL)
    OR
    ("type" <> 'birthday' AND "birthMonth" IS NULL AND "birthDay" IS NULL AND "birthYear" IS NULL)
  );
