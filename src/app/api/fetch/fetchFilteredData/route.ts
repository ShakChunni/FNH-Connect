import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pic, dateSelector, tableSelector } = body;

    // Get archived users first and capitalize usernames
    const archivedUsers = await prisma.user.findMany({
      where: { archived: true },
      select: { username: true },
    });
    const archivedUsernames = archivedUsers.map((user) => {
      return user.username.charAt(0).toUpperCase() + user.username.slice(1);
    });

    const dateColumns = [
      "prospect_date",
      "meeting_date",
      "proposal_in_progress_date",
      "proposal_sent_out_date",
      "quotation_signed_date",
    ];

    const columnMap: { [key: string]: string } = {
      "Prospect Date": "prospect_date",
      "Meeting Conducted": "meeting_date",
      "Proposal In Progress": "proposal_in_progress_date",
      "Proposal Sent Out": "proposal_sent_out_date",
      "Quotation Signed": "quotation_signed_date",
      "Lost Leads": "lost_lead",
    };

    let dateFilter = {};
    if (dateSelector.start && dateSelector.end) {
      const startDate = new Date(dateSelector.start);
      const endDate = new Date(dateSelector.end);
      endDate.setDate(endDate.getDate() + 1);

      if (dateSelector.option.length) {
        const dateConditions = dateSelector.option.map((option: string) => {
          const column = columnMap[option];
          if (column === "lost_lead") {
            return { [column]: true };
          }
          return {
            [column]: {
              gte: startDate,
              lt: endDate,
            },
          };
        });
        dateFilter = { OR: dateConditions };
      } else {
        dateFilter = {
          OR: dateColumns.map((column) => ({
            [column]: {
              gte: startDate,
              lt: endDate,
            },
          })),
        };
      }
    } else if (dateSelector.option.length) {
      const dateConditions = dateSelector.option.map((option: string) => {
        const column = columnMap[option];
        if (column === "lost_lead") {
          return { [column]: true };
        }
        return { [column]: { not: null } };
      });
      dateFilter = { OR: dateConditions };
    }

    // Modified picFilter to handle archived users
    const picFilter = pic.includes("All")
      ? { PIC: { notIn: archivedUsernames } }
      : {
          PIC: {
            in: pic,
            notIn: archivedUsernames,
          },
        };

    const fetchMavnReports =
      tableSelector === "All" || tableSelector === "MAVN"
        ? prisma.mavn_monthly_report.findMany({
            where: {
              ...picFilter,
              ...dateFilter,
            },
          })
        : Promise.resolve([]);

    const fetchMiReports =
      tableSelector === "All" || tableSelector === "Moving Image"
        ? prisma.mi_monthly_report.findMany({
            where: {
              ...picFilter,
              ...dateFilter,
            },
          })
        : Promise.resolve([]);

    const [mavnReports, miReports] = await Promise.all([
      fetchMavnReports,
      fetchMiReports,
    ]);

    const reports = [...mavnReports, ...miReports].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(reports);
  } catch (error) {
    console.error("API Route: Error fetching reports:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching reports." },
      { status: 500 }
    );
  }
}
