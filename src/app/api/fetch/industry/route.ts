import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "industry.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    return NextResponse.json({ industries: data.industries });
  } catch (error) {
    console.error("Error reading industries:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load industries" },
      { status: 500 }
    );
  }
}
