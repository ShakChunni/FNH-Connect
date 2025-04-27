import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0", 10);
  const sourceTable = searchParams.get("sourceTable");
  const isDeleted = searchParams.get("isDeleted") === "true";

  if (!id || !sourceTable) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    let dataPromise;

    if (isDeleted) {
      dataPromise = prisma.deletedData.findFirst({
        where: { old_id: id, source_table: sourceTable },
      });
    } else {
      if (sourceTable === "MI") {
        dataPromise = prisma.mi_monthly_report.findUnique({
          where: { id },
        });
      } else if (sourceTable === "MAVN") {
        dataPromise = prisma.mavn_monthly_report.findUnique({
          where: { id },
        });
      } else {
        return NextResponse.json(
          { message: "Invalid sourceTable" },
          { status: 400 }
        );
      }
    }

    const data = await dataPromise;

    if (!data) {
      return NextResponse.json({ message: "Data not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching overview data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
