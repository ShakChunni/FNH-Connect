import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { customOptions } = await req.json();

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      const createdOptions: { id: number; type: string; data: string }[] = [];

      for (const option of customOptions) {
        const existingOption = await tx.customOptions.findFirst({
          where: {
            type: option.type,
            data: {
              equals: option.value.toLowerCase(),
              mode: "insensitive",
            },
          },
        });

        if (!existingOption) {
          const newOption = await tx.customOptions.create({
            data: {
              type: option.type,
              data: option.value,
            },
          });
          createdOptions.push(newOption);
        }
      }

      return createdOptions;
    });

    return NextResponse.json({
      message: "Custom options added successfully",
      created: result.length,
    });
  } catch (error) {
    console.error("Error adding custom options:", error);
    return NextResponse.json(
      {
        error: "Error adding custom options",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
