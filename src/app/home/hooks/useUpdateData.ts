import { useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface UpdateDataProps {
  id: number;
  organizationId: number | null;
  organizationName: string;
  campaignName: string;
  organizationWebsite: string;
  organizationLocation: string;
  industryName: string;
  clientId: number | null;
  clientName: string;
  clientPosition: string;
  clientPhone: string;
  clientEmail: string;
  leadSource: string;
  pic: string;
  meetingsConducted: string;
  lostLead: string;
  proposalSent: string;
  proposalInProgress: string;
  prospectDate: Date | null;
  meetingDate: Date | null;
  proposalSentDate: Date | null;
  proposalInProgressDate: Date | null;
  proposalSigned: string;
  proposalSignedDate: Date | null;
  proposedValue: number;
  closedSale: number;
  sourceTable: string;
  sourceOrganization: string;
  notes: string;
  quotationNumber: string;
  type: string;
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

  const formatDateOnly = (date: Date | null | undefined) =>
    date ? date.toISOString().slice(0, 10) : null;

  const handleSubmit = useCallback(
    async (data: UpdateDataProps) => {
      // Trim all string inputs and convert values
      const convertedData = {
        ...data,
        organizationId: data.organizationId,
        clientId: data.clientId,
        organizationName: data.organizationName.trim(),
        campaignName: data.campaignName.trim(),
        organizationWebsite: data.organizationWebsite.trim(),
        organizationLocation: data.organizationLocation.trim(),
        industryName: data.industryName.trim(),
        clientName: data.clientName.trim(),
        clientPosition: data.clientPosition.trim(),
        clientPhone: data.clientPhone.trim(),
        clientEmail: data.clientEmail.trim(),
        leadSource: data.leadSource.trim(),
        pic: data.pic.trim(),
        notes: data.notes.trim(),
        quotationNumber: data.quotationNumber.trim(),
        type: data.type.trim(),
        sourceOrganization: data.sourceOrganization?.trim() ?? "",
        // Convert boolean strings to actual booleans
        meetingsConducted: data.meetingsConducted.toLowerCase() === "yes",
        proposalSent: data.proposalSent.toLowerCase() === "yes",
        proposalInProgress: data.proposalInProgress.toLowerCase() === "yes",
        proposalSigned: data.proposalSigned?.toLowerCase() === "yes",
        lostLead: data.lostLead?.toLowerCase() === "yes",
        // Handle dates
        prospectDate: formatDateOnly(data.prospectDate),
        meetingDate: formatDateOnly(data.meetingDate),
        proposalSentDate: formatDateOnly(data.proposalSentDate),
        proposalInProgressDate: formatDateOnly(data.proposalInProgressDate),
        proposalSignedDate: formatDateOnly(data.proposalSignedDate),
        // Handle numeric values
        proposedValue: Number(data.proposedValue) || 0,
        closedSale: Number(data.closedSale) || 0,
        // Add user info
        username: user?.username,
        userId: user?.id,
      };

      // Check for custom options
      const customOptions = [];
      if (
        convertedData.organizationLocation &&
        !defaultCountryValues.includes(convertedData.organizationLocation)
      ) {
        customOptions.push({
          type: "country",
          value: convertedData.organizationLocation,
        });
      }
      if (
        convertedData.leadSource &&
        !defaultLeadSources.includes(convertedData.leadSource)
      ) {
        customOptions.push({
          type: "leadSource",
          value: convertedData.leadSource,
        });
      }
      if (convertedData.industryName) {
        customOptions.push({
          type: "industry",
          value: convertedData.industryName,
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
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.statusText}`);
        }

        // If there are custom options, send them to the customData endpoint
        if (customOptions.length > 0) {
          const customResponse = await fetch("/api/add/customData", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ customOptions }),
          });

          if (!customResponse.ok) {
            console.warn(
              "Failed to save custom options, but main data was updated"
            );
          }
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
