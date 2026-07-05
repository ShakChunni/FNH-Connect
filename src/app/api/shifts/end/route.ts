import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import { closeActiveStaffCashShifts } from "@/services/staffShiftClosureService";

const endShiftBodySchema = z
  .object({
    notes: z.string().trim().max(500).optional(),
    logoutAllDevices: z.boolean().optional(),
  })
  .strict();

type EndShiftBody = z.infer<typeof endShiftBodySchema>;

type ParsedEndShiftBody =
  | { success: true; data: EndShiftBody }
  | { success: false; error: string };

async function parseEndShiftBody(req: NextRequest): Promise<ParsedEndShiftBody> {
  let rawBody: unknown = {};

  try {
    rawBody = await req.json();
  } catch {
    return { success: true, data: {} };
  }

  const parsed = endShiftBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid request body",
    };
  }

  return { success: true, data: parsed.data };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine staffId. The session user has staffId.
    const staffId = user.staffId;
    if (!staffId) {
      return NextResponse.json(
        { error: "No staff profile found" },
        { status: 400 }
      );
    }

    const parsedBody = await parseEndShiftBody(req);

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const { notes, logoutAllDevices = true } = parsedBody.data;
    const endedAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const closedShifts = await closeActiveStaffCashShifts({
        tx,
        staffId,
        endedAt,
        generalNotes: notes || "Shift ended via dashboard/logout",
        infertilityNotes:
          notes || "HSI Center shift ended via linked dashboard/logout",
      });

      let sessionCount = 0;
      if (logoutAllDevices) {
        sessionCount = await tx.session.count({
          where: { userId: user.id },
        });

        const closedShiftLabels = [
          closedShifts.generalShiftId
            ? `general shift #${closedShifts.generalShiftId}`
            : null,
          closedShifts.infertilityShiftId
            ? `HSI Center shift #${closedShifts.infertilityShiftId}`
            : null,
        ].filter((label): label is string => label !== null);

        const closedShiftDescription =
          closedShiftLabels.length > 0
            ? `${closedShiftLabels.join(" and ")} ended`
            : "No active cash shift was open";

        await tx.activityLog.create({
          data: {
            userId: user.id,
            action: "SHIFT_END_ALL_DEVICES",
            description: `${closedShiftDescription}; ${sessionCount} session(s) invalidated across all devices`,
            entityType: closedShifts.generalShiftId
              ? "Shift"
              : closedShifts.infertilityShiftId
                ? "InfertilityShift"
                : "Session",
            entityId:
              closedShifts.generalShiftId ?? closedShifts.infertilityShiftId,
            timestamp: endedAt,
            sessionId: user.sessionId,
            ipAddress: user.sessionDeviceInfo.ipAddress,
            deviceFingerprint: user.sessionDeviceInfo.deviceFingerprint,
            readableFingerprint: user.sessionDeviceInfo.readableFingerprint,
            deviceType: user.sessionDeviceInfo.deviceType,
            browserName: user.sessionDeviceInfo.browserName,
            browserVersion: user.sessionDeviceInfo.browserVersion,
            osType: user.sessionDeviceInfo.osType,
          },
        });

        await tx.session.deleteMany({
          where: { userId: user.id },
        });
      }

      return {
        closedShifts,
      };
    });

    if (result.closedShifts.closedCount === 0 && !logoutAllDevices) {
      return NextResponse.json({ message: "No active shift to end" });
    }

    // Create response and clear the session cookie
    const response = NextResponse.json({
      success: true,
      allDevicesLoggedOut: logoutAllDevices,
      closedGeneralShiftId: result.closedShifts.generalShiftId,
      closedInfertilityShiftId: result.closedShifts.infertilityShiftId,
    });

    // Clear session cookie
    response.cookies.set({
      name: "session",
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    response.cookies.set({
      name: "portal",
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("End shift error:", error);
    return NextResponse.json({ error: "Failed to end shift" }, { status: 500 });
  }
}
