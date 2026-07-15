-- Non-destructive audit repair.
-- The old status endpoint updated isCompleted/reportDate but did not update
-- PathologyTest.lastModifiedBy. Use the recorded status activity actor only
-- when that activity is the update that produced the current updatedAt value.
WITH latest_status_activity AS (
  SELECT DISTINCT ON (activity."entityId")
    activity."entityId" AS pathology_test_id,
    staff."staffId" AS staff_id,
    activity."timestamp" AS activity_timestamp
  FROM "public"."ActivityLog" AS activity
  INNER JOIN "public"."User" AS staff
    ON staff."id" = activity."userId"
  WHERE activity."entityType" = 'PathologyTest'
    AND activity."description" LIKE 'Marked pathology test %'
  ORDER BY activity."entityId", activity."timestamp" DESC, activity."id" DESC
)
UPDATE "public"."PathologyTest" AS pathology
SET "lastModifiedBy" = status_activity.staff_id
FROM latest_status_activity AS status_activity
WHERE pathology."id" = status_activity.pathology_test_id
  AND status_activity.activity_timestamp BETWEEN
    pathology."updatedAt" - INTERVAL '1 second'
    AND pathology."updatedAt" + INTERVAL '1 second'
  AND pathology."lastModifiedBy" <> status_activity.staff_id;
