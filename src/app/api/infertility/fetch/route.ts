import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface FilterState {
  dateSelector: {
    start: string | null;
    end: string | null;
  };
}

interface SearchParams {
  searchTerm: string;
  searchField: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      filters,
      searchParams,
    }: { filters: FilterState; searchParams?: SearchParams } = body;

    let whereClause: Prisma.InfertilityPatientWhereInput = {};

    // Date filtering
    if (filters.dateSelector.start || filters.dateSelector.end) {
      const dateFilter: Prisma.DateTimeFilter = {};

      if (filters.dateSelector.start) {
        dateFilter.gte = new Date(filters.dateSelector.start);
      }

      if (filters.dateSelector.end) {
        const endDate = new Date(filters.dateSelector.end);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day
        dateFilter.lte = endDate;
      }

      whereClause.createdAt = dateFilter;
    }

    // Search filtering
    if (searchParams && searchParams.searchTerm) {
      const searchTerm = searchParams.searchTerm.toLowerCase();

      switch (searchParams.searchField) {
        case "patientName":
          whereClause.patientFullName = {
            contains: searchTerm,
            mode: "insensitive",
          };
          break;
        case "husbandName":
          whereClause.husbandName = {
            contains: searchTerm,
            mode: "insensitive",
          };
          break;
        case "mobileNumber":
          whereClause.mobileNumber = {
            contains: searchTerm,
            mode: "insensitive",
          };
          break;
        case "hospitalName":
          whereClause.hospitalName = {
            contains: searchTerm,
            mode: "insensitive",
          };
          break;
        case "infertilityType":
          whereClause.infertilityType = {
            contains: searchTerm,
            mode: "insensitive",
          };
          break;
        default:
          // Global search across multiple fields
          whereClause.OR = [
            {
              patientFullName: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              husbandName: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              mobileNumber: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              hospitalName: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ];
      }
    }

    // Fetch the main data
    const patients = await prisma.infertilityPatient.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get unique values for dropdown options
    const [uniqueInfertilityTypes, uniqueHospitals, totalCount] =
      await Promise.all([
        prisma.infertilityPatient.findMany({
          select: { infertilityType: true },
          where: { infertilityType: { not: null } },
          distinct: ["infertilityType"],
        }),
        prisma.infertilityPatient.findMany({
          select: { hospitalName: true },
          where: { hospitalName: { not: null } },
          distinct: ["hospitalName"],
        }),
        prisma.infertilityPatient.count({ where: whereClause }),
      ]);

    const customOptions = {
      infertilityTypes: uniqueInfertilityTypes
        .map((item) => item.infertilityType)
        .filter(Boolean)
        .sort(),
      hospitals: uniqueHospitals
        .map((item) => item.hospitalName)
        .filter(Boolean)
        .sort(),
      totalCount,
    };

    return NextResponse.json({
      data: patients,
      customOptions,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching infertility patients:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch infertility patients",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  }
}
