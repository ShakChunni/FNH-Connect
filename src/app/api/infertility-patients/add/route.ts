import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import type {
  AddInfertilityPatientRequest,
  AddInfertilityPatientResponse,
} from "@/types/infertility";

const SECRET_KEY = process.env.SECRET_KEY as string;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

// Utility function to generate patient display ID
function generatePatientDisplayId(patientId: number): string {
  return `INF-${String(patientId).padStart(6, "0")}`;
}

// Utility function for Bangladesh time
function getBangladeshTime(): Date {
  return new Date(new Date().getTime() + 6 * 60 * 60 * 1000);
}

// Utility function to normalize phone numbers
function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Handle Bangladesh numbers
  if (cleaned.startsWith("880")) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith("01") && cleaned.length === 11) {
    return `+880${cleaned}`;
  } else if (cleaned.length === 10) {
    return `+880${cleaned}`;
  }

  return phone; // Return original if can't normalize
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION & AUTHORIZATION
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(sessionToken, SECRET_KEY);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid session token" },
        { status: 401 }
      );
    }

    // 2. VALIDATE SESSION IN DATABASE
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: {
        id: true,
        userId: true,
        ipAddress: true,
        deviceFingerprint: true,
        readableFingerprint: true,
        browserName: true,
        browserVersion: true,
        deviceType: true,
        osType: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 401 }
      );
    }

    // 3. PARSE AND VALIDATE REQUEST DATA
    const requestData: AddInfertilityPatientRequest = await request.json();

    if (
      !requestData.patient?.firstName?.trim() ||
      !requestData.hospital?.name?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient name and hospital name are required",
        },
        { status: 400 }
      );
    }

    const bdTime = getBangladeshTime();

    // 4. ATOMIC TRANSACTION - ALL OR NOTHING
    const result = await prisma.$transaction(async (tx) => {
      let hospital;
      let patient;
      let infertilityRecord;

      // === HOSPITAL HANDLING ===
      if (requestData.hospital.id) {
        // Existing hospital - update if new data provided
        hospital = await tx.hospital.findUnique({
          where: { id: requestData.hospital.id },
        });

        if (!hospital) {
          throw new Error("Selected hospital not found");
        }

        // Update hospital with any new information provided
        const hospitalUpdateData: any = {};
        if (!hospital.address && requestData.hospital.address?.trim()) {
          hospitalUpdateData.address = requestData.hospital.address.trim();
        }
        if (!hospital.phoneNumber && requestData.hospital.phoneNumber?.trim()) {
          hospitalUpdateData.phoneNumber = normalizePhoneNumber(
            requestData.hospital.phoneNumber
          );
        }
        if (!hospital.email && requestData.hospital.email?.trim()) {
          hospitalUpdateData.email = requestData.hospital.email
            .trim()
            .toLowerCase();
        }
        if (!hospital.website && requestData.hospital.website?.trim()) {
          hospitalUpdateData.website = requestData.hospital.website.trim();
        }
        if (!hospital.type && requestData.hospital.type?.trim()) {
          hospitalUpdateData.type = requestData.hospital.type.trim();
        }

        if (Object.keys(hospitalUpdateData).length > 0) {
          hospitalUpdateData.updatedAt = bdTime;
          hospital = await tx.hospital.update({
            where: { id: requestData.hospital.id },
            data: hospitalUpdateData,
          });
        }
      } else {
        // New hospital - create it
        hospital = await tx.hospital.create({
          data: {
            name: requestData.hospital.name.trim(),
            address: requestData.hospital.address?.trim() || null,
            phoneNumber: requestData.hospital.phoneNumber
              ? normalizePhoneNumber(requestData.hospital.phoneNumber)
              : null,
            email: requestData.hospital.email?.trim().toLowerCase() || null,
            website: requestData.hospital.website?.trim() || null,
            type: requestData.hospital.type?.trim() || null,
            createdBy: decoded.staffId,
            createdAt: bdTime,
            updatedAt: bdTime,
          },
        });
      }

      // === PATIENT HANDLING ===
      if (requestData.patient.id) {
        // Existing patient - fetch and potentially update
        patient = await tx.patient.findUnique({
          where: { id: requestData.patient.id },
          include: { infertilityRecords: true },
        });

        if (!patient) {
          throw new Error("Selected patient not found");
        }

        // Check if patient already has infertility record at this hospital
        const existingInfertilityRecord = await tx.infertilityPatient.findFirst(
          {
            where: {
              patientId: patient.id,
              hospitalId: hospital.id,
            },
          }
        );

        if (existingInfertilityRecord) {
          throw new Error(
            `Patient ${patient.fullName} already has an infertility record at ${hospital.name}`
          );
        }

        // Update patient info if new data provided
        const patientUpdateData: any = {};
        if (!patient.address && requestData.patient.address?.trim()) {
          patientUpdateData.address = requestData.patient.address.trim();
        }
        if (!patient.phoneNumber && requestData.patient.phoneNumber?.trim()) {
          patientUpdateData.phoneNumber = normalizePhoneNumber(
            requestData.patient.phoneNumber
          );
        }
        if (!patient.email && requestData.patient.email?.trim()) {
          patientUpdateData.email = requestData.patient.email
            .trim()
            .toLowerCase();
        }
        if (!patient.bloodGroup && requestData.patient.bloodGroup?.trim()) {
          patientUpdateData.bloodGroup = requestData.patient.bloodGroup.trim();
        }
        if (!patient.guardianName && requestData.spouseInfo.name?.trim()) {
          patientUpdateData.guardianName = requestData.spouseInfo.name.trim();
        }
        // Update spouse information if not already set
        if (!patient.spouseAge && requestData.spouseInfo.age) {
          patientUpdateData.spouseAge = requestData.spouseInfo.age;
        }
        if (!patient.spouseDOB && requestData.spouseInfo.dateOfBirth) {
          patientUpdateData.spouseDOB = requestData.spouseInfo.dateOfBirth;
        }
        if (!patient.spouseGender && requestData.spouseInfo.gender?.trim()) {
          patientUpdateData.spouseGender = requestData.spouseInfo.gender.trim();
        }

        if (Object.keys(patientUpdateData).length > 0) {
          patientUpdateData.updatedAt = bdTime;
          patient = await tx.patient.update({
            where: { id: requestData.patient.id },
            data: patientUpdateData,
          });
        }
      } else {
        // New patient - check for duplicates first
        const normalizedPhone = requestData.patient.phoneNumber
          ? normalizePhoneNumber(requestData.patient.phoneNumber)
          : null;

        if (normalizedPhone) {
          const existingPatient = await tx.patient.findFirst({
            where: {
              phoneNumber: normalizedPhone,
            },
          });

          if (existingPatient) {
            throw new Error(
              `A patient with phone number ${normalizedPhone} already exists: ${existingPatient.fullName}`
            );
          }
        }

        // Create new patient
        const fullName = `${requestData.patient.firstName.trim()} ${
          requestData.patient.lastName?.trim() || ""
        }`.trim();

        patient = await tx.patient.create({
          data: {
            firstName: requestData.patient.firstName.trim(),
            lastName: requestData.patient.lastName?.trim() || null,
            fullName: fullName,
            gender: requestData.patient.gender,
            age: requestData.patient.age,
            dateOfBirth: requestData.patient.dateOfBirth,
            guardianName: requestData.spouseInfo.name?.trim() || null,
            spouseAge: requestData.spouseInfo.age,
            spouseDOB: requestData.spouseInfo.dateOfBirth,
            spouseGender: requestData.spouseInfo.gender?.trim() || null,
            address: requestData.patient.address?.trim() || null,
            phoneNumber: normalizedPhone,
            email: requestData.patient.email?.trim().toLowerCase() || null,
            bloodGroup: requestData.patient.bloodGroup?.trim() || null,
            createdBy: decoded.staffId,
            createdAt: bdTime,
            updatedAt: bdTime,
          },
        });
      }

      // === INFERTILITY RECORD CREATION ===
      infertilityRecord = await tx.infertilityPatient.create({
        data: {
          patientId: patient.id,
          hospitalId: hospital.id,
          yearsMarried: requestData.medicalInfo.yearsMarried,
          yearsTrying: requestData.medicalInfo.yearsTrying,
          infertilityType:
            requestData.medicalInfo.infertilityType?.trim() || null,
          para: requestData.medicalInfo.para?.trim() || null,
          gravida: requestData.medicalInfo.gravida?.trim() || null,
          weight: requestData.medicalInfo.weight,
          height: requestData.medicalInfo.height,
          bmi: requestData.medicalInfo.bmi,
          bloodPressure: requestData.medicalInfo.bloodPressure?.trim() || null,
          medicalHistory:
            requestData.medicalInfo.medicalHistory?.trim() || null,
          surgicalHistory:
            requestData.medicalInfo.surgicalHistory?.trim() || null,
          menstrualHistory:
            requestData.medicalInfo.menstrualHistory?.trim() || null,
          contraceptiveHistory:
            requestData.medicalInfo.contraceptiveHistory?.trim() || null,
          referralSource:
            requestData.medicalInfo.referralSource?.trim() || null,
          chiefComplaint:
            requestData.medicalInfo.chiefComplaint?.trim() || null,
          treatmentPlan: requestData.medicalInfo.treatmentPlan?.trim() || null,
          medications: requestData.medicalInfo.medications?.trim() || null,
          nextAppointment: requestData.medicalInfo.nextAppointment,
          status: requestData.medicalInfo.status || "Active",
          notes: requestData.medicalInfo.notes?.trim() || null,
          createdBy: decoded.staffId,
          createdAt: bdTime,
          updatedAt: bdTime,
        },
      });

      // === ACTIVITY LOGGING ===
      const displayId = generatePatientDisplayId(patient.id);
      const description = `Created infertility record for ${patient.fullName} (${displayId}) at ${hospital.name}`;

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "CREATE",
          entityType: "InfertilityPatient",
          entityId: infertilityRecord.id,
          description: description,
          sessionId: session.id,
          ipAddress: session.ipAddress,
          deviceFingerprint: session.deviceFingerprint,
          readableFingerprint: session.readableFingerprint,
          deviceType: session.deviceType,
          browserName: session.browserName,
          browserVersion: session.browserVersion,
          osType: session.osType,
          timestamp: bdTime,
        },
      });

      return {
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          isNew: !requestData.patient.id,
        },
        hospital: {
          id: hospital.id,
          name: hospital.name,
          isNew: !requestData.hospital.id,
        },
        infertilityRecord: {
          id: infertilityRecord.id,
        },
        displayId,
      };
    });

    // 5. SUCCESS RESPONSE
    const response: AddInfertilityPatientResponse = {
      success: true,
      data: result,
      message: `Infertility record created successfully for ${result.patient.fullName} at ${result.hospital.name}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Add infertility patient error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    const response: AddInfertilityPatientResponse = {
      success: false,
      error: errorMessage,
      message: "Failed to create infertility patient record",
    };

    // Return appropriate status code based on error type
    const status =
      errorMessage.includes("Authentication") ||
      errorMessage.includes("session")
        ? 401
        : errorMessage.includes("required") ||
          errorMessage.includes("already exists")
        ? 400
        : 500;

    return NextResponse.json(response, { status });
  }
}
