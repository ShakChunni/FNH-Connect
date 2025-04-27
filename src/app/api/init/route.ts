import { NextResponse } from "next/server";
import { initializeServer } from "@/lib/server-init";

// This route will be called when the app starts
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    initializeServer();
    return NextResponse.json({ status: "Server initialized" });
  }
  return NextResponse.json({ status: "Skipped in development" });
}
