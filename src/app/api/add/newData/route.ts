import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import DeviceDetector from "node-device-detector";

export async function POST(req: NextRequest) {
  const {
    organizationName,
    organizationWebsite,
    organizationLocation,
    industryName,
    clientName,
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

    // Prepare the data object
    const data = {
      organization_name: organizationName,
      organization_website: organizationWebsite,
      organization_location: organizationLocation,
      industry_name: industryName,
      client_name: clientName,
      client_contact_number:
        clientPhone && clientPhone.trim() !== "" ? clientPhone : null,
      client_contact_email:
        clientEmail && clientEmail.trim() !== "" ? clientEmail : null,
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
      type: type,
      notes: notes,
      total_proposal_value: proposedValue ?? 0,
      total_closed_sale: closedSale ?? 0,
      source_table: sourceTable,
      source_organization: sourceTable === "MAVN" ? "MAVN" : "MI",
      createdAt: klTime,
      updatedAt: null,
      createdBy: username,
    };

    // Create the record first without waiting for activity log
    let createdRecord;
    if (sourceTable === "MAVN") {
      createdRecord = await prisma.mavn_monthly_report.create({ data });
    } else if (sourceTable === "MI") {
      createdRecord = await prisma.mi_monthly_report.create({ data });
    } else {
      throw new Error("Invalid source table");
    }

    if (!createdRecord) {
      throw new Error("Failed to create record");
    }

    // Prepare display info for the response and activity log
    const displayId =
      sourceTable === "MI"
        ? `TMI-${createdRecord.id}`
        : `MV-${createdRecord.id}`;
    const organizationDisplayName = sourceTable === "MI" ? "TMI" : "MAVN";

    // Log activity in the background
    logActivity(req, {
      userId: Number(userId),
      username,
      sourceTable,
      createdId: createdRecord.id,
      clientName,
      displayId,
      organizationName: organizationDisplayName,
      klTime,
    }).catch((err) => {
      console.error("Activity logging failed:", err);
      // Don't throw - this is in background and shouldn't affect the response
    });

    // Return response immediately
    return NextResponse.json({
      message: "Data added successfully",
      result: createdRecord,
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
    const deviceDetails = getDeviceDetails(req);

    await prisma.activityLog.create({
      data: {
        userId,
        username,
        action: "CREATE",
        source_table: sourceTable,
        source_id: createdId,
        description: `Created record ${clientName} (${displayId}) in ${organizationName}`,
        ip_address: getClientIp(req),
        device_type: getDeviceType(req),
        // Device details
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
    // Don't rethrow - this is background processing
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

  // Format device display string
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

// DeviceInfo interface and getDeviceInfo function
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

  // Get OS info
  const osName = result.os?.name || null;
  let osVersion = result.os?.version || null;

  // Enhance macOS versions with marketing names
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

  // Get device info with fallbacks
  let deviceVendor = result.device?.brand || null;
  let deviceModel = result.device?.model || null;
  let deviceType = result.device?.type || null;

  // Capitalize device type
  if (deviceType && typeof deviceType === "string") {
    deviceType =
      deviceType.charAt(0).toUpperCase() + deviceType.slice(1).toLowerCase();
  }

  // Set desktop type for desktop operating systems
  if (
    !deviceType &&
    ((osName && ["Windows", "Mac OS", "Linux"].includes(osName)) ||
      result.os?.platform === "x64" ||
      result.os?.platform === "x86")
  ) {
    deviceType = "Desktop";
  }

  // Handle frozen Android user agent (Chrome 110+ shows "Android 10; K")
  const isFrozenAndroidUA =
    osName === "Android" &&
    osVersion === "10" &&
    (deviceModel === "K" || !deviceModel);

  if (isFrozenAndroidUA) {
    // Try to get better device info from user agent
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

  // Bot detection
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
