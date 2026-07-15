-- Non-destructive audit metadata repair for Pathology, General Admission,
-- and HSI Center/Infertility.
--
-- These statements never change patient, test, admission, payment, or charge
-- data. They only repair the staff metadata shown by "last edited by" when
-- the corresponding activity log identifies the actor at the same update.

WITH latest_update_activity AS (
  SELECT DISTINCT ON (activity."entityType", activity."entityId")
    activity."entityType" AS entity_type,
    activity."entityId" AS entity_id,
    staff."staffId" AS staff_id,
    activity."timestamp" AS activity_timestamp
  FROM "public"."ActivityLog" AS activity
  INNER JOIN "public"."User" AS staff
    ON staff."id" = activity."userId"
  WHERE activity."entityId" IS NOT NULL
    AND (
      (activity."entityType" = 'PathologyTest'
        AND (
          (activity."action" = 'UPDATE'
            AND activity."description" LIKE 'Updated pathology test %')
          OR activity."description" LIKE 'Marked pathology test %'
        ))
      OR (activity."entityType" = 'Admission'
        AND activity."action" = 'UPDATE'
        AND activity."description" LIKE 'Updated admission %')
      OR (activity."entityType" = 'InfertilityPatient'
        AND activity."action" = 'UPDATE'
        AND activity."description" LIKE 'Updated HSI Center patient %')
      OR (activity."entityType" = 'InfertilityTest'
        AND activity."action" = 'UPDATE'
        AND activity."description" LIKE 'Updated infertility test %')
    )
  ORDER BY
    activity."entityType",
    activity."entityId",
    activity."timestamp" DESC,
    activity."id" DESC
)
UPDATE "public"."PathologyTest" AS pathology
SET "lastModifiedBy" = activity.staff_id
FROM latest_update_activity AS activity
WHERE activity.entity_type = 'PathologyTest'
  AND pathology."id" = activity.entity_id
  AND activity.activity_timestamp BETWEEN
    pathology."updatedAt" - INTERVAL '2 seconds'
    AND pathology."updatedAt" + INTERVAL '2 seconds'
  AND pathology."lastModifiedBy" <> activity.staff_id;

WITH latest_update_activity AS (
  SELECT DISTINCT ON (activity."entityId")
    activity."entityId" AS admission_id,
    staff."staffId" AS staff_id,
    activity."timestamp" AS activity_timestamp
  FROM "public"."ActivityLog" AS activity
  INNER JOIN "public"."User" AS staff
    ON staff."id" = activity."userId"
  WHERE activity."entityType" = 'Admission'
    AND activity."action" = 'UPDATE'
    AND activity."description" LIKE 'Updated admission %'
  ORDER BY activity."entityId", activity."timestamp" DESC, activity."id" DESC
)
UPDATE "public"."Admission" AS admission
SET "lastModifiedBy" = activity.staff_id
FROM latest_update_activity AS activity
WHERE admission."id" = activity.admission_id
  AND activity.activity_timestamp BETWEEN
    admission."updatedAt" - INTERVAL '2 seconds'
    AND admission."updatedAt" + INTERVAL '2 seconds'
  AND admission."lastModifiedBy" <> activity.staff_id;

WITH latest_update_activity AS (
  SELECT DISTINCT ON (activity."entityId")
    activity."entityId" AS infertility_patient_id,
    staff."staffId" AS staff_id,
    activity."timestamp" AS activity_timestamp
  FROM "public"."ActivityLog" AS activity
  INNER JOIN "public"."User" AS staff
    ON staff."id" = activity."userId"
  WHERE activity."entityType" = 'InfertilityPatient'
    AND activity."action" = 'UPDATE'
    AND activity."description" LIKE 'Updated HSI Center patient %'
  ORDER BY activity."entityId", activity."timestamp" DESC, activity."id" DESC
)
UPDATE "public"."InfertilityPatient" AS infertility_patient
SET "lastModifiedBy" = activity.staff_id
FROM latest_update_activity AS activity
WHERE infertility_patient."id" = activity.infertility_patient_id
  AND activity.activity_timestamp BETWEEN
    infertility_patient."updatedAt" - INTERVAL '2 seconds'
    AND infertility_patient."updatedAt" + INTERVAL '2 seconds'
  AND infertility_patient."lastModifiedBy" IS DISTINCT FROM activity.staff_id;

WITH latest_update_activity AS (
  SELECT DISTINCT ON (activity."entityId")
    activity."entityId" AS infertility_test_id,
    staff."staffId" AS staff_id,
    activity."timestamp" AS activity_timestamp
  FROM "public"."ActivityLog" AS activity
  INNER JOIN "public"."User" AS staff
    ON staff."id" = activity."userId"
  WHERE activity."entityType" = 'InfertilityTest'
    AND activity."action" = 'UPDATE'
    AND activity."description" LIKE 'Updated infertility test %'
  ORDER BY activity."entityId", activity."timestamp" DESC, activity."id" DESC
)
UPDATE "public"."InfertilityTest" AS infertility_test
SET "lastModifiedBy" = activity.staff_id
FROM latest_update_activity AS activity
WHERE infertility_test."id" = activity.infertility_test_id
  AND activity.activity_timestamp BETWEEN
    infertility_test."updatedAt" - INTERVAL '2 seconds'
    AND infertility_test."updatedAt" + INTERVAL '2 seconds'
  AND infertility_test."lastModifiedBy" <> activity.staff_id;

-- Older HSI Center cases were created before lastModifiedBy was populated.
-- The creator is the only proven actor for these untouched rows, so this
-- fills only NULL metadata and leaves all business data unchanged.
UPDATE "public"."InfertilityPatient"
SET "lastModifiedBy" = "createdBy"
WHERE "lastModifiedBy" IS NULL;
