import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DATE_COLUMNS = {
  "Prospect Date": "prospect_date",
  "Meeting Conducted": "meeting_date",
  "Proposal In Progress": "proposal_in_progress_date",
  "Proposal Sent Out": "proposal_sent_out_date",
  "Quotation Signed": "quotation_signed_date",
} as const;

export async function POST(req: NextRequest) {
  try {
    const { dateSelector, tableSelector, pic } = await req.json();

    // Early return for missing dates
    if (!dateSelector?.start || !dateSelector?.end) {
      return NextResponse.json({
        data: [
          {
            total_proposal_value: "0",
            total_closed_sale: "0",
          },
        ],
        dateRange: null,
      });
    }

    // Calculate date ranges
    const startDate = new Date(dateSelector.start);
    const endDate = new Date(dateSelector.end);
    const rangeInDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(startDate.getDate() - rangeInDays - 1);

    const previousEndDate = new Date(endDate);
    previousEndDate.setDate(endDate.getDate() - rangeInDays);

    // Ensure minimum one day difference
    if (previousStartDate.getTime() === previousEndDate.getTime()) {
      previousEndDate.setDate(previousEndDate.getDate() + 1);
    }

    // Build date conditions
    const dateConditions = dateSelector.option?.length
      ? dateSelector.option.map((option: keyof typeof DATE_COLUMNS) => {
          const column = DATE_COLUMNS[option];
          return `(${column} IS NOT NULL AND ${column} >= '${previousStartDate.toISOString()}' AND ${column} <= '${previousEndDate.toISOString()}')`;
        })
      : Object.values(DATE_COLUMNS).map(
          (column) =>
            `(${column} IS NOT NULL AND ${column} >= '${previousStartDate.toISOString()}' AND ${column} <= '${previousEndDate.toISOString()}')`
        );

    // Build WHERE clause
    const baseWhereClause = `WHERE ("isInactive" = false OR "isInactive" IS NULL)`;
    const dateWhereClause = dateConditions.length
      ? ` AND (${dateConditions.join(" OR ")})`
      : "";
    const picWhereClause =
      pic?.length && !pic.includes("All")
        ? ` AND (${pic
            .map((p: string) => `"PIC" = '${p.replace(/'/g, "''")}'`)
            .join(" OR ")})`
        : "";

    const whereClause = `${baseWhereClause}${dateWhereClause}${picWhereClause}`;

    // Build table queries
    const tableQueries = [];
    const normalizedTable = tableSelector.toLowerCase();

    const selectClause = `
      SELECT 
        COALESCE(total_proposal_value, 0) as total_proposal_value,
        COALESCE(total_closed_sale, 0) as total_closed_sale
    `;

    if (normalizedTable === "all" || normalizedTable === "mavn") {
      tableQueries.push(`
        ${selectClause}
        FROM mavn_monthly_report
        ${whereClause}
      `);
    }

    if (normalizedTable === "all" || normalizedTable === "moving image") {
      tableQueries.push(`
        ${selectClause}
        FROM mi_monthly_report
        ${whereClause}
      `);
    }

    // Final combined query
    const finalQuery = `
      SELECT
        COALESCE(SUM(total_proposal_value), 0) as total_proposal_value,
        COALESCE(SUM(total_closed_sale), 0) as total_closed_sale
      FROM (
        ${tableQueries.join(" UNION ALL ")}
      ) as combined_data
    `;

    const result: {
      total_proposal_value: bigint;
      total_closed_sale: bigint;
    }[] = await prisma.$queryRawUnsafe(finalQuery);

    return NextResponse.json({
      data: result.map((item) => ({
        total_proposal_value: item.total_proposal_value.toString(),
        total_closed_sale: item.total_closed_sale.toString(),
      })),
      dateRange: {
        previousStartDate: previousStartDate.toISOString(),
        previousEndDate: previousEndDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching data." },
      { status: 500 }
    );
  }
}
