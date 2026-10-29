import { authorizeAPIRequest } from "@/lib/apiAuthorization";
import { patientRecordsQuerySchema } from "@/lib/securityInputs";
/**
 * Patient Records API Route
 * GET /api/patient-records
 *
 * Returns all patients with optional search filtering and pagination
 */

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { isReceptionistRole, isReceptionistInfertilityRole, isPharmacistRole } from "@/lib/roles";
import { serializeDateOfBirth } from "@/lib/dateOfBirth";

function getPatientAccessWhereByRole(userRole: string, portal?: string) {
  if (portal === "infertility" || isReceptionistInfertilityRole(userRole)) {
    return {
      infertilityRecords: {
        some: {},
      },
    };
  }

  if (isReceptionistRole(userRole)) {
    return {
      infertilityRecords: {
        none: {},
      },
    };
  }

  return {};
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUserForAPI();
    const authorizationError = await authorizeAPIRequest(user, "/api/patient-records", "GET");
    if (authorizationError) return authorizationError;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url);
    const validation = patientRecordsQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid query parameters", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { search, startDate, endDate, page, limit } = validation.data;
    const gyneOnly = validation.data.gyneOnly === "true";
    const dischargedOnly = validation.data.dischargedOnly === "true";
    const infertilityOnly = validation.data.infertilityOnly === "true";

    // 3. Build where clause
    const where: Record<string, unknown> = {};

    Object.assign(where, getPatientAccessWhereByRole(user.role, user.portal));

    // Infertility portal Patient Records: restrict to patients that have
    // infertility records. Combined via AND so it can only *narrow* the
    // role-based scope, never widen it (a role restricted to non-infertility
    // patients still cannot see infertility patients by passing this flag).
    if (infertilityOnly) {
      const existingAnd = Array.isArray(where.AND)
        ? (where.AND as Prisma.PatientWhereInput[])
        : [];
      where.AND = [...existingAnd, { infertilityRecords: { some: {} } }];
    }

    const normalizedSearch = search?.trim() ?? "";

    const admissionEligibilityWhere: Prisma.AdmissionWhereInput = {};

    if (gyneOnly) {
      admissionEligibilityWhere.department = {
        OR: [
          { name: { contains: "gyn", mode: "insensitive" } },
          { name: { contains: "obstet", mode: "insensitive" } },
        ],
      };

      admissionEligibilityWhere.status = { not: "Canceled" };
    }

    if (dischargedOnly) {
      admissionEligibilityWhere.isDischarged = true;
    }

    if (gyneOnly || dischargedOnly) {
      where.admissions = {
        some: admissionEligibilityWhere,
      };
    }

    if (normalizedSearch.length >= 2) {
      where.OR = [
        { fullName: { contains: normalizedSearch, mode: "insensitive" } },
        { phoneNumber: { contains: normalizedSearch, mode: "insensitive" } },
        { guardianName: { contains: normalizedSearch, mode: "insensitive" } },
        { address: { contains: normalizedSearch, mode: "insensitive" } },
        {
          admissions: {
            some: {
              admissionNumber: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    // 4. Pagination calculations
    const skip = (page - 1) * limit;

    // 5. Fetch patients with count in parallel
    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          gender: true,
          dateOfBirth: true,
          guardianName: true,
          guardianDOB: true,
          guardianGender: true,
          guardianPhone: true,
          guardianAddress: true,
          guardianEmail: true,
          address: true,
          phoneNumber: true,
          email: true,
          bloodGroup: true,
          occupation: true,
          guardianOccupation: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          admissions: {
            where:
              gyneOnly || dischargedOnly
                ? admissionEligibilityWhere
                : {
                    admissionNumber: {
                      contains: normalizedSearch,
                      mode: "insensitive",
                    },
                  },
            select: {
              id: true,
              admissionNumber: true,
            },
            orderBy: {
              dateAdmitted: "desc",
            },
            take: 1,
          },
        },
      }),
    ]);

    if (isPharmacistRole(user.role)) {
      return NextResponse.json({
        success: true,
        data: patients.map(({ id, fullName, phoneNumber, gender, guardianName, address, email, admissions }) => ({
          id, fullName, phoneNumber, gender, guardianName, address, email, admissions,
        })),
        total,
        pagination: { page, limit, totalPages: Math.ceil(total / limit) },
      });
    }

    const patientIds = patients.map((patient) => patient.id);
    const creatorIds = Array.from(
      new Set(patients.map((patient) => patient.createdBy).filter(Boolean)),
    );

    const [creatorStaff, latestUpdateLogs] = await Promise.all([
      creatorIds.length
        ? prisma.staff.findMany({
            where: { id: { in: creatorIds } },
            select: { id: true, fullName: true },
          })
        : [],
      patientIds.length
        ? prisma.activityLog.findMany({
            where: {
              entityType: "Patient",
              action: "UPDATE",
              entityId: { in: patientIds },
            },
            orderBy: { timestamp: "desc" },
            select: {
              entityId: true,
              timestamp: true,
              user: {
                select: {
                  staff: {
                    select: { fullName: true },
                  },
                },
              },
            },
          })
        : [],
    ]);

    const creatorNameMap = new Map(
      creatorStaff.map((staff) => [staff.id, staff.fullName]),
    );
    const latestUpdateMap = new Map<
      number,
      { lastEditedAt: Date; lastEditedByName: string | null }
    >();

    for (const log of latestUpdateLogs) {
      if (log.entityId == null || latestUpdateMap.has(log.entityId)) {
        continue;
      }

      latestUpdateMap.set(log.entityId, {
        lastEditedAt: log.timestamp,
        lastEditedByName: log.user?.staff?.fullName || null,
      });
    }

    const enrichedPatients = patients.map((patient) => {
      const latestUpdate = latestUpdateMap.get(patient.id);

      return {
        ...patient,
        dateOfBirth: serializeDateOfBirth(patient.dateOfBirth),
        guardianDOB: serializeDateOfBirth(patient.guardianDOB),
        createdByName: creatorNameMap.get(patient.createdBy) || null,
        lastEditedByName: latestUpdate?.lastEditedByName || null,
        lastEditedAt: latestUpdate?.lastEditedAt || null,
      };
    });

    const totalPages = Math.ceil(total / limit);

    // 6. Return response
    return NextResponse.json({
      success: true,
      data: enrichedPatients,
      total,
      pagination: {
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[Patient Records API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
      { status: 500 },
    );
  }
}
