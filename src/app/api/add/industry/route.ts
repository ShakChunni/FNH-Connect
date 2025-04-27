import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper function to capitalize the first letter of each word
function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function POST(req: Request) {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "industry.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    const body = await req.json();
    let newIndustry = body.industry?.trim();

    if (!newIndustry) {
      return NextResponse.json(
        { success: false, message: "Industry name is required" },
        { status: 400 }
      );
    }

    // Capitalize the first letter of each word
    newIndustry = capitalizeWords(newIndustry);

    if (data.industries.includes(newIndustry)) {
      return NextResponse.json(
        { success: false, message: "Industry already exists" },
        { status: 400 }
      );
    }

    // Add the new industry
    data.industries.push(newIndustry);

    // Save the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({ success: true, industry: newIndustry });
  } catch (error) {
    console.error("Error saving industry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save industry" },
      { status: 500 }
    );
  }
}
