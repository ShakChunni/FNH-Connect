import { useCallback } from "react";
import * as XLSX from "xlsx";

const useExcelExport = (tableData: any[]) => {
  const exportTableAsExcel = useCallback(() => {
    const headers = [
      { label: "ID", key: "id" },
      { label: "Organization Name", key: "organization_name" },
      { label: "Campaign Name", key: "campaign_name" },
      { label: "Client's Name", key: "client_name" },
      { label: "Contact Phone", key: "client_contact_number" },
      { label: "Contact Email", key: "client_contact_email" },
      { label: "Website", key: "organization_website" },
      { label: "Industry Name", key: "industry_name" },
      { label: "Location", key: "organization_location" },
      { label: "Lead Source", key: "lead_source" },
      { label: "Prospect Date", key: "prospect_date" },
      { label: "PIC", key: "PIC" },
      { label: "Meetings Conducted", key: "meetings_conducted" },
      { label: "Meeting Date", key: "meeting_date" },
      { label: "Proposal In Progress", key: "proposal_in_progress" },
      { label: "Proposal In Progress Date", key: "proposal_in_progress_date" },
      { label: "Proposal Sent Out", key: "proposal_sent_out" },
      { label: "Proposal Sent Out Date", key: "proposal_sent_out_date" },
      { label: "Quotation Signed", key: "quotation_signed" },
      { label: "Quotation Signed Date", key: "quotation_signed_date" },
      { label: "Quotation Number", key: "quotation_number" },
      { label: "Lost Lead", key: "lost_lead" },
      { label: "Type", key: "type" },
      { label: "Notes", key: "notes" },
      { label: "Total Proposal Value [RM]", key: "total_proposal_value" },
      { label: "Total Closed Sale [RM]", key: "total_closed_sale" },
    ];

    const exportData = tableData.map((row) => {
      const processed: Record<string, any> = {};
      headers.forEach(({ label, key }) => {
        let value = row[key];

        if (
          [
            "meetings_conducted",
            "proposal_in_progress",
            "proposal_sent_out",
            "quotation_signed",
            "lost_lead",
          ].includes(key)
        ) {
          if (value === true) value = "Yes";
          else if (value === false) value = "No";
          else value = "";
        }

        if (key === "total_proposal_value" || key === "total_closed_sale") {
          value =
            value !== null && value !== undefined && value !== 0
              ? `RM ${value}`
              : "";
        }

        if (
          [
            "prospect_date",
            "meeting_date",
            "proposal_in_progress_date",
            "proposal_sent_out_date",
            "quotation_signed_date",
          ].includes(key)
        ) {
          value =
            value && typeof value === "string"
              ? value.slice(0, 10).split("-").reverse().join("/")
              : "";
        }

        if (key === "id") {
          value = `${row.source_table || ""}-${row.id}`;
        }

        if (value === undefined || value === null) value = "";

        processed[label] = value;
      });
      return processed;
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      header: headers.map((h) => h.label),
      skipHeader: false,
    });

    // Set column widths (adjust as needed)
    worksheet["!cols"] = headers.map(() => ({ wch: 24 }));

    // Bold header styling (xlsx uses cell objects for styling)
    headers.forEach((header, idx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
        };
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    // Export as Excel file
    XLSX.writeFile(workbook, "leads_export.xlsx", { bookType: "xlsx" });
  }, [tableData]);

  return { exportTableAsExcel };
};

export default useExcelExport;
