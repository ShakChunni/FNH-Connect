import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  FaTimes,
  FaBuilding,
  FaUserTie,
  FaClipboardList,
  FaFileContract,
  FaMoneyBillWave,
  FaStickyNote,
} from "react-icons/fa";
import { FaCircleInfo } from "react-icons/fa6";
import ReactDOM from "react-dom";

import { motion, AnimatePresence } from "framer-motion";
import ProspectDateDropdown from "@/app/home/EditData/Dropdowns/ProspectDateDropdown";
import LeadSourceDropdown from "@/app/home/EditData/Dropdowns/LeadSourceDropdown";
import PicDropdown from "@/app/home/EditData/Dropdowns/PICDropdown";
import CountryDropdown from "@/app/home/EditData/Dropdowns/CountryDropdown";
import MeetingsConductedDropdown from "@/app/home/EditData/Dropdowns/MeetingsConductedDropdown";
import ProposalSentDropdown from "@/app/home/EditData/Dropdowns/ProposalSentDropdown";
import MeetingDateDropdown from "@/app/home/EditData/Dropdowns/MeetingDateDropdown";
import ProposalSentDateDropdown from "@/app/home/EditData/Dropdowns/ProposalSentDateDropdown";
import ProposalInProgressDateDropdown from "@/app/home/EditData/Dropdowns/ProposalInProgressDateDropdown";
import ProposalInProgressDropdown from "@/app/home/EditData/Dropdowns/ProposalInProgressDropdown";
import ProposalSignedDropdown from "@/app/home/EditData/Dropdowns/ProposalSignedDropdown";
import ProposalSignedDateDropdown from "@/app/home/EditData/Dropdowns/ProposalSignedDateDropdown";
import TypeDropdown from "@/app/home/EditData/Dropdowns/TypeDropdown";
import SourceTableDropdown from "@/app/home/EditData/Dropdowns/SourceTableDropdown";
import SaleFields from "@/app/home/EditData/components/SaleFields";
import useUpdateData from "@/app/home/hooks/useUpdateData";
import useDeleteData from "@/app/home/hooks/useDeleteData";
import useInactiveData from "@/app/home/hooks/useInactiveData";
import useActiveData from "@/app/home/hooks/useActiveData";
import LostLeadDropdown from "@/app/home/EditData/Dropdowns/LostLeadDropdown";
import IndustryDropdown from "./Dropdowns/IndustryDropdown";
import ContactEmailInput from "./components/ContactEmailInput";
import ContactPhoneInput from "./components/ContactPhoneInput";
import { useAuth } from "@/app/AuthContext";
interface EditDataProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: {
    id: number;
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
    organizationName: string;
    organizationWebsite: string;
    clientPhone: string;
    clientEmail: string;
    sourceOrganization?: string;
  }) => void;
  onDelete: (id: number, sourceTable: string) => void;
  onInactive: (
    id: number,
    sourceTable: string,
    pic: string,
    reason: string
  ) => void;
  data: any;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  customOptions: any;
}

const EditData: React.FC<EditDataProps> = ({
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onInactive,
  data,
  onMessage,
  messagePopupRef,
  customOptions,
}) => {
  const { user } = useAuth();
  const [organizationWebsite, setOrganizationWebsite] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [organizationName, setOrganizatioName] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [industryName, setIndustryName] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [quotationNumber, setQuotationNumber] = useState<string>("");
  const [proposedValue, setProposedValue] = useState<number | null>(null);
  const [closedSale, setClosedSale] = useState<number | null>(null);
  const [sourceTable, setSourceTable] = useState<string>("");

  const [leadSource, setLeadSource] = useState<string>("");
  const [organizationLocation, setOrganizationLocation] = useState<string>("");
  const [pic, setPic] = useState<string>("");
  const [meetingsConducted, setMeetingsConducted] = useState<string>("No");
  const [lostLead, setLostLead] = useState<string>("No");
  const [proposalSent, setProposalSent] = useState<string>("No");
  const [proposalInProgress, setProposalInProgress] = useState<string>("No");
  const [prospectDate, setProspectDate] = useState<Date | null>(null);
  const [meetingDate, setMeetingDate] = useState<Date | null>(null);
  const [proposalSentDate, setProposalSentDate] = useState<Date | null>(null);
  const [proposalInProgressDate, setProposalInProgressDate] =
    useState<Date | null>(null);
  const [proposalSigned, setProposalSigned] = useState<string>("No");
  const [proposalSignedDate, setProposalSignedDate] = useState<Date | null>(
    null
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMeetingDateDropdownOpen, setIsMeetingDateDropdownOpen] =
    useState(false);
  const [isProposalSentDropdownOpen, setIsProposalSentDropdownOpen] =
    useState(false);
  const [
    isProposalInProgressDateDropdownOpen,
    setIsProposalInProgressDateDropdownOpen,
  ] = useState(false);
  const [isProposalSignedDropdownOpen, setIsProposalSignedDropdownOpen] =
    useState(false);
  const [isProposalSentDateDropdownOpen, setIsProposalSentDateDropdownOpen] =
    useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const [lastClickTimestamp, setLastClickTimestamp] = useState(0);

  const [meetingsConductedChanged, setMeetingsConductedChanged] =
    useState(false);
  const [lostLeadChanged, setLostLeadChanged] = useState(false);
  const [prospectDateChanged, setProspectDateChanged] = useState(false);
  const [meetingDateChanged, setMeetingDateChanged] = useState(false);
  const [proposalSentChanged, setProposalSentChanged] = useState(false);
  const [proposalInProgressChanged, setProposalInProgressChanged] =
    useState(false);
  const [proposalSignedChanged, setProposalSignedChanged] = useState(false);

  const dateDropdownVariants = {
    hidden: { opacity: 0, height: 0, marginBottom: 0 },
    visible: { opacity: 1, height: "auto", marginBottom: 16 },
  };

  const [isLoading, setIsLoading] = useState(false);
  const updateData = useUpdateData(onClose);
  const deleteData = useDeleteData(onClose, onDelete);
  const inactiveData = useInactiveData(onClose, onInactive);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showInactiveConfirmation, setShowInactiveConfirmation] =
    useState(false); // Add this line
  const confirmationPopupRef = useRef<HTMLDivElement | null>(null);
  const inactiveConfirmationPopupRef = useRef<HTMLDivElement | null>(null); // Add this line
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState<any[]>([]);

  const [deleteReason, setDeleteReason] = useState("");
  const [deleteReasonError, setDeleteReasonError] = useState(false);

  const [inactiveReason, setInactiveReason] = useState("");
  const [inactiveReasonError, setInactiveReasonError] = useState(false);

  const [showActiveConfirmation, setShowActiveConfirmation] = useState(false);
  const activeConfirmationPopupRef = useRef<HTMLDivElement | null>(null);
  const activeData = useActiveData(onClose); // Import and use the hook
  const [industryOptions, setIndustryOptions] = useState<any[]>([]); // Add this line

  useEffect(() => {
    if (!isOpen) {
      setClientName("");
      setIndustryName("");
      setType("");
      setNotes("");
      setQuotationNumber("");
      setProposedValue(null);
      setClosedSale(null);
      setSourceTable("");
      setLeadSource("");
      setOrganizatioName("");
      setOrganizationLocation("");
      setOrganizationWebsite("");
      setClientPhone("");
      setClientEmail("");
      setLeadSource("");
      setPic("");
      setMeetingsConducted("No");
      setLostLead("No");
      setProposalSent("No");
      setProposalInProgress("No");
      setProspectDate(null);
      setMeetingDate(null);
      setProposalSentDate(null);
      setProposalInProgressDate(null);
      setProposalSigned("No");
      setProposalSignedDate(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (data && data.sourceTable) {
      setSourceTable(data.sourceTable);
    }
  }, [data]);

  const handleDelete = useCallback(async () => {
    setDeleteReason(""); // Reset reason when opening dialog
    setDeleteReasonError(false);
    setShowConfirmation(true);
  }, []);

  // Update handleConfirmDelete to check for reason
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteReason.trim()) {
      setDeleteReasonError(true);
      return;
    }
    setIsLoading(true);
    setShowConfirmation(false);
    try {
      await deleteData({
        id: data.id,
        sourceTable: sourceTable,
        pic: pic,
        deleteReason: deleteReason.trim(), // Pass the reason
      });
      onMessage("success", "Data deleted successfully!");
      onDelete(data.id, sourceTable);
      onClose();
    } catch (error) {
      console.error("Error deleting data:", error);
      onMessage(
        "error",
        `Error deleting data: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  }, [
    data.id,
    sourceTable,
    deleteData,
    onDelete,
    onClose,
    onMessage,
    deleteReason,
    pic,
  ]);

  const handleInactive = useCallback(async () => {
    setInactiveReason(""); // Reset reason when opening dialog
    setInactiveReasonError(false);
    setShowInactiveConfirmation(true);
  }, []);

  // Add event.stopPropagation() to both cancel and confirm handlers
  const handleCancelInactive = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setShowInactiveConfirmation(false);
  }, []);

  const handleConfirmInactive = useCallback(
    async (event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }
      if (!inactiveReason.trim()) {
        setInactiveReasonError(true);
        return;
      }
      setIsLoading(true);
      setShowInactiveConfirmation(false);
      try {
        await inactiveData({
          id: data.id,
          sourceTable: sourceTable,
          pic: pic,
          inactiveReason: inactiveReason.trim(),
        });
        onMessage("success", "Data marked as inactive successfully!");
        onInactive(data.id, sourceTable, pic, inactiveReason.trim());
        onClose();
      } catch (error) {
        console.error("Error marking data as inactive:", error);
        onMessage(
          "error",
          `Error marking data as inactive: ${
            error instanceof Error ? error.message : "Please try again."
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      data.id,
      sourceTable,
      inactiveData,
      onInactive,
      onClose,
      onMessage,
      inactiveReason,
      pic,
    ]
  );

  const handleCancelDelete = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const handleActive = useCallback(async () => {
    setShowActiveConfirmation(true);
  }, []);

  const handleConfirmActive = useCallback(async () => {
    setIsLoading(true);
    setShowActiveConfirmation(false);
    try {
      await activeData({
        id: data.id,
        sourceTable: sourceTable,
      });
      onMessage("success", "Data activated successfully!");
      onClose();
    } catch (error) {
      console.error("Error activating data:", error);
      onMessage(
        "error",
        `Error activating data: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [data.id, sourceTable, activeData, onClose, onMessage]);

  const handleCancelActive = useCallback(() => {
    setShowActiveConfirmation(false);
  }, []);

  const handleUpdate = useCallback(async () => {
    try {
      // Step 1: Validate required basic fields first
      const requiredFields = [
        { value: sourceTable?.trim(), name: "Source Table" },
        { value: industryName?.trim(), name: "Industry Name" },
        { value: organizationName?.trim(), name: "Organization Name" },
        { value: organizationLocation?.trim(), name: "Organization Location" },
        { value: clientName?.trim(), name: "Client Name" },
        { value: leadSource?.trim(), name: "Lead Source" },
        { value: pic?.trim(), name: "Sales Rep" },
      ];

      const missingFields = requiredFields
        .filter((field) => !field.value)
        .map((field) => field.name);

      if (missingFields.length > 0) {
        onMessage(
          "error",
          `Please fill in all required fields: ${missingFields.join(", ")}.`
        );
        return;
      }

      // Step 2: Validate contact information is present
      const hasClientContact = clientPhone || clientEmail;
      if (!hasClientContact) {
        onMessage(
          "error",
          "At least one client contact detail (Phone or Email) is required."
        );
        return;
      }

      const currentDate = new Date();

      // Step 3: Define validation helper functions for dates
      const validateDate = (
        date: Date | null,
        dateName: string,
        conditions: { date: Date | null; name: string }[]
      ) => {
        if (!date) return true; // If date is null, no validation needed for chronology

        // Future date check
        if (date > currentDate) {
          onMessage("error", `${dateName} cannot be in the future.`);
          return false;
        }

        // Chronological order check
        for (const condition of conditions) {
          if (condition.date && date < condition.date) {
            onMessage(
              "error",
              `${dateName} cannot be earlier than ${condition.name}.`
            );
            return false;
          }
        }
        return true;
      };

      const validateRequiredDate = (
        condition: boolean,
        date: Date | null,
        dateName: string
      ) => {
        if (condition && !date) {
          onMessage(
            "error",
            `${dateName} is required when ${
              dateName.split(" ")[0]
            } is set to 'Yes'.`
          );
          return false;
        }
        return true;
      };

      // Step 4: Validate all dates in order of workflow
      // Prospect date validation
      if (!validateDate(prospectDate, "Prospect date", [])) return;

      // Meeting date validation
      if (
        !validateDate(meetingDate, "Meeting date", [
          { date: prospectDate, name: "prospect date" },
        ])
      )
        return;

      // Proposal in progress date validation
      if (
        !validateDate(proposalInProgressDate, "Proposal in progress date", [
          { date: prospectDate, name: "prospect date" },
          { date: meetingDate, name: "meeting date" },
        ])
      )
        return;

      // Proposal sent date validation
      if (
        !validateDate(proposalSentDate, "Proposal sent date", [
          { date: prospectDate, name: "prospect date" },
          { date: meetingDate, name: "meeting date" },
          { date: proposalInProgressDate, name: "proposal in progress date" },
        ])
      )
        return;

      // Proposal signed date validation
      if (
        !validateDate(proposalSignedDate, "Proposal signed date", [
          { date: prospectDate, name: "prospect date" },
          { date: meetingDate, name: "meeting date" },
          { date: proposalInProgressDate, name: "proposal in progress date" },
          { date: proposalSentDate, name: "proposal sent date" },
        ])
      )
        return;

      // Step 5: Validate required dates based on corresponding dropdown values
      const meetingsConductedLower = meetingsConducted.toLowerCase();
      const proposalInProgressLower = proposalInProgress.toLowerCase();
      const proposalSentLower = proposalSent.toLowerCase();
      const proposalSignedLower = proposalSigned.toLowerCase();

      if (
        !validateRequiredDate(
          meetingsConductedLower === "yes",
          meetingDate,
          "Meeting date"
        )
      )
        return;

      if (
        !validateRequiredDate(
          proposalInProgressLower === "yes",
          proposalInProgressDate,
          "Proposal in progress date"
        )
      )
        return;

      if (
        !validateRequiredDate(
          proposalSentLower === "yes",
          proposalSentDate,
          "Proposal sent date"
        )
      )
        return;

      if (
        !validateRequiredDate(
          proposalSignedLower === "yes",
          proposalSignedDate,
          "Proposal signed date"
        )
      )
        return;

      // Step 6: Validate business flow logic
      // Proposal In Progress requires Meetings Conducted
      if (
        proposalInProgressLower === "yes" &&
        meetingsConductedLower !== "yes"
      ) {
        onMessage(
          "error",
          "Meetings Conducted must be set to Yes before setting Proposal In Progress to Yes."
        );
        return;
      }

      // Proposal Sent requires Meetings Conducted and Proposal In Progress
      if (
        proposalSentLower === "yes" &&
        (meetingsConductedLower !== "yes" || proposalInProgressLower !== "yes")
      ) {
        onMessage(
          "error",
          "Meetings Conducted and Proposal In Progress must be set to Yes before setting Proposal Sent to Yes."
        );
        return;
      }

      // Proposal Signed requires all previous steps
      if (
        proposalSignedLower === "yes" &&
        (meetingsConductedLower !== "yes" ||
          proposalInProgressLower !== "yes" ||
          proposalSentLower !== "yes")
      ) {
        onMessage(
          "error",
          "Meetings Conducted, Proposal In Progress, and Proposal Sent must be set to Yes before setting Proposal Signed to Yes."
        );
        return;
      }

      // Step 7: Validate sales data
      if (proposalSignedLower === "yes") {
        if (!proposalSignedDate) {
          onMessage(
            "error",
            "Proposal Signed Date is required when Proposal Signed is set to Yes."
          );
          return;
        }

        if (!closedSale || closedSale === 0) {
          onMessage(
            "error",
            "Closed Sale value is required when Proposal Signed is set to Yes."
          );
          return;
        }

        if (!proposedValue && proposedValue !== 0) {
          onMessage(
            "error",
            "Proposed Value should be provided when there's a Closed Sale."
          );
          return;
        }
      } else if (proposalSignedLower === "no" && closedSale && closedSale > 0) {
        onMessage(
          "error",
          "Cannot set Proposal Signed to 'No' when there is a Closed Sale value. Please clear the Closed Sale value first."
        );
        return;
      }

      // Step 8: Submit data if all validations pass
      setIsLoading(true);
      try {
        await updateData({
          id: data.id,
          oldSourceTable: data.source_table,
          clientName,
          industryName,
          leadSource,
          pic,
          meetingsConducted,
          lostLead,
          proposalSent,
          proposalInProgress,
          clientLocation: organizationLocation,
          prospectDate,
          meetingDate,
          proposalSentDate,
          proposalInProgressDate,
          proposalSigned,
          proposalSignedDate,
          proposedValue: proposedValue ?? 0,
          closedSale: closedSale ?? 0,
          sourceTable,
          sourceOrganization: data.source_organization,
          notes,
          quotationNumber,
          type,
          organizationName,
          organizationWebsite,
          clientPhone,
          clientEmail,
        });
        onMessage("success", "Data updated successfully!");
        onClose();
      } catch (error) {
        console.error("Error updating data:", error);
        onMessage("error", "Error updating data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Validation error:", error);
      onMessage(
        "error",
        "An unexpected error occurred during validation. Please try again."
      );
      setIsLoading(false);
    }
  }, [
    clientName,
    industryName,
    organizationName,
    organizationWebsite,
    organizationLocation,
    clientPhone,
    clientEmail,
    leadSource,
    pic,
    meetingsConducted,
    lostLead,
    proposalSent,
    proposalInProgress,
    prospectDate,
    meetingDate,
    proposalSentDate,
    proposalInProgressDate,
    proposalSigned,
    proposalSignedDate,
    proposedValue,
    closedSale,
    notes,
    quotationNumber,
    type,
    sourceTable,
    updateData,
    onMessage,
    onClose,
    data.id,
    data.source_organization,
    data.source_table,
  ]);

  useEffect(() => {
    if (data && isOpen) {
      // Organization details
      setOrganizatioName(data.organization_name || ""); // Note this is misspelled in state declaration
      setOrganizationWebsite(data.organization_website || "");
      setOrganizationLocation(data.organization_location || "");
      setIndustryName(data.industry_name || "");

      // Client details
      setClientName(data.client_name || "");
      setClientPhone(data.client_contact_number || "");
      setClientEmail(data.client_contact_email || "");
      setPic(data.PIC || "");

      // Lead details
      setSourceTable(data.source_table || "");
      setLeadSource(data.lead_source || "");
      setType(data.type || "");
      setProspectDate(data.prospect_date ? new Date(data.prospect_date) : null);

      // Proposal stages
      setMeetingsConducted(data.meetings_conducted ? "Yes" : "No");
      setMeetingDate(data.meeting_date ? new Date(data.meeting_date) : null);
      setProposalInProgress(data.proposal_in_progress ? "Yes" : "No");
      setProposalInProgressDate(
        data.proposal_in_progress_date
          ? new Date(data.proposal_in_progress_date)
          : null
      );
      setProposalSent(data.proposal_sent_out ? "Yes" : "No");
      setProposalSentDate(
        data.proposal_sent_out_date
          ? new Date(data.proposal_sent_out_date)
          : null
      );
      setProposalSigned(data.quotation_signed ? "Yes" : "No");
      setProposalSignedDate(
        data.quotation_signed_date ? new Date(data.quotation_signed_date) : null
      );
      setLostLead(data.lost_lead ? "Yes" : "No");

      // Financials
      setQuotationNumber(data.quotation_number || "");
      setProposedValue(data.total_proposal_value || null);
      setClosedSale(data.total_closed_sale || null);

      // Additional info
      setNotes(data.notes || "");
    }
  }, [data, isOpen]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const currentTimestamp = Date.now();

      // Prevent closing on rapid successive clicks
      if (currentTimestamp - lastClickTimestamp < 50) {
        return;
      }

      // Check if the click is outside the main popup and the message popup, and if confirmation popup exists, check that too
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !isDropdownOpen &&
        !(
          messagePopupRef.current &&
          messagePopupRef.current.contains(event.target as Node)
        ) &&
        !(
          confirmationPopupRef.current &&
          confirmationPopupRef.current.contains(event.target as Node)
        ) // Add check for confirmation popup
      ) {
        onClose();
      }
    },
    [isDropdownOpen, lastClickTimestamp, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleDropdownToggle = useCallback((isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
    setLastClickTimestamp(Date.now());
  }, []);

  const handleSelectOrganizationLocation = (location: string) => {
    setOrganizationLocation(location);
  };

  const handleMeetingsConductedChange = useCallback((value: string) => {
    setMeetingsConducted(value);
    setMeetingsConductedChanged(true);
    if (value === "Yes") {
      setMeetingDateChanged(true);
      setMeetingDate(null);
    } else {
      setMeetingDateChanged(false);
      setMeetingDate(null);
    }
  }, []);

  const handleLostLeadChange = useCallback((value: string) => {
    setLostLead(value);
    setLostLeadChanged(true);
  }, []);

  const handleProspectDateChange = useCallback((value: Date) => {
    setProspectDate(value);
    setProspectDateChanged(true);
  }, []);

  const handleMeetingDateChange = useCallback((value: Date | null) => {
    setMeetingDate(value);
    setMeetingDateChanged(true);
  }, []);

  const handleProposalSentChange = useCallback((value: string) => {
    setProposalSent(value);
    setProposalSentChanged(true);
    if (value === "Yes") {
      setProposalSentChanged(true);
      setProposalSentDate(null);
    } else {
      setProposalSentChanged(false);
      setProposalSentDate(null);
    }
  }, []);

  const handleProposalInProgressChange = useCallback((value: string) => {
    setProposalInProgress(value);
    setProposalInProgressChanged(true);
    if (value === "Yes") {
      setProposalInProgressChanged(true);
      setProposalInProgressDate(null);
    } else {
      setProposalInProgressChanged(false);
      setProposalInProgressDate(null);
    }
  }, []);

  const handleProposalSignedChange = useCallback((value: string) => {
    setProposalSigned(value);
    setProposalSignedChanged(true);
    if (value === "No") {
      // Only clear the date when changing from "Yes" to "No"
      setProposalSignedChanged(false);
      setProposalSignedDate(null);
    }
    // When changing to "Yes", keep any existing date
  }, []);

  const handleProposalSentDateChange = useCallback((value: Date | null) => {
    setProposalSentDate(value);
    setIsProposalSentDateDropdownOpen(value !== null);
  }, []);

  useEffect(() => {
    if (!customOptions || customOptions.length === 0) return;

    setTimeout(() => {
      const uniqueCountryOptions = Array.from(
        new Set(
          customOptions
            .filter((option: any) => option.type === "country")
            .map((option: any) => option.data)
        )
      ).map((data) => ({ type: "country", data }));

      const uniqueLeadSourceOptions = Array.from(
        new Set(
          customOptions
            .filter((option: any) => option.type === "leadSource")
            .map((option: any) => option.data)
        )
      ).map((data) => ({ type: "leadSource", data }));

      // Add this block
      const uniqueIndustryOptions = Array.from(
        new Set(
          customOptions
            .filter((option: any) => option.type === "industry")
            .map((option: any) => option.data)
        )
      ).map((data) => ({ type: "industry", data }));

      setCountryOptions(uniqueCountryOptions);
      setLeadSourceOptions(uniqueLeadSourceOptions);
      setIndustryOptions(uniqueIndustryOptions); // Add this line
    }, 500);
  }, [customOptions]);

  const getDisplayValue = (value: string) => {
    switch (value.toLowerCase()) {
      case "mi":
        return "TMI";
      case "mavn":
        return "MAVN";
      default:
        return value;
    }
  };

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-[#2A3136] font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm";

    return (value: string) => {
      // For filled inputs with green highlight
      if (value) {
        return `bg-white border-2 border-green-600 ${baseStyle}`;
      }
      // For empty inputs with standard styling
      return `bg-gray-50 border border-gray-300 ${baseStyle}`;
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.3, ease: "easeInOut" },
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={popupRef}
            className="bg-white rounded-lg shadow-lg p-6 w-[90%] md:w-[70%] lg:w-[40%] h-[90%] popup-content overflow-y-auto relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{
              scale: 0.8,
              opacity: 0,
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-blue-950">
                Edit Data
              </h2>
              <div className="flex items-center">
                <div className="mr-2 md:mr-4">
                  <SourceTableDropdown
                    onSelect={setSourceTable}
                    defaultValue={getDisplayValue(sourceTable)}
                    onDropdownToggle={handleDropdownToggle}
                    onDropdownOpenStateChange={setIsDropdownOpen}
                  />
                  <span className="absolute top-5 right-14 md:right-[70px] text-red-500">
                    *
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="bg-white text-red-500 font-bold py-1 px-2 rounded-lg flex items-center justify-center transition duration-300 ease-in-out hover:cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, color: "#b91c1c" }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaTimes className="text-xl sm:text-2xl" />
                  </motion.div>
                </button>
              </div>
            </div>

            {/* Organization Details Section */}
            <div className="mb-8">
              <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span>Organization Details</span>
                <FaBuilding className="text-blue-800" />
              </h3>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Organization Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClassName(organizationName)}
                  value={organizationName}
                  onChange={(e) => setOrganizatioName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Industry Name<span className="text-red-500">*</span>
                </label>
                <IndustryDropdown
                  onSelect={setIndustryName}
                  defaultValue={industryName}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  options={industryOptions.map((option: any) => option.data)}
                  onNotification={(message, type) => {
                    onMessage(type as "success" | "error", message);
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Organization Location<span className="text-red-500">*</span>
                </label>
                <CountryDropdown
                  onSelect={handleSelectOrganizationLocation}
                  defaultValue={organizationLocation}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  options={countryOptions.map((option: any) => option.data)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Organization Website
                </label>
                <input
                  type="text"
                  className={inputClassName(organizationWebsite)}
                  value={organizationWebsite}
                  onChange={(e) => setOrganizationWebsite(e.target.value)}
                  placeholder="Enter organization website"
                />
              </div>
            </div>

            {/* Client Information Section */}
            <div className="mb-8">
              <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span>Client Information (PIC)</span>
                <FaUserTie className="text-green-800" />
              </h3>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Client Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClassName(clientName)}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter full name of the client"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Client Phone
                </label>
                <ContactPhoneInput
                  value={clientPhone}
                  onChange={setClientPhone}
                  defaultCountry="MY"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Client Email
                </label>
                <ContactEmailInput
                  value={clientEmail}
                  onChange={setClientEmail}
                  placeholder="Enter email address"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  <span className="relative">
                    Sales Rep
                    <span
                      className="absolute text-red-500"
                      style={{ top: "-0.3em", right: "-0.5em" }}
                    >
                      *
                    </span>
                  </span>
                </label>
                <PicDropdown
                  onSelect={setPic}
                  defaultValue={pic}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                />
              </div>
            </div>

            {/* Lead Details Section */}
            <div className="mb-8">
              <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span>Lead Details</span>
                <FaClipboardList className="text-purple-800" />
              </h3>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Lead Source<span className="text-red-500">*</span>
                </label>
                <LeadSourceDropdown
                  onSelect={setLeadSource}
                  defaultValue={leadSource}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  options={leadSourceOptions.map((option: any) => option.data)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Service Type
                </label>
                <TypeDropdown
                  onSelect={setType}
                  defaultValue={type}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Prospect Date
                </label>
                <ProspectDateDropdown
                  onSelect={handleProspectDateChange}
                  defaultValue={prospectDate}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  hasChanged={prospectDateChanged}
                  onMessage={onMessage}
                  messagePopupRef={messagePopupRef}
                />
              </div>
            </div>

            {/* Proposal Stage Section */}
            <div className="mb-8">
              <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span>Proposal Stage</span>
                <FaFileContract className="text-amber-700" />
              </h3>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Meetings Conducted
                </label>
                <MeetingsConductedDropdown
                  onSelect={handleMeetingsConductedChange}
                  defaultValue={meetingsConducted}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  hasChanged={meetingsConductedChanged}
                />
              </div>

              <AnimatePresence initial={false}>
                {meetingsConducted === "Yes" && (
                  <motion.div
                    className=""
                    variants={dateDropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Meeting Date<span className="text-red-500">*</span>
                    </label>
                    <MeetingDateDropdown
                      onSelect={handleMeetingDateChange}
                      defaultValue={meetingDate}
                      prospectDate={prospectDate}
                      onDropdownToggle={(isOpen) => {
                        handleDropdownToggle(isOpen);
                        setIsMeetingDateDropdownOpen(isOpen);
                      }}
                      onDropdownOpenStateChange={setIsDropdownOpen}
                      hasChanged={meetingDateChanged}
                      onMessage={onMessage}
                      messagePopupRef={messagePopupRef}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Proposal In Progress
                </label>
                <ProposalInProgressDropdown
                  onSelect={handleProposalInProgressChange}
                  defaultValue={proposalInProgress}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  hasChanged={proposalInProgressChanged}
                />
              </div>

              <AnimatePresence initial={false}>
                {proposalInProgress === "Yes" && !isMeetingDateDropdownOpen && (
                  <motion.div
                    className=""
                    variants={dateDropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Proposal In Progress Date
                      <span className="text-red-500">*</span>
                    </label>
                    <ProposalInProgressDateDropdown
                      onSelect={setProposalInProgressDate}
                      defaultValue={proposalInProgressDate}
                      prospectDate={prospectDate}
                      meetingDate={meetingDate}
                      onDropdownToggle={(isOpen) => {
                        handleDropdownToggle(isOpen);
                        setIsProposalInProgressDateDropdownOpen(isOpen);
                      }}
                      onDropdownOpenStateChange={setIsDropdownOpen}
                      hasChanged={proposalInProgressChanged}
                      onMessage={onMessage}
                      messagePopupRef={messagePopupRef}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Proposal Sent
                </label>
                <ProposalSentDropdown
                  onSelect={handleProposalSentChange}
                  defaultValue={proposalSent}
                  onDropdownToggle={(isOpen) => {
                    handleDropdownToggle(isOpen);
                    setIsProposalSentDropdownOpen(isOpen);
                  }}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  hasChanged={proposalSentChanged}
                />
              </div>

              <AnimatePresence initial={false}>
                {proposalSent === "Yes" &&
                  !isMeetingDateDropdownOpen &&
                  !isProposalInProgressDateDropdownOpen && (
                    <motion.div
                      className=""
                      variants={dateDropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                        Proposal Sent Date
                        <span className="text-red-500">*</span>
                      </label>
                      <ProposalSentDateDropdown
                        onSelect={handleProposalSentDateChange}
                        defaultValue={proposalSentDate}
                        prospectDate={prospectDate}
                        meetingDate={meetingDate}
                        proposalInProgressDate={proposalInProgressDate}
                        onDropdownToggle={(isOpen) => {
                          handleDropdownToggle(isOpen);
                          setIsProposalSentDateDropdownOpen(isOpen);
                        }}
                        onDropdownOpenStateChange={setIsDropdownOpen}
                        hasChanged={proposalSentChanged}
                        onMessage={onMessage}
                        messagePopupRef={messagePopupRef}
                      />
                    </motion.div>
                  )}
              </AnimatePresence>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Proposal Signed
                </label>
                <ProposalSignedDropdown
                  onSelect={handleProposalSignedChange}
                  defaultValue={proposalSigned}
                  closedSale={closedSale}
                  onDropdownToggle={(isOpen) => {
                    handleDropdownToggle(isOpen);
                    setIsProposalSignedDropdownOpen(isOpen);
                  }}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  hasChanged={proposalSignedChanged}
                />
              </div>

              <AnimatePresence initial={false}>
                {proposalSigned === "Yes" &&
                  !isMeetingDateDropdownOpen &&
                  !isProposalInProgressDateDropdownOpen &&
                  !isProposalSentDateDropdownOpen && (
                    <motion.div
                      className=""
                      variants={dateDropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                        Proposal Signed Date
                        <span className="text-red-500">*</span>
                      </label>
                      <ProposalSignedDateDropdown
                        onSelect={setProposalSignedDate}
                        defaultValue={proposalSignedDate}
                        prospectDate={prospectDate}
                        meetingDate={meetingDate}
                        proposalInProgressDate={proposalInProgressDate}
                        proposalSentDate={proposalSentDate}
                        onDropdownToggle={(isOpen) => {
                          handleDropdownToggle(isOpen);
                          setIsProposalSignedDropdownOpen(isOpen);
                        }}
                        onDropdownOpenStateChange={setIsDropdownOpen}
                        hasChanged={proposalSignedChanged}
                        onMessage={onMessage}
                        messagePopupRef={messagePopupRef}
                      />
                    </motion.div>
                  )}
              </AnimatePresence>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Lost Lead
                </label>
                <LostLeadDropdown
                  onSelect={handleLostLeadChange}
                  defaultValue={lostLead}
                  onDropdownToggle={handleDropdownToggle}
                  onDropdownOpenStateChange={setIsDropdownOpen}
                  hasChanged={lostLeadChanged}
                />
              </div>
            </div>

            {/* Financials Section */}
            <div className="mb-8">
              <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span>Financials</span>
                <FaMoneyBillWave className="text-emerald-700" />
              </h3>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Quotation Number#
                </label>
                <input
                  type="text"
                  className={inputClassName(quotationNumber)}
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  placeholder="Enter Quotation Number"
                />
              </div>

              <SaleFields
                proposedValue={proposedValue}
                closedSale={closedSale}
                onProposedValueChange={setProposedValue}
                onClosedSaleChange={setClosedSale}
                proposalSigned={proposalSigned}
              />
            </div>

            {/* Additional Notes Section */}
            <div className="mb-8">
              <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span>Additional Notes</span>
                <FaStickyNote className="text-yellow-600" />
              </h3>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Notes
                </label>
                <textarea
                  className={inputClassName(notes)}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter Notes"
                  rows={3}
                  style={{ minHeight: "100px" }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                {user?.role === "admin" && (
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={data?.isInactive ? handleActive : handleInactive}
                  className={`${
                    data?.isInactive
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  } text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto`}
                >
                  {data?.isInactive ? "Unarchive" : "Archive"}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className={`bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="dot-1"></span>
                      <span className="dot-2"></span>
                      <span className="dot-3"></span>
                    </span>
                  ) : (
                    "Update Data"
                  )}
                </button>
              </div>
            </div>

            {/* Confirmation Modals */}
            {ReactDOM.createPortal(
              <AnimatePresence>
                {showConfirmation && (
                  <motion.div
                    ref={confirmationPopupRef}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <h2 className="text-xl font-bold mb-4">
                        Confirm Deletion
                      </h2>
                      <p className="mb-4">
                        Please provide a reason for deletion:
                      </p>
                      <textarea
                        className={`w-full p-2 border rounded-lg mb-2 ${
                          deleteReasonError
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-blue-900`}
                        rows={4}
                        value={deleteReason}
                        onChange={(e) => {
                          setDeleteReason(e.target.value);
                          setDeleteReasonError(false);
                        }}
                        placeholder="Enter reason for deletion..."
                      />
                      {deleteReasonError && (
                        <p className="text-red-500 text-sm mb-4">
                          Please provide a reason for deletion...
                        </p>
                      )}
                      <div className="flex justify-end space-x-4 mt-4">
                        <button
                          onClick={handleCancelDelete}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmDelete}
                          className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <span className="dot-1"></span>
                              <span className="dot-2"></span>
                              <span className="dot-3"></span>
                            </span>
                          ) : (
                            "Yes, Delete"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}

            {ReactDOM.createPortal(
              <AnimatePresence>
                {showInactiveConfirmation && (
                  <motion.div
                    ref={confirmationPopupRef}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <h2 className="text-xl text-gray-700 font-bold mb-4">
                        Confirm Status Change{" "}
                      </h2>
                      <textarea
                        className={`w-full p-2 border rounded-lg mb-2 ${
                          inactiveReasonError
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-blue-900`}
                        rows={4}
                        value={inactiveReason}
                        onChange={(e) => {
                          setInactiveReason(e.target.value);
                          setInactiveReasonError(false);
                        }}
                        placeholder="Provide a reason for marking this as archive..."
                      />
                      {inactiveReasonError && (
                        <p className="text-red-500 text-sm mb-4">
                          Please provide a reason for marking this as archive!
                        </p>
                      )}
                      <div className="flex items-center mb-4">
                        <FaCircleInfo className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-xs text-gray-500">
                          Marking this lead as archive will exclude it from the
                          stats.
                        </span>
                      </div>
                      <div className="flex justify-end space-x-4 mt-4">
                        <button
                          onClick={handleCancelInactive}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmInactive}
                          className={`px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <span className="dot-1"></span>
                              <span className="dot-2"></span>
                              <span className="dot-3"></span>
                            </span>
                          ) : (
                            "Yes, Inactivate"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}

            {ReactDOM.createPortal(
              <AnimatePresence>
                {showActiveConfirmation && (
                  <motion.div
                    ref={confirmationPopupRef}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <h2 className="text-xl font-bold mb-4">
                        Confirm Activation
                      </h2>
                      <p className="mb-4">
                        Are you sure you want to activate this data?
                      </p>
                      <div className="flex justify-end space-x-4 mt-4">
                        <button
                          onClick={handleCancelActive}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmActive}
                          className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <span className="dot-1"></span>
                              <span className="dot-2"></span>
                              <span className="dot-3"></span>
                            </span>
                          ) : (
                            "Yes, Activate"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditData;
