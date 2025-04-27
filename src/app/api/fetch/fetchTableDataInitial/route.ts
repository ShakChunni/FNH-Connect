import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Fetch the latest 150 reports based on ID
    const reports = await prisma.mavn_monthly_report.findMany({
      orderBy: {
        id: "desc",
      },
      take: 150,
    });

    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
