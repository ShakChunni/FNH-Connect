import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const customOptions = await prisma.customOptions.findMany();
    return NextResponse.json(customOptions);
  } catch (error) {
    console.error("Error fetching custom options:", error);
    return NextResponse.json(
      { error: "Error fetching custom options" },
      { status: 500 }
    );
  }
}
