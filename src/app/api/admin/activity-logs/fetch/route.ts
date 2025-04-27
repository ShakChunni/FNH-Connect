import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    page = 1,
    pageSize = 50,
    activityTypes = [],
    searchQuery = "",
    startDate = null,
    endDate = null,
    dateOption = [],
    currentTime = null,
  } = body;

  try {
    // Validate pagination parameters
    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize)));
    const skip = (pageNum - 1) * pageSizeNum;

    const where: any = {};

    // Handle activity type filtering
    if (activityTypes.length > 0) {
      where.action = {
        in: activityTypes,
        mode: "insensitive",
      };
    }

    // Handle date range filtering - improved similar to goals-analytics
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Add one day to end date to include the entire end date (up to 23:59:59)
      end.setDate(end.getDate() + 1);
      where.timestamp = {
        gte: start,
        lt: end, // Using lt instead of lte to exclude the start of the next day
      };
    } else if (dateOption.length > 0) {
      const now = currentTime ? new Date(currentTime) : new Date();
      let dateFilter: { gte?: Date; lte?: Date } = {};

      if (dateOption.includes("today")) {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter = {
          gte: startOfDay,
          lte: now,
        };
      } else if (dateOption.includes("last7days")) {
        const last7Days = new Date(now);
        last7Days.setDate(now.getDate() - 7);
        dateFilter = {
          gte: last7Days,
          lte: now,
        };
      } else if (dateOption.includes("last30days")) {
        const last30Days = new Date(now);
        last30Days.setDate(now.getDate() - 30);
        dateFilter = {
          gte: last30Days,
          lte: now,
        };
      } else if (dateOption.includes("last90days")) {
        const last90Days = new Date(now);
        last90Days.setDate(now.getDate() - 90);
        dateFilter = {
          gte: last90Days,
          lte: now,
        };
      }

      if (Object.keys(dateFilter).length > 0) {
        where.timestamp = dateFilter;
      }
    }

    // Handle search query
    if (searchQuery) {
      where.OR = [
        { username: { contains: searchQuery, mode: "insensitive" } },
        { action: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { ip_address: { contains: searchQuery, mode: "insensitive" } },
        { device_type: { contains: searchQuery, mode: "insensitive" } },
        // Add search capability for new fields
        { browser_name: { contains: searchQuery, mode: "insensitive" } },
        { browser_version: { contains: searchQuery, mode: "insensitive" } },
        { os_name: { contains: searchQuery, mode: "insensitive" } },
        { os_version: { contains: searchQuery, mode: "insensitive" } },
        { device_vendor: { contains: searchQuery, mode: "insensitive" } },
        { device_model: { contains: searchQuery, mode: "insensitive" } },
        { device_type_spec: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Fetch data with pagination and total count - use Promise.all for parallel execution
    const [activityLogs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: {
          timestamp: "desc",
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSizeNum);

    return NextResponse.json({
      data: activityLogs,
      total,
      currentPage: pageNum,
      totalPages,
      pageSize: pageSizeNum,
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      {
        error: "Error fetching activity logs",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
