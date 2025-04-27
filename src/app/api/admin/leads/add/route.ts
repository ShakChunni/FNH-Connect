import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { mappedData, userContext } = await req.json();

    if (!Array.isArray(mappedData) || mappedData.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid data provided" },
        { status: 400 }
      );
    }

    if (!userContext?.username) {
      return NextResponse.json(
        { success: false, message: "User context required" },
        { status: 400 }
      );
    }

    // Get user information based on username
    const user = await prisma.user.findUnique({
      where: { username: userContext.username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Create upload batch record
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the batch record
      const batch = await tx.contactUploadBatch.create({
        data: {
          fileName: `Bulk import ${new Date().toISOString()}`,
          uploadedBy: user.id,
          recordCount: mappedData.length,
        },
      });

      // 2. Prepare contact data for insertion
      const contactsToCreate = mappedData.map((contact) => {
        // Extract fields from mappedData with type safety
        const {
          organization,
          client_name,
          client_position,
          client_email,
          client_Quality,
          client_otherEmail,
          client_phone,
          client_otherPhone,
          client_linkedinUrl,
          industry,
          address,
          status,
          notes,
        } = contact;

        // Convert date strings to Date objects or set to null
        const contactDate = contact.contactDate
          ? new Date(contact.contactDate)
          : null;
        const followUpDate = contact.followUpDate
          ? new Date(contact.followUpDate)
          : null;

        return {
          organization: organization || "Unknown Organization",
          client_name,
          client_position,
          client_email,
          client_Quality,
          client_otherEmail,
          client_phone,
          client_otherPhone,
          client_linkedinUrl,
          industry,
          address,
          status,
          notes,
          contactDate,
          followUpDate,
          uploadBatchId: batch.id,
          uploadedBy: user.id,
          modifiedBy: user.id,
          isActive: true,
          // Default organization assignment if user belongs to one
          assignedOrg:
            user.organizations?.length > 0 ? user.organizations[0] : null,
        };
      });

      // 3. Insert all contacts in a bulk operation
      const createdContacts = await tx.contactData.createMany({
        data: contactsToCreate,
        skipDuplicates: false, // Set to true if you want to skip duplicates
      });

      return {
        batch,
        createdCount: createdContacts.count,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.createdCount} contacts`,
      data: {
        batchId: result.batch.id,
        importedCount: result.createdCount,
        totalRecords: mappedData.length,
      },
    });
  } catch (error) {
    console.error("Error importing contacts:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during import";

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
