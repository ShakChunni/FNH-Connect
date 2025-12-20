import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { shiftService } from "@/services/shiftService";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine staffId. The session user has staffId.
    const staffId = user.staffId;
    if (!staffId) {
      // Technically system admins might not have staffId if not linked, but for this app context they usually do.
      return NextResponse.json(
        { error: "No staff profile found" },
        { status: 400 }
      );
    }

    // Get the active shift to know system cash
    const activeShift = await prisma.shift.findFirst({
      where: {
        staffId: staffId,
        isActive: true,
      },
    });

    if (!activeShift) {
      return NextResponse.json({ message: "No active shift to end" });
    }

    // Check if body has data
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Empty body is fine
    }

    const { notes } = body as { notes?: string };

    // We default closing cash to system cash (perfect match)
    const closingCash = activeShift.systemCash.toNumber();

    await shiftService.closeActiveShift(
      staffId,
      closingCash,
      notes || "Shift ended via dashboard/logout"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("End shift error:", error);
    return NextResponse.json({ error: "Failed to end shift" }, { status: 500 });
  }
}
