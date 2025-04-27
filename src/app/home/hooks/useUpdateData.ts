import { useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface UpdateDataProps {
  id: number;
  oldSourceTable: string;
  clientName: string;
  industryName: string;
  leadSource: string;
  pic: string;
  meetingsConducted: string;
  lostLead: string;
  proposalSent: string;
  proposalInProgress: string;
  clientLocation: string;
  prospectDate: Date | null;
  meetingDate?: Date | null;
  proposalSentDate?: Date | null;
  proposalInProgressDate?: Date | null;
  proposalSigned?: string;
  proposalSignedDate?: Date | null;
  proposedValue?: number;
  closedSale?: number;
  sourceTable: string;
  sourceOrganization: string;
  notes: string;
  quotationNumber: string;
  type: string;
  organizationName: string;
  organizationWebsite: string;
  clientPhone: string;
  clientEmail: string;
}

const defaultCountryValues = ["Malaysia", "Singapore"];
const defaultLeadSources = [
  "Client Referral",
  "Email",
  "WhatsApp",
  "LinkedIn",
  "Cold Call",
  "Shopee",
  "Instagram",
];

const useUpdateData = (onClose: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = useCallback(
    async (data: UpdateDataProps) => {
      // Trim all string inputs and convert values
      const convertedData = {
        ...data,
        // Trim all string values
        clientName: data.clientName.trim(),
        industryName: data.industryName.trim(),
        leadSource: data.leadSource.trim(),
        pic: data.pic.trim(),
        clientLocation: data.clientLocation.trim(),
        notes: data.notes.trim(),
        quotationNumber: data.quotationNumber.trim(),
        type: data.type.trim(),
        organizationName: data.organizationName.trim(),
        organizationWebsite: data.organizationWebsite.trim(),
        clientPhone: data.clientPhone.trim(),
        clientEmail: data.clientEmail.trim(),
        sourceOrganization: data.sourceOrganization.trim(),
        // Convert boolean strings to actual booleans
        meetingsConducted: data.meetingsConducted.toLowerCase() === "yes",
        proposalSent: data.proposalSent.toLowerCase() === "yes",
        proposalInProgress: data.proposalInProgress.toLowerCase() === "yes",
        proposalSigned: data.proposalSigned?.toLowerCase() === "yes",
        lostLead: data.lostLead.toLowerCase() === "yes",
        // Handle dates
        meetingDate: data.meetingDate ?? undefined,
        proposalSentDate: data.proposalSentDate ?? undefined,
        proposalInProgressDate: data.proposalInProgressDate ?? undefined,
        proposalSignedDate: data.proposalSignedDate ?? undefined,
        // Handle numeric values
        proposedValue: Number(data.proposedValue) || 0,
        closedSale: Number(data.closedSale) || 0,
        // Add user info
        username: user?.username,
        userId: user?.id,

      };

      // Check for custom options
      const customOptions = [];
      if (!defaultCountryValues.includes(convertedData.clientLocation)) {
        customOptions.push({
          type: "country",
          value: convertedData.clientLocation,
        });
      }
      if (!defaultLeadSources.includes(convertedData.leadSource)) {
        customOptions.push({
          type: "leadSource",
          value: convertedData.leadSource,
        });
      }

      try {
        const response = await fetch("/api/update/updateTableData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(convertedData),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        // Invalidate and refetch the dashboard data query
        await queryClient.invalidateQueries({ queryKey: ["dashboardData"] });

        onClose();
      } catch (error) {
        console.error("Error updating data:", error);
        throw error; // Re-throw the error to be caught by the component
      }
    },
    [onClose, user?.username, user?.id, queryClient]
  );

  return handleSubmit;
};

export default useUpdateData;
