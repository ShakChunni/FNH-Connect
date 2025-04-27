import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    const {
      // User context
      currentUsername,
      currentRole,
      manages = [],
      organizations = [],

      // Filters
      status,
      owner,
      assignedOrg,
      dateFrom,
      dateTo,
      searchTerm,
    } = requestData;

    // Base query conditions
    const whereConditions: any = {};

    // Apply filters if provided
    if (status) {
      whereConditions.status = status;
    }

    if (owner) {
      whereConditions.owner = {
        username: owner,
      };
    }

    if (assignedOrg) {
      whereConditions.assignedOrg = assignedOrg;
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      whereConditions.uploadedAt = {};

      if (dateFrom) {
        whereConditions.uploadedAt.gte = new Date(dateFrom);
      }

      if (dateTo) {
        whereConditions.uploadedAt.lte = new Date(dateTo);
      }
    }

    // Search term filtering (if provided)
    if (searchTerm) {
      whereConditions.OR = [
        { organization: { contains: searchTerm, mode: "insensitive" } },
        { client_name: { contains: searchTerm, mode: "insensitive" } },
        { client_email: { contains: searchTerm, mode: "insensitive" } },
        { client_phone: { contains: searchTerm, mode: "insensitive" } },
        { industry: { contains: searchTerm, mode: "insensitive" } },
        { client_position: { contains: searchTerm, mode: "insensitive" } },
        { status: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Role-based access control
    if (currentRole !== "admin") {
      // For non-admin users, limit to their contacts or contacts they manage
      whereConditions.OR = [
        { ownerId: { equals: currentUsername } },
        { assignedOrg: { in: organizations } },
      ];

      // If they're a manager, include contacts of users they manage
      if (manages && manages.length > 0) {
        whereConditions.OR.push({ owner: { username: { in: manages } } });
      }
    }

    // Fetch contacts with owner data included
    const contacts = await prisma.contactData.findMany({
      where: whereConditions,
      include: {
        owner: {
          select: {
            username: true,
            fullName: true,
          },
        },
        uploader: {
          select: {
            username: true,
          },
        },
        modifier: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        id: "desc", // Most recent first
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching prospecting contacts:", error);
    return NextResponse.json(
      { error: "Error fetching prospecting contacts" },
      { status: 500 }
    );
  }
}
