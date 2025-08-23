import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const username = searchParams.get("username");
    const userRole = searchParams.get("userRole");

    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }

    if (!username) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // For now, return a mock list of common hospitals
    // This will be replaced with actual database queries after migration
    const mockHospitals = [
      {
        id: 1,
        name: "General Hospital",
        address: "123 Main Street",
        phoneNumber: "+1234567890",
        email: "info@generalhospital.com",
        website: "https://generalhospital.com",
        type: "Government Hospital",
      },
      {
        id: 2,
        name: "City Medical Center",
        address: "456 Health Avenue",
        phoneNumber: "+1234567891",
        email: "contact@citymedical.com",
        website: "https://citymedical.com",
        type: "Private Hospital",
      },
      {
        id: 3,
        name: "Women's Health Clinic",
        address: "789 Care Boulevard",
        phoneNumber: "+1234567892",
        email: "info@womenshealth.com",
        website: "https://womenshealth.com",
        type: "Specialty Center",
      },
    ];

    // Filter based on query
    const filteredHospitals = mockHospitals.filter(
      (hospital) =>
        hospital.name.toLowerCase().includes(query.toLowerCase()) ||
        hospital.type.toLowerCase().includes(query.toLowerCase()) ||
        hospital.address.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json(filteredHospitals);
  } catch (error) {
    console.error("Hospital search error:", error);
    return NextResponse.json(
      { error: "Failed to search hospitals" },
      { status: 500 }
    );
  }
}
