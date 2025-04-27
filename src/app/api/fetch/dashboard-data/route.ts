import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define the type for date columns
type DateColumnKey =
  | "Prospect Date"
  | "Meeting Conducted"
  | "Proposal In Progress"
  | "Proposal Sent Out"
  | "Quotation Signed"
  | "Lost Leads";

// Date columns mapping used for filtering with proper typing
const DATE_COLUMNS: Record<Exclude<DateColumnKey, "Lost Leads">, string> = {
  "Prospect Date": "prospect_date",
  "Meeting Conducted": "meeting_date",
  "Proposal In Progress": "proposal_in_progress_date",
  "Proposal Sent Out": "proposal_sent_out_date",
  "Quotation Signed": "quotation_signed_date",
};

// Define search field mapping to database columns
const SEARCH_FIELD_MAPPING: Record<string, string> = {
  organization: "organization_name",
  clientName: "client_name",
  clientPhone: "client_contact_number",
  clientEmail: "client_contact_email",
};

// Type for the request body
interface DashboardRequest {
  pic?: string[];
  dateSelector?: {
    start?: string;
    end?: string;
    option?: string[];
  };
  leadsFilter?: string;
  tableSelector?: string;
  location?: string[];
  search?: {
    searchTerm: string;
    searchField: string;
  };
}

// Define the condition types for type-safety
type DateCondition =
  | { lost_lead: true }
  | {
      AND: [
        { [column: string]: { not: null } },
        { [column: string]: { gte: Date; lte: Date } }
      ];
    };

export async function POST(req: NextRequest) {
  try {
    const {
      pic,
      dateSelector,
      tableSelector,
      leadsFilter,
      location,
      search,
    }: DashboardRequest = await req.json();

    // Check if we have valid search parameters
    const hasValidSearch =
      search &&
      search.searchTerm &&
      search.searchField &&
      search.searchTerm.trim() !== "" &&
      SEARCH_FIELD_MAPPING[search.searchField];

    const hasDateRange = Boolean(dateSelector?.start && dateSelector?.end);
    const hasDateOptions = Boolean(dateSelector?.option?.length);
    const hasLocationFilter = Array.isArray(location) && location.length > 0;

    const getArchivedUsers = prisma.user.findMany({
      where: { archived: true },
      select: { username: true },
    });
    const getCustomOptions = prisma.customOptions.findMany();

    let previousDateRange: {
      previousStartDate: string;
      previousEndDate: string;
    } | null = null;
    let dateFilter: Record<string, any> = {};
    let previousDateFilter: Record<string, any> = {};

    // Set up date filters if search is not active
    if (!hasValidSearch && hasDateRange) {
      const startDateObj = new Date(dateSelector!.start!);
      const startDate = new Date(
        startDateObj.getFullYear(),
        startDateObj.getMonth(),
        startDateObj.getDate()
      );
      startDate.setHours(0, 0, 0, 0);

      const endDateObj = new Date(dateSelector!.end!);
      const endDate = new Date(
        endDateObj.getFullYear(),
        endDateObj.getMonth(),
        endDateObj.getDate()
      );
      endDate.setHours(23, 59, 59, 999);

      const rangeInDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(startDate.getDate() - rangeInDays);
      previousStartDate.setHours(0, 0, 0, 0);

      const previousEndDate = new Date(endDate);
      previousEndDate.setDate(endDate.getDate() - rangeInDays);
      previousEndDate.setHours(23, 59, 59, 999);

      if (previousStartDate.getTime() === previousEndDate.getTime()) {
        previousEndDate.setDate(previousEndDate.getDate() + 1);
      }

      previousDateRange = {
        previousStartDate: previousStartDate.toISOString(),
        previousEndDate: previousEndDate.toISOString(),
      };

      if (dateSelector?.option?.length) {
        const dateConditions = dateSelector.option
          .map((option: string) => {
            if (option === "Lost Leads") {
              return { lost_lead: true } as DateCondition;
            }
            const column =
              DATE_COLUMNS[option as Exclude<DateColumnKey, "Lost Leads">];
            if (!column) return null;
            return {
              AND: [
                { [column]: { not: null } },
                { [column]: { gte: startDate, lte: endDate } },
              ],
            } as DateCondition;
          })
          .filter(
            (condition): condition is DateCondition => condition !== null
          );

        dateFilter = { OR: dateConditions };

        const previousDateConditions = dateSelector.option
          .map((option: string) => {
            if (option === "Lost Leads") {
              return { lost_lead: true } as DateCondition;
            }
            const column =
              DATE_COLUMNS[option as Exclude<DateColumnKey, "Lost Leads">];
            if (!column) return null;
            return {
              AND: [
                { [column]: { not: null } },
                { [column]: { gte: previousStartDate, lte: previousEndDate } },
              ],
            } as DateCondition;
          })
          .filter(
            (condition): condition is DateCondition => condition !== null
          );

        previousDateFilter = { OR: previousDateConditions };
      } else {
        // Include createdAt and all date columns
        const allDateConditions = [
          // Include createdAt
          { createdAt: { gte: startDate, lte: endDate } },
          // Include all date columns
          ...Object.values(DATE_COLUMNS).map((column) => ({
            AND: [
              { [column]: { not: null } },
              { [column]: { gte: startDate, lte: endDate } },
            ],
          })),
        ];
        dateFilter = { OR: allDateConditions };

        // Previous period - include createdAt and all date columns
        const allPreviousDateConditions = [
          // Include createdAt
          { createdAt: { gte: previousStartDate, lte: previousEndDate } },
          // Include all date columns
          ...Object.values(DATE_COLUMNS).map((column) => ({
            AND: [
              { [column]: { not: null } },
              { [column]: { gte: previousStartDate, lte: previousEndDate } },
            ],
          })),
        ];
        previousDateFilter = { OR: allPreviousDateConditions };
      }
    } else if (!hasValidSearch && dateSelector?.option?.length) {
      type SimpleCondition =
        | { lost_lead: true }
        | { [column: string]: { not: null } };
      const dateConditions = dateSelector.option
        .map((option: string) => {
          if (option === "Lost Leads") {
            return { lost_lead: true } as SimpleCondition;
          }
          const column =
            DATE_COLUMNS[option as Exclude<DateColumnKey, "Lost Leads">];
          if (!column) return null;
          return { [column]: { not: null } } as SimpleCondition;
        })
        .filter(
          (condition): condition is SimpleCondition => condition !== null
        );

      dateFilter = { OR: dateConditions };
    } else if (!hasValidSearch) {
      // Filter for current year using all date columns and createdAt
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

      const allYearDateConditions = [
        // Include createdAt
        { createdAt: { gte: startOfYear, lte: endOfYear } },
        // Include all date columns
        ...Object.values(DATE_COLUMNS).map((column) => ({
          AND: [
            { [column]: { not: null } },
            { [column]: { gte: startOfYear, lte: endOfYear } },
          ],
        })),
      ];
      dateFilter = { OR: allYearDateConditions };
    }

    const [archivedUsers, customOptions] = await Promise.all([
      getArchivedUsers,
      getCustomOptions,
    ]);
    const archivedUsernames = archivedUsers.map(
      (user) => user.username.charAt(0).toUpperCase() + user.username.slice(1)
    );

    // Build the whereClause based on search or other filters
    let whereClause: Record<string, any> = {};

    if (hasValidSearch) {
      // If we have valid search parameters, use them exclusively
      const dbColumn = SEARCH_FIELD_MAPPING[search!.searchField];
      whereClause = {
        [dbColumn]: {
          contains: search!.searchTerm,
          mode: "insensitive", // Case insensitive search
        },
      };
    } else {
      // Otherwise use the regular filters
      const picFilter = pic && pic.length > 0 ? { PIC: { in: pic } } : {};

      // Lead source filter
      let leadSourceFilter = {};
      if (leadsFilter === "Warm Leads") {
        leadSourceFilter = {
          lead_source: { contains: "warm lead", mode: "insensitive" },
        };
      } else if (leadsFilter === "Exclude Warm Leads") {
        leadSourceFilter = {
          NOT: {
            lead_source: { contains: "warm lead", mode: "insensitive" },
          },
        };
      }

      // Location filter
      const locationFilter = hasLocationFilter
        ? { organization_location: { in: location } }
        : {};

      whereClause = {
        ...picFilter,
        ...leadSourceFilter,
        ...locationFilter,
        ...(Object.keys(dateFilter).length > 0 ? { AND: [dateFilter] } : {}),
      };
    }

    let mavnReports: any[] = [];
    let miReports: any[] = [];
    let previousMavnReports: any[] = [];
    let previousMiReports: any[] = [];

    if (hasDateRange && !hasValidSearch) {
      // Create previous where clause with the same filters but different date range
      const previousWhereClause = { ...whereClause };

      // Handle date filter for previous period
      if (previousWhereClause.AND && previousWhereClause.AND.length > 0) {
        // Replace the date filter with the previous date filter
        previousWhereClause.AND = previousWhereClause.AND.map((item: any) => {
          // If this is the date filter, replace it with previous date filter
          if (item === dateFilter) {
            return previousDateFilter;
          }
          return item;
        });
      } else if (Object.keys(previousDateFilter).length > 0) {
        // If there's no AND clause but we have a previous date filter, add it
        previousWhereClause.AND = [previousDateFilter];
      }

      [mavnReports, miReports, previousMavnReports, previousMiReports] =
        await Promise.all([
          tableSelector === "All" || tableSelector === "MAVN"
            ? prisma.mavn_monthly_report.findMany({ where: whereClause })
            : Promise.resolve([]),

          tableSelector === "All" || tableSelector === "Moving Image"
            ? prisma.mi_monthly_report.findMany({ where: whereClause })
            : Promise.resolve([]),

          tableSelector === "All" || tableSelector === "MAVN"
            ? prisma.mavn_monthly_report.findMany({
                where: previousWhereClause,
              })
            : Promise.resolve([]),

          tableSelector === "All" || tableSelector === "Moving Image"
            ? prisma.mi_monthly_report.findMany({ where: previousWhereClause })
            : Promise.resolve([]),
        ]);
    } else {
      // For search queries or non-date range queries
      [mavnReports, miReports] = await Promise.all([
        tableSelector === "All" || tableSelector === "MAVN"
          ? prisma.mavn_monthly_report.findMany({ where: whereClause })
          : Promise.resolve([]),

        tableSelector === "All" || tableSelector === "Moving Image"
          ? prisma.mi_monthly_report.findMany({ where: whereClause })
          : Promise.resolve([]),
      ]);
    }

    const filteredData = [...mavnReports, ...miReports].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    const totalProposalValue = filteredData.reduce(
      (sum, item) => sum + (Number(item.total_proposal_value) || 0),
      0
    );

    const totalClosedSale = filteredData.reduce(
      (sum, item) => sum + (Number(item.total_closed_sale) || 0),
      0
    );

    const responseData: {
      filteredData: any[];
      previousData: {
        data: { total_proposal_value: string; total_closed_sale: string }[];
        dateRange: typeof previousDateRange;
      } | null;
      customOptions: any[];
    } = {
      filteredData,
      previousData: null,
      customOptions,
    };

    if (hasDateRange && !hasValidSearch) {
      const previousFilteredData = [
        ...previousMavnReports,
        ...previousMiReports,
      ];
      const previousTotalProposalValue = previousFilteredData.reduce(
        (sum, item) => sum + (Number(item.total_proposal_value) || 0),
        0
      );
      const previousTotalClosedSale = previousFilteredData.reduce(
        (sum, item) => sum + (Number(item.total_closed_sale) || 0),
        0
      );

      responseData.previousData = {
        data: [
          {
            total_proposal_value: previousTotalProposalValue.toString(),
            total_closed_sale: previousTotalClosedSale.toString(),
          },
        ],
        dateRange: previousDateRange,
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Dashboard data API error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching dashboard data." },
      { status: 500 }
    );
  }
}
