/**
 * Medicine Purchases API Route
 * GET: List all purchase entries with filtering
 * POST: Create a new purchase entry (with stock update)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getPurchases,
  createPurchaseInvoice,
} from "@/services/medicineInventoryService";
import { z } from "zod";

const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Invalid date",
  });

const createPurchaseItemSchema = z.object({
  medicineId: z.number().int().positive("Medicine is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Purchase price must be positive"),
  vatTax: z.number().min(0, "VAT + tax cannot be negative").default(0),
  salePrice: z.number().positive("Sale price must be positive"),
  discountAmount: z
    .number()
    .min(0, "Discount amount cannot be negative")
    .default(0),
  expiryDate: dateStringSchema.optional(),
  batchNumber: z.string().trim().max(100).optional(),
}).superRefine((item, ctx) => {
  const grossTotal = (item.unitPrice + item.vatTax) * item.quantity;

  if (item.discountAmount > grossTotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountAmount"],
      message: "Discount cannot exceed the purchase amount including VAT + tax",
    });
  }
});

const createPurchaseSchema = z.object({
  invoiceNumber: z
    .string()
    .trim()
    .min(1, "Invoice number is required")
    .max(100),
  companyId: z.number().int().positive("Company is required"),
  purchaseDate: dateStringSchema.optional(),
  items: z
    .array(createPurchaseItemSchema)
    .min(1, "At least one medicine is required")
    .max(100, "A single invoice can contain up to 100 medicines"),
});

const purchaseFiltersSchema = z.object({
  search: z.string().optional(),
  companyId: z.coerce.number().int().positive().optional(),
  medicineId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

// ═══════════════════════════════════════════════════════════════
// GET - List Purchases
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const rawFilters = Object.fromEntries(searchParams.entries());
    const validation = purchaseFiltersSchema.safeParse(rawFilters);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const filters = validation.data;
    const { purchases, total, page, limit } = await getPurchases(filters);

    return NextResponse.json({
      success: true,
      data: purchases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/purchases error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch purchases",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Purchase
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id: userId, staffId } = user;

    const body: unknown = await request.json();
    const validation = createPurchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validated = validation.data;
    const purchases = await createPurchaseInvoice(
      {
        invoiceNumber: validated.invoiceNumber,
        companyId: validated.companyId,
        purchaseDate: validated.purchaseDate
          ? new Date(validated.purchaseDate)
          : undefined,
        items: validated.items.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatTax: item.vatTax,
          salePrice: item.salePrice,
          discountAmount: item.discountAmount,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
          batchNumber: item.batchNumber || undefined,
        })),
      },
      staffId,
      userId,
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      },
    );

    const response = NextResponse.json(
      {
        success: true,
        data: purchases,
        message: `${purchases.length} medicine${purchases.length === 1 ? "" : "s"} purchased under invoice ${validated.invoiceNumber}`,
      },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/medicine-inventory/purchases error:", error);

    if (error instanceof Error) {
      const knownErrors = [
        "Invalid or inactive",
        "already exists",
        "cannot be in the future",
        "Expiry date cannot be earlier than purchase date",
        "VAT + tax cannot be negative",
        "Discount amount cannot be negative",
        "Discount cannot exceed the purchase amount including VAT + tax",
        "At least one medicine is required",
      ];
      if (knownErrors.some((msg) => error.message.includes(msg))) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create purchase",
      },
      { status: 500 },
    );
  }
}
