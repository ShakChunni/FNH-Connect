import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const {
    organizationId,
    organizationName,
    campaignName,
    organizationWebsite,
    organizationLocation,
    industryName,
    clientId,
    clientName,
    clientPosition,
    clientPhone,
    clientEmail,
    leadSource,
    pic,
    meetingsConducted,
    proposalSent,
    proposalInProgress,
    prospectDate,
    meetingDate,
    proposalSentDate,
    proposalInProgressDate,
    proposalSigned,
    proposalSignedDate,
    proposedValue,
    closedSale,
    sourceTable,
    quotationNumber,
    type,
    notes,
    username,
    userId,
  } = await req.json();

  try {
    const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

    function toDateOnly(
      dateInput: string | Date | null | undefined
    ): Date | null {
      if (!dateInput) return null;
      if (typeof dateInput === "string")
        return new Date(dateInput + "T00:00:00Z");
      if (dateInput instanceof Date)
        return new Date(
          Date.UTC(
            dateInput.getFullYear(),
            dateInput.getMonth(),
            dateInput.getDate()
          )
        );
      return null;
    }

    // --- ORGANIZATION LOGIC ---
    let organization;
    if (organizationId) {
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (!organization) throw new Error("Selected organization not found");

      const updateData: any = {};
      if (
        organization.website === null &&
        organizationWebsite &&
        organizationWebsite.trim() !== ""
      ) {
        updateData.website = organizationWebsite.trim();
      }
      if (
        organization.location === null &&
        organizationLocation &&
        organizationLocation.trim() !== ""
      ) {
        updateData.location = organizationLocation.trim();
      }
      if (
        organization.industry === null &&
        industryName &&
        industryName.trim() !== ""
      ) {
        updateData.industry = industryName.trim();
      }
      if (
        (!organization.lead_source || organization.lead_source.trim() === "") &&
        leadSource &&
        leadSource.trim() !== ""
      ) {
        updateData.lead_source = leadSource.trim();
      }
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = klTime;
        organization = await prisma.organization.update({
          where: { id: organizationId },
          data: updateData,
        });
      }
    } else {
      organization = await prisma.organization.create({
        data: {
          name: organizationName.trim(),
          website: organizationWebsite?.trim() || null,
          location: organizationLocation?.trim() || null,
          industry: industryName?.trim() || null,
          lead_source: leadSource?.trim() || null,
          createdBy: pic?.trim().toLowerCase() || null, // <-- add this line
          createdAt: klTime,
          updatedAt: klTime,
        },
      });
    }

    // --- CLIENT LOGIC ---
    let client = null;
    if (clientName && clientName.trim() !== "") {
      if (clientId) {
        client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) throw new Error("Selected client not found");

        if (client.organizationId !== organization.id) {
          // Client exists but is not part of this org, create new client for this org
          client = await prisma.client.create({
            data: {
              name: clientName.trim(),
              position: clientPosition?.trim() || null,
              contact_number: clientPhone?.trim() || null,
              contact_email: clientEmail?.trim() || null,
              organizationId: organization.id,
              createdBy: pic?.trim().toLowerCase() || null,
              createdAt: klTime,
              updatedAt: klTime,
            },
          });
        } else {
          // Update fields only if empty/null
          const updateData: any = {};
          if (
            (client.position === null || client.position.trim() === "") &&
            clientPosition &&
            clientPosition.trim() !== ""
          ) {
            updateData.position = clientPosition.trim();
          }
          if (
            (client.contact_number === null ||
              client.contact_number.trim() === "") &&
            clientPhone &&
            clientPhone.trim() !== ""
          ) {
            updateData.contact_number = clientPhone.trim();
          }
          if (
            (client.contact_email === null ||
              client.contact_email.trim() === "") &&
            clientEmail &&
            clientEmail.trim() !== ""
          ) {
            updateData.contact_email = clientEmail.trim();
          }
          if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = klTime;
            client = await prisma.client.update({
              where: { id: clientId },
              data: updateData,
            });
          }
        }
      } else {
        // New client: Create directly
        client = await prisma.client.create({
          data: {
            name: clientName.trim(),
            position: clientPosition?.trim() || null,
            contact_number: clientPhone?.trim() || null,
            contact_email: clientEmail?.trim() || null,
            organizationId: organization.id,
            createdBy: pic?.trim().toLowerCase() || null, // <-- add this line
            createdAt: klTime,
            updatedAt: klTime,
          },
        });
      }
    }

    // --- REPORT LOGIC ---
    const reportData = {
      campaign_name: campaignName?.trim() || null,
      prospect_date: toDateOnly(prospectDate),
      PIC: pic?.trim() || null,
      meetings_conducted: meetingsConducted,
      meeting_date: toDateOnly(meetingDate),
      proposal_in_progress: proposalInProgress,
      proposal_in_progress_date: toDateOnly(proposalInProgressDate),
      proposal_sent_out: proposalSent,
      proposal_sent_out_date: toDateOnly(proposalSentDate),
      quotation_signed: proposalSigned,
      quotation_signed_date: toDateOnly(proposalSignedDate),
      quotation_number: quotationNumber?.trim() || null,
      type: type?.trim() || null,
      notes: notes?.trim() || null,
      total_proposal_value: proposedValue ?? 0,
      total_closed_sale: closedSale ?? 0,
      source_table: sourceTable,
      source_organization: sourceTable === "MAVN" ? "MAVN" : "MI",
      createdAt: klTime,
      updatedAt: null,
      createdBy: username,
      organizationId: organization.id,
      clientId: client?.id || null,
    };

    // --- CREATE REPORT ---
    let createdRecord;
    if (sourceTable === "MAVN") {
      createdRecord = await prisma.mavn_monthly_report.create({
        data: reportData,
        include: { organization: true, client: true },
      });
    } else if (sourceTable === "MI") {
      createdRecord = await prisma.mi_monthly_report.create({
        data: reportData,
        include: { organization: true, client: true },
      });
    } else {
      throw new Error("Invalid source table");
    }

    if (!createdRecord) throw new Error("Failed to create record");

    // --- LOG ACTIVITY ---
    const displayId =
      sourceTable === "MI"
        ? `TMI-${createdRecord.id}`
        : `MV-${createdRecord.id}`;
    const organizationDisplayName = sourceTable === "MI" ? "TMI" : "MAVN";
    logActivity(req, {
      userId: Number(userId),
      username,
      sourceTable,
      createdId: createdRecord.id,
      clientName: clientName || "No client specified",
      displayId,
      organizationName: organizationDisplayName,
      klTime,
    }).catch((err) => {
      console.error("Activity logging failed:", err);
    });

    // --- RESPONSE ---
    return NextResponse.json({
      message: "Data added successfully",
      result: {
        ...createdRecord,
        organization: createdRecord.organization,
        client: createdRecord.client,
      },
      displayId,
    });
  } catch (error) {
    console.error("Error adding data:", error);
    return NextResponse.json(
      {
        error: "Error adding data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Separate function to log activity asynchronously
async function logActivity(
  req: NextRequest,
  params: {
    userId: number;
    username: string;
    sourceTable: string;
    createdId: number;
    clientName: string;
    displayId: string;
    organizationName: string;
    klTime: Date;
  }
) {
  const {
    userId,
    username,
    sourceTable,
    createdId,
    clientName,
    displayId,
    organizationName,
    klTime,
  } = params;

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      throw new Error("No session token found");
    }

    // Get session with device details
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: {
        id: true,
        device_fingerprint: true,
        readable_fingerprint: true,
        browser_version: true,
        ip_address: true,
        device_type: true,
        browser_name: true,
        os_type: true,
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    await prisma.activityLog.create({
      data: {
        userId,
        username,
        action: "CREATE",
        sessionId: session.id,
        source_table: sourceTable,
        source_id: createdId,
        description: `Created record ${clientName} (${displayId}) in ${organizationName}`,
        ip_address: session.ip_address,
        browser_version: session.browser_version,
        device_type: session.device_type,
        device_fingerprint: session.device_fingerprint,
        readable_fingerprint: session.readable_fingerprint,
        browser_name: session.browser_name,
        os_type: session.os_type,
        timestamp: klTime,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
