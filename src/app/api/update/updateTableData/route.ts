import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import DeviceDetector from "node-device-detector";

export async function POST(req: NextRequest) {
  const {
    id,
    clientName,
    industryName,
    leadSource,
    pic,
    meetingsConducted,
    proposalSent,
    proposalInProgress,
    clientLocation,
    prospectDate,
    meetingDate,
    proposalSentDate,
    proposalInProgressDate,
    proposalSigned,
    proposalSignedDate,
    proposedValue,
    closedSale,
    sourceTable,
    oldSourceTable,
    quotationNumber,
    type,
    lostLead,
    notes,
    username,
    organizationName,
    organizationWebsite,
    clientPhone,
    clientEmail,
    userId,
  } = await req.json();

  try {
    const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = {
      organization_name: organizationName,
      client_name: clientName,
      client_contact_number:
        clientPhone && clientPhone.trim() !== "" ? clientPhone : null,
      client_contact_email:
        clientEmail && clientEmail.trim() !== "" ? clientEmail : null,
      organization_website: organizationWebsite,
      industry_name: industryName,
      organization_location: clientLocation,
      lead_source: leadSource,
      prospect_date: prospectDate ? new Date(prospectDate) : null,
      PIC: pic,
      meetings_conducted: meetingsConducted,
      meeting_date: meetingDate ? new Date(meetingDate) : null,
      proposal_in_progress: proposalInProgress,
      proposal_in_progress_date: proposalInProgressDate
        ? new Date(proposalInProgressDate)
        : null,
      proposal_sent_out: proposalSent,
      proposal_sent_out_date: proposalSentDate
        ? new Date(proposalSentDate)
        : null,
      quotation_signed: proposalSigned,
      quotation_signed_date: proposalSignedDate
        ? new Date(proposalSignedDate)
        : null,
      quotation_number: quotationNumber,
      lost_lead: lostLead,
      type: type,
      notes: notes,
      total_proposal_value: proposedValue ?? 0,
      total_closed_sale: closedSale ?? 0,
      source_table: sourceTable,
      updatedAt: klTime,
      updatedBy: username,
    };

    // Main update logic, no activity log in transaction
    const originalSourceTable = oldSourceTable || sourceTable;
    const originalDisplayId =
      originalSourceTable === "MAVN" ? `MV-${id}` : `TMI-${id}`;

    let originalRecord;
    if (originalSourceTable === "MAVN") {
      originalRecord = await prisma.mavn_monthly_report.findUnique({
        where: { id },
      });
    } else {
      originalRecord = await prisma.mi_monthly_report.findUnique({
        where: { id },
      });
    }

    if (!originalRecord) {
      const tableName =
        originalSourceTable === "MAVN"
          ? "mavn_monthly_report"
          : "mi_monthly_report";
      throw new Error(
        `Record with ID ${originalDisplayId} not found in ${tableName}`
      );
    }

    const originalSourceOrg =
      originalRecord.source_organization ||
      (originalSourceTable === "MAVN" ? "MAVN" : "MI");

    let updatedRecord,
      action,
      sourceId,
      displayId,
      organizationDisplayName,
      logDescription;

    if (originalSourceTable !== sourceTable) {
      const newData = {
        ...data,
        source_organization: originalSourceOrg,
        createdAt: originalRecord.createdAt || klTime,
        createdBy: originalRecord.createdBy || username,
      };

      if (sourceTable === "MAVN") {
        updatedRecord = await prisma.mavn_monthly_report.create({
          data: newData,
        });
      } else {
        updatedRecord = await prisma.mi_monthly_report.create({
          data: newData,
        });
      }

      if (originalSourceTable === "MAVN") {
        await prisma.mavn_monthly_report.delete({
          where: { id },
        });
      } else {
        await prisma.mi_monthly_report.delete({
          where: { id },
        });
      }

      const newDisplayId =
        sourceTable === "MAVN"
          ? `MV-${updatedRecord.id}`
          : `TMI-${updatedRecord.id}`;
      action = "TRANSFER";
      sourceId = updatedRecord.id;
      displayId = newDisplayId;
      organizationDisplayName = sourceTable === "MI" ? "TMI" : "MAVN";
      logDescription = `Transferred record ${clientName} from ${
        originalSourceTable === "MI" ? "TMI" : "MAVN"
      } to ${
        sourceTable === "MI" ? "TMI" : "MAVN"
      } (Old ID: ${originalDisplayId}, New ID: ${newDisplayId})`;
    } else {
      const updateData = {
        ...data,
        source_organization: originalSourceOrg,
      };

      if (sourceTable === "MAVN") {
        updatedRecord = await prisma.mavn_monthly_report.update({
          where: { id },
          data: updateData,
        });
      } else {
        updatedRecord = await prisma.mi_monthly_report.update({
          where: { id },
          data: updateData,
        });
      }

      displayId = sourceTable === "MI" ? `TMI-${id}` : `MV-${id}`;
      action = "UPDATE";
      sourceId = id;
      organizationDisplayName = sourceTable === "MI" ? "TMI" : "MAVN";
      logDescription = `Updated record ${clientName} (${displayId}) in ${organizationDisplayName}`;
    }

    // Async background activity log
    logActivity(req, {
      userId: user.id,
      username,
      sourceTable,
      sourceId,
      clientName,
      displayId,
      organizationName: organizationDisplayName,
      klTime,
      action,
      logDescription,
    }).catch((err) => {
      console.error("Activity logging failed:", err);
    });

    return NextResponse.json({
      message: "Data updated successfully",
      result: updatedRecord,
      displayId,
    });
  } catch (error) {
    console.error("Error updating data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Error updating data", message: errorMessage },
      { status: 500 }
    );
  }
}

async function logActivity(
  req: NextRequest,
  params: {
    userId: number;
    username: string;
    sourceTable: string;
    sourceId: number;
    clientName: string;
    displayId: string;
    organizationName: string;
    klTime: Date;
    action: string;
    logDescription: string;
  }
) {
  const {
    userId,
    username,
    sourceTable,
    sourceId,
    clientName,
    displayId,
    organizationName,
    klTime,
    action,
    logDescription,
  } = params;

  try {
    const deviceDetails = getDeviceDetails(req);

    await prisma.activityLog.create({
      data: {
        userId,
        username,
        action,
        source_table: sourceTable,
        source_id: sourceId,
        description: logDescription,
        ip_address: getClientIp(req),
        device_type: getDeviceType(req),
        browser_name: deviceDetails.browser_name,
        browser_version: deviceDetails.browser_version,
        os_name: deviceDetails.os_name,
        os_version: deviceDetails.os_version,
        device_vendor: deviceDetails.device_vendor,
        device_model: deviceDetails.device_model,
        device_type_spec: deviceDetails.device_type,
        timestamp: klTime,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

function getClientIp(req: NextRequest): string {
  let clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "Unknown";

  if (clientIp.includes(",")) {
    clientIp = clientIp.split(",")[0].trim();
  }

  if (clientIp === "::1" || clientIp === "127.0.0.1") {
    clientIp = "localhost";
  }

  return clientIp;
}

function getDeviceType(req: NextRequest): string {
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const deviceInfo = getDeviceInfo(userAgent);

  let deviceTypeDisplay = "Unknown Device";

  if (deviceInfo.device.vendor || deviceInfo.device.model) {
    deviceTypeDisplay =
      [deviceInfo.device.vendor, deviceInfo.device.model]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown Device";

    if (
      deviceInfo.device.type &&
      !deviceTypeDisplay
        .toLowerCase()
        .includes(deviceInfo.device.type.toLowerCase())
    ) {
      deviceTypeDisplay += ` (${deviceInfo.device.type})`;
    }
  } else if (deviceInfo.client.name) {
    deviceTypeDisplay = `${deviceInfo.client.name} ${
      deviceInfo.client.version || ""
    }`.trim();
  }

  const osInfo = deviceInfo.os.name
    ? `${deviceInfo.os.name} ${deviceInfo.os.version || ""}`.trim()
    : "Unknown OS";

  return `${deviceTypeDisplay} on ${osInfo}`;
}

function getDeviceDetails(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const deviceInfo = getDeviceInfo(userAgent);

  return {
    browser_name: deviceInfo.client.name,
    browser_version: deviceInfo.client.version,
    os_name: deviceInfo.os.name,
    os_version: deviceInfo.os.version,
    device_vendor: deviceInfo.device.vendor,
    device_model: deviceInfo.device.model,
    device_type: deviceInfo.device.type,
    raw_user_agent: userAgent,
  };
}

interface DeviceInfo {
  client: {
    name: string | null;
    version: string | null;
    type: string | null;
  };
  os: {
    name: string | null;
    version: string | null;
    platform: string | null;
  };
  device: {
    type: string | null;
    brand: string | null;
    model: string | null;
    vendor: string | null;
  };
  bot: boolean;
}

function getDeviceInfo(userAgent: string): DeviceInfo {
  const detector = new DeviceDetector({
    clientIndexes: true,
    deviceIndexes: true,
    deviceAliasCode: false,
    deviceTrusted: true,
    maxUserAgentSize: 500,
  });

  const result = detector.detect(userAgent);

  const osName = result.os?.name || null;
  let osVersion = result.os?.version || null;

  if (osName === "Mac OS" && osVersion) {
    const macOSVersions: Record<string, string> = {
      "10.15": "Catalina",
      "11": "Big Sur",
      "12": "Monterey",
      "13": "Ventura",
      "14": "Sonoma",
      "15": "Sequoia",
    };

    const majorVersion = osVersion.split(".")[0];
    const minorVersion = osVersion.split(".")[1];
    const versionKey =
      majorVersion === "10" ? `${majorVersion}.${minorVersion}` : majorVersion;

    if (macOSVersions[versionKey]) {
      osVersion = `${osVersion} (${macOSVersions[versionKey]})`;
    }
  }

  let deviceVendor = result.device?.brand || null;
  let deviceModel = result.device?.model || null;
  let deviceType = result.device?.type || null;

  if (deviceType && typeof deviceType === "string") {
    deviceType =
      deviceType.charAt(0).toUpperCase() + deviceType.slice(1).toLowerCase();
  }

  if (
    !deviceType &&
    ((osName && ["Windows", "Mac OS", "Linux"].includes(osName)) ||
      result.os?.platform === "x64" ||
      result.os?.platform === "x86")
  ) {
    deviceType = "Desktop";
  }

  const isFrozenAndroidUA =
    osName === "Android" &&
    osVersion === "10" &&
    (deviceModel === "K" || !deviceModel);

  if (isFrozenAndroidUA) {
    const androidDeviceMatch = userAgent.match(/;\s*([^;)]+?)(?:\s+Build|\))/i);
    if (androidDeviceMatch && androidDeviceMatch[1]) {
      const deviceString = androidDeviceMatch[1].trim();
      if (deviceString && deviceString !== "K") {
        const knownVendors = [
          { name: "Samsung", patterns: ["SM-", "SAMSUNG"] },
          { name: "Xiaomi", patterns: ["MI ", "Redmi", "POCO"] },
          { name: "Google", patterns: ["Pixel"] },
          { name: "OnePlus", patterns: ["OnePlus"] },
          { name: "OPPO", patterns: ["OPPO", "CPH"] },
          { name: "Vivo", patterns: ["vivo"] },
          { name: "Huawei", patterns: ["HUAWEI"] },
          { name: "Motorola", patterns: ["moto", "Motorola"] },
          { name: "Nokia", patterns: ["Nokia"] },
          { name: "Sony", patterns: ["Sony", "Xperia"] },
        ];

        for (const vendor of knownVendors) {
          if (vendor.patterns.some((p) => deviceString.includes(p))) {
            deviceVendor = vendor.name;
            deviceModel = deviceString;
            break;
          }
        }

        if (!deviceVendor && deviceString !== "K") {
          deviceModel = deviceString;
        }
      }
    }
  }

  let isBot = false;
  const botResult = detector.parseBot(userAgent);
  if (botResult && Object.keys(botResult).length > 0) {
    isBot = true;
  } else if (result.client?.type === "bot") {
    isBot = true;
  }

  return {
    client: {
      name: result.client?.name || null,
      version: result.client?.version || null,
      type: result.client?.type || null,
    },
    os: {
      name: osName,
      version: osVersion,
      platform: result.os?.platform || null,
    },
    device: {
      type: deviceType,
      brand: deviceVendor,
      model: deviceModel,
      vendor: deviceVendor,
    },
    bot: isBot,
  };
}
