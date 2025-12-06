import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import type { VerifySessionResponse } from "@/types/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();

    if (!user) {
      return NextResponse.json<VerifySessionResponse>(
        {
          success: false,
          valid: false,
          error: "No active session",
        },
        { status: 401 }
      );
    }

    return NextResponse.json<VerifySessionResponse>(
      {
        success: true,
        valid: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Session verification failed";

    console.error("Session verification error:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json<VerifySessionResponse>(
      {
        success: false,
        valid: false,
        error: message,
      },
      { status: 401 }
    );
  }
}
