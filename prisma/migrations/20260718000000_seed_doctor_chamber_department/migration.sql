-- Make the private chamber available as an individual dashboard cash filter
-- even before the first chamber visit is registered.
INSERT INTO "public"."Department" ("name", "description", "isActive")
VALUES (
    'Dr Sufia Khatun Chamber',
    'Private chamber visits for Dr Sufia Khatun',
    true
)
ON CONFLICT ("name") DO UPDATE
SET "isActive" = true;
