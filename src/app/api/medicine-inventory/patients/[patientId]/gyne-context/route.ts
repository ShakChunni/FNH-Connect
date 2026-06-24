/**
 * Medicine Inventory — Patient Gynecology Context API
 *
 * GET /api/medicine-inventory/patients/:patientId/gyne-context
 *
 * Returns the latest non-canceled Gynecology admission, including discharged
 * admissions, because LUCS is applied as a Medicine Inventory cart template
 * and does not modify the admission.
 * for the given central patient, plus a flag indicating whether a LUCS
 * admission package is already attached. Used by the multi-item sale
 * modal to enable the LUCS quick-fill action.
 *
 * Response shape: `{ data: GyneContext | null }` (null when there is no
 * eligible Gynecology admission — not a 404, to keep the modal simple).
 *
 * The endpoint never returns full admission financials; only the minimum
 * fields needed to display a context badge.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getPatientGyneContext } from "@/services/medicineInventoryService";
import { isGynecologyDepartment } from "@/lib/departmentRecognition";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ patientId: string }>;
}

const patientIdSchema = z.string().regex(/^\d+$/).transform(Number).pipe(
  z.number().int().positive(),
);

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { patientId } = await params;
    const validation = patientIdSchema.safeParse(patientId);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    const context = await getPatientGyneContext(validation.data);

    if (!context) {
      return NextResponse.json({ success: true, data: null });
    }

    if (!isGynecologyDepartment(context.departmentName)) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        admissionId: context.admissionId,
        admissionNumber: context.admissionNumber,
        status: context.status,
        dateAdmitted: context.dateAdmitted.toISOString(),
        departmentId: context.departmentId,
        departmentName: context.departmentName,
        hasLucsPackage: context.hasLucsPackage,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/medicine-inventory/patients/[patientId]/gyne-context error:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load patient gynecology context",
      },
      { status: 500 },
    );
  }
}
