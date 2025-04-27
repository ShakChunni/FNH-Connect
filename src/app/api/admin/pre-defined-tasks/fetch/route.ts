import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const tasks = await prisma.goalTask.findMany({
      where: {
        isTemplate: true,
      },
      select: {
        id: true,
        sortOrder: true,
        name: true,
        type: true,
        isActive: true,
        measurementType: true, // Include measurementType
        targetType: true, // Include targetType
        taskAssignments: {
          where: {
            isActive: true,
          },
          select: {
            targetQuantity: true,
            targetTime: true,
            userId: true,
            isDailyReset: true,
            isWeeklyReset: true,
            startDate: true,
            endDate: true,
            isContinuous: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("API Route: Error fetching pre-defined tasks:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching pre-defined tasks." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filters } = body;

    const whereClause: any = {
      isTemplate: true,
    };

    if (filters?.type) {
      whereClause.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters?.search) {
      whereClause.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    const tasks = await prisma.goalTask.findMany({
      where: whereClause,
      select: {
        id: true,
        sortOrder: true,
        name: true,
        type: true,
        isActive: true,
        measurementType: true, // Include measurementType
        targetType: true, // Include targetType
        taskAssignments: {
          where: {
            isActive: true,
          },
          select: {
            targetQuantity: true,
            targetTime: true,
            userId: true,
            isDailyReset: true,
            isWeeklyReset: true,
            startDate: true,
            endDate: true,
            isContinuous: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("API Route: Error searching pre-defined tasks:", error);
    return NextResponse.json(
      { error: "An error occurred while searching pre-defined tasks." },
      { status: 500 }
    );
  }
}
