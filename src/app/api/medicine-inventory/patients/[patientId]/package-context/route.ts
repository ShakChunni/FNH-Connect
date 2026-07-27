import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getPatientPackageContext } from "@/services/medicineInventoryService";

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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { patientId } = await params;
    const validation = patientIdSchema.safeParse(patientId);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid patient ID" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { admissions: await getPatientPackageContext(validation.data) },
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/patients/[patientId]/package-context error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load patient package context" },
      { status: 500 },
    );
  }
}
