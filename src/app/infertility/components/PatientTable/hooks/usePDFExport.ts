import { useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const usePDFExport = (tableData: any[]) => {
  const exportTableAsPDF = useCallback(() => {
    const doc = new jsPDF();

    const headers = [
      "ID",
      "Client's Name",
      "Client's Location",
      "Lead Source",
      "Prospect Date",
      "PIC",
      "Meetings Conducted",
      "Meeting Date",
      "Proposal In Progress",
      "Proposal In Progress Date",
      "Proposal Sent Out",
      "Proposal Sent Out Date",
      "Quotation Signed",
      "Quotation Signed Date",
      "Quotation Number",
      "Type",
      "Notes",
      "Total Proposal Value [RM]",
      "Total Closed Sale [RM]",
    ];

    const rows = tableData.map((row) => [
      `${row.source_table}-${row.id}`, // ID
      row.client_name, // Client's Name
      row.client_location, // Client's Location
      row.lead_source, // Lead Source
      row.prospect_date, // Prospect Date
      row.PIC, // PIC
      row.meetings_conducted !== null
        ? row.meetings_conducted
          ? "Yes"
          : "No"
        : "", // Meetings Conducted
      row.meeting_date, // Meeting Date
      row.proposal_in_progress !== null
        ? row.proposal_in_progress
          ? "Yes"
          : "No"
        : "", // Proposal In Progress
      row.proposal_in_progress_date, // Proposal In Progress Date
      row.proposal_sent_out !== null
        ? row.proposal_sent_out
          ? "Yes"
          : "No"
        : "", // Proposal Sent Out
      row.proposal_sent_out_date, // Proposal Sent Out Date
      row.quotation_signed !== null
        ? row.quotation_signed
          ? "Yes"
          : "No"
        : "", // Quotation Signed
      row.quotation_signed_date, // Quotation Signed Date
      row.quotation_number || "", // Quotation Number
      row.type || "", // Type
      row.notes || "", // Notes
      row.total_proposal_value !== null && row.total_proposal_value !== 0
        ? `RM ${row.total_proposal_value}`
        : "", // Total Proposal Value [RM]
      row.total_closed_sale !== null && row.total_closed_sale !== 0
        ? `RM ${row.total_closed_sale}`
        : "", // Total Closed Sale [RM]
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
    });

    doc.save("table_data.pdf");
  }, [tableData]);

  return { exportTableAsPDF };
};

export default usePDFExport;
