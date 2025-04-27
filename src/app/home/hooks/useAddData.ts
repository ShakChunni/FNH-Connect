import { useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface AddDataProps {
  organizationName: string;
  organizationWebsite: string;
  organizationLocation: string;
  industryName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  leadSource: string;
  pic: string;
  meetingsConducted: string;
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

const useAddData = (onClose: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = useCallback(
    async (data: AddDataProps) => {
      // Trim all string inputs
      const convertedData = {
        ...data,
        organizationName: data.organizationName.trim(),
        organizationWebsite: data.organizationWebsite.trim(),
        organizationLocation: data.organizationLocation.trim(),
        industryName: data.industryName.trim(),
        clientName: data.clientName.trim(),
        clientPhone: data.clientPhone.trim(),
        clientEmail: data.clientEmail.trim(),
        leadSource: data.leadSource.trim(),
        pic: data.pic.trim(),
        notes: data.notes.trim(),
        quotationNumber: data.quotationNumber.trim(),
        type: data.type.trim(),
        // Convert boolean strings to actual booleans
        meetingsConducted: data.meetingsConducted.toLowerCase() === "yes",
        proposalSent: data.proposalSent.toLowerCase() === "yes",
        proposalInProgress: data.proposalInProgress.toLowerCase() === "yes",
        proposalSigned: data.proposalSigned?.toLowerCase() === "yes",
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
      if (!defaultCountryValues.includes(convertedData.organizationLocation)) {
        customOptions.push({
          type: "country",
          value: convertedData.organizationLocation,
        });
      }
      if (!defaultLeadSources.includes(convertedData.leadSource)) {
        customOptions.push({
          type: "leadSource",
          value: convertedData.leadSource,
        });
      }

      try {
        const response = await fetch("/api/add/newData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(convertedData),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
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
            throw new Error(`Error: ${customResponse.statusText}`);
          }
        }

        // Invalidate and refetch the dashboard data query
        await queryClient.invalidateQueries({ queryKey: ["dashboardData"] });

        onClose();
      } catch (error) {
        console.error("Error adding data:", error);
        throw error; // Re-throw the error to be caught by the component
      }
    },
    [onClose, user?.username, user?.id, queryClient]
  );

  return handleSubmit;
};

export default useAddData;
