import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  X,
  Building2,
  User,
  ClipboardList,
  FileText,
  DollarSign,
  StickyNote,
  Info,
  Users,
  Save,
  XCircle,
  MoreVertical,
  Loader2,
  UserCircle,
} from "lucide-react";
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
import OrganizationInformation, {
  OrganizationData,
} from "./components/OrganizationInformation";
import ClientInformation from "./components/ClientInformation/ClientInformation";
import { ClientData } from "./components/ClientInformation/hooks/useClientDropdown";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useMediaQuery } from "react-responsive";
import { useAuth } from "@/app/AuthContext";
import { createPortal } from "react-dom";

interface EditDataProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: {
    id: number;
    clientName: string;
    clientPosition: string;
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
    campaignName: string;
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
  picList?: string[];
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
  picList,
}) => {
  const { user } = useAuth();

  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    id: null,
    name: "",
    website: "",
    location: "",
    industry: "",
    campaignName: "",
    lead_source: "",
    contacts: [],
  });

  const [clientData, setClientData] = useState<ClientData>({
    id: null,
    name: "",
    position: "",
    phone: "",
    email: "",
  });
  const [leadSourceAutofilled, setLeadSourceAutofilled] = useState(false);
  const [intersectionTimeout, setIntersectionTimeout] =
    useState<NodeJS.Timeout | null>(null);

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
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(true);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);

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
    hidden: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      overflow: "hidden",
    },
    visible: {
      opacity: 1,
      height: "auto",
      marginBottom: 16,
      overflow: "visible",
    },
  };

  const [userClickedSection, setUserClickedSection] = useState<string | null>(
    null
  );
  const [userClickTimeout, setUserClickTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const [borderColor, setBorderColor] = useState("border-gray-300");

  const [activeSection, setActiveSection] = useState("organization");

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

  const sections = useMemo(
    () => [
      {
        id: "organization",
        label: "Organization",
        icon: Building2,
        color: "blue",
      },
      { id: "client", label: "Client Info", icon: User, color: "indigo" },
      {
        id: "lead",
        label: "Lead Details",
        icon: ClipboardList,
        color: "purple",
      },
      {
        id: "proposal",
        label: "Proposal Stage",
        icon: FileText,
        color: "pink",
      },
      {
        id: "financials",
        label: "Financials & Notes",
        icon: DollarSign,
        color: "emerald",
      },
    ],
    []
  );

  const [showActiveConfirmation, setShowActiveConfirmation] = useState(false);
  const activeConfirmationPopupRef = useRef<HTMLDivElement | null>(null);
  const activeData = useActiveData(onClose); // Import and use the hook
  const [industryOptions, setIndustryOptions] = useState<any[]>([]); // Add this line
  const mobileActionsButtonRef = useRef<HTMLButtonElement>(null);
  const mobileActionsDropdownRef = useRef<HTMLDivElement>(null);
  const [mobileDropdownPosition, setMobileDropdownPosition] = useState({
    bottom: 0,
    right: 0,
  });

  const updateMobileDropdownPosition = useCallback(() => {
    if (mobileActionsButtonRef.current) {
      const rect = mobileActionsButtonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      setMobileDropdownPosition({
        bottom: windowHeight - rect.top + 8, // 8px gap above the button
        right: windowWidth - rect.right, // Align right edge with button
      });
    }
  }, []);

  // Update the existing handleClickOutside function to include the mobile dropdown
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const currentTimestamp = Date.now();

      // Prevent closing on rapid successive clicks
      if (currentTimestamp - lastClickTimestamp < 50) {
        return;
      }

      // Check mobile actions dropdown
      if (
        showMobileActions &&
        mobileActionsDropdownRef.current &&
        !mobileActionsDropdownRef.current.contains(event.target as Node) &&
        mobileActionsButtonRef.current &&
        !mobileActionsButtonRef.current.contains(event.target as Node)
      ) {
        setShowMobileActions(false);
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
        ) &&
        !(
          inactiveConfirmationPopupRef.current &&
          inactiveConfirmationPopupRef.current.contains(event.target as Node)
        ) &&
        !(
          activeConfirmationPopupRef.current &&
          activeConfirmationPopupRef.current.contains(event.target as Node)
        ) &&
        !(
          mobileActionsDropdownRef.current &&
          mobileActionsDropdownRef.current.contains(event.target as Node)
        )
      ) {
        onClose();
      }
    },
    [
      isDropdownOpen,
      lastClickTimestamp,
      onClose,
      messagePopupRef,
      showMobileActions,
    ]
  );

  // Add effect to update position when dropdown opens
  useEffect(() => {
    if (showMobileActions) {
      updateMobileDropdownPosition();
      window.addEventListener("resize", updateMobileDropdownPosition);
      window.addEventListener("scroll", updateMobileDropdownPosition);

      return () => {
        window.removeEventListener("resize", updateMobileDropdownPosition);
        window.removeEventListener("scroll", updateMobileDropdownPosition);
      };
    }
  }, [showMobileActions, updateMobileDropdownPosition]);

  useEffect(() => {
    if (!isOpen) {
      setOrganizationData({
        id: null,
        name: "",
        website: "",
        location: "",
        industry: "",
        campaignName: "",
        lead_source: "",
        contacts: [],
      });
      setClientData({
        id: null,
        name: "",
        position: "",
        phone: "",
        email: "",
      });
      setType("");
      setNotes("");
      setIsPhoneValid(true);
      setIsEmailValid(true);
      setQuotationNumber("");
      setProposedValue(null);
      setClosedSale(null);
      setSourceTable("");
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

  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isMd = useMediaQuery({ minWidth: 640, maxWidth: 1023 });
  const isLg = useMediaQuery({ minWidth: 1024, maxWidth: 1279 });
  const isXl = useMediaQuery({ minWidth: 1280, maxWidth: 1536 });
  const is2xl = useMediaQuery({ minWidth: 1536 });

  // Add tooltip styling functions (exactly from MetricCard)
  const getResponsiveFontSize = () => {
    if (isMobile) return "11px";
    if (isMd) return "12px";
    if (isLg) return "13px";
    if (isXl) return "14px";
    if (is2xl) return "15px";
    return "12px";
  };

  const getTitlePadding = () => {
    if (isMobile) return "6px";
    if (isMd) return "7px";
    if (isLg) return "8px";
    if (isXl) return "9px";
    if (is2xl) return "10px";
    return "8px";
  };

  useEffect(() => {
    if (organizationData.lead_source && organizationData.id) {
      // If organization has lead_source and it's a selected organization, autofill and disable

      setLeadSource(organizationData.lead_source);
      setLeadSourceAutofilled(true);
    } else {
      // For any other case (cleared name, new org, etc.), clear lead source

      setLeadSource("");
      setLeadSourceAutofilled(false);
    }
  }, [
    organizationData.lead_source,
    organizationData.id,
    organizationData.name,
  ]);

  const titleTooltipStyle = {
    borderRadius: "12px",
    backgroundColor: "rgb(229, 231, 235)", // gray-200
    color: "rgb(55, 65, 81)",
    padding: getTitlePadding(),
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    zIndex: 50,
    maxWidth: isMobile
      ? "250px"
      : isMd
      ? "420px"
      : isLg
      ? "400px"
      : isXl
      ? "500px"
      : is2xl
      ? "600px"
      : "300px",
    fontSize: getResponsiveFontSize(),
    opacity: 1, // Ensure fully opaque
  };

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
        { value: sourceTable?.trim(), name: "Assigned Organization" },
        { value: organizationData.industry?.trim(), name: "Industry Name" },
        { value: organizationData.name?.trim(), name: "Organization Name" },
        {
          value: organizationData.location?.trim(),
          name: "Organization Location",
        },
        { value: clientData.name?.trim(), name: "Client Name" },
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

      const hasClientContact = clientData.phone || clientData.email;
      if (!hasClientContact) {
        onMessage(
          "error",
          "At least one client contact detail (Phone, or Email) is required."
        );
        return;
      }

      const now = new Date();

      // Step 3: Define validation helper functions for dates
      const validateDate = (
        date: Date | null,
        dateName: string,
        conditions: { date: Date | null; name: string }[]
      ) => {
        if (!date) return true; // If date is null, no validation needed for chronology

        // Normalize the input date to start of day for comparison
        const normalizedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const normalizedCurrentDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        // Future date check - only check if the date is actually in a future day
        if (normalizedDate > normalizedCurrentDate) {
          onMessage("error", `${dateName} cannot be in the future.`);
          return false;
        }

        // Chronological order check
        for (const condition of conditions) {
          if (condition.date) {
            const normalizedConditionDate = new Date(
              condition.date.getFullYear(),
              condition.date.getMonth(),
              condition.date.getDate()
            );
            if (normalizedDate < normalizedConditionDate) {
              onMessage(
                "error",
                `${dateName} cannot be earlier than ${condition.name}.`
              );
              return false;
            }
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
          organizationId: organizationData.id,
          organizationName: organizationData.name,
          organizationWebsite: organizationData.website,
          organizationLocation: organizationData.location,
          industryName: organizationData.industry,
          campaignName: organizationData.campaignName,
          clientId: clientData.id,
          clientName: clientData.name,
          clientPosition: clientData.position,
          clientPhone: clientData.phone,
          clientEmail: clientData.email,
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
          proposedValue: proposedValue ?? 0,
          closedSale: closedSale ?? 0,
          sourceTable,
          sourceOrganization: data.source_organization,
          notes,
          quotationNumber,
          type,
        });
        onMessage("success", "Lead updated successfully!");
        onClose();
      } catch (error) {
        console.error("Error updating Lead:", error);
        onMessage("error", "Error updating Lead. Please try again.");
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
    organizationData,
    clientData,
    organizationLocation,
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
    isPhoneValid,
    isEmailValid,
  ]);

  useEffect(() => {
    if (data && isOpen) {
      setOrganizationData({
        id: data.organization_id ?? null,
        name: data.organization_name ?? "",
        website: data.organization_website ?? "",
        location: data.organization_location ?? "",
        industry: data.industry_name ?? "",
        campaignName: data.campaign_name ?? "",
        lead_source: data.lead_source, // Remove this line or set it empty since we use separate leadSource state
        contacts: data.contacts ?? [],
      });

      setClientData({
        id: data.client_id ?? null,
        name: data.client_name ?? "",
        position: data.client_position ?? "",
        phone: data.client_contact_number ?? "",
        email: data.client_contact_email ?? "",
      });

      // Set the lead source in the separate state
      setLeadSourceAutofilled(false); // Reset autofill state
      setPic(data.PIC || "");

      // Lead details
      setSourceTable(data.source_table || "");
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
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm";

    return (value: string) => {
      if (value) {
        return `bg-white border-2 border-green-700 ${baseStyle}`;
      }
      return `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
    };
  }, []);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let rootMargin = "-30% 0px -30% 0px";
    if (isMobile) rootMargin = "-30% 0px -30% 0px";
    else if (isMd) rootMargin = "-35% 0px -35% 0px";
    else if (isLg) rootMargin = "-40% 0px -40% 0px";
    else if (isXl) rootMargin = "-40% 0px -40% 0px";
    else if (is2xl) rootMargin = "-40% 0px -40% 0px";
    const observerOptions = {
      root: null,
      rootMargin,
      threshold: 0.2,
    };
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (userClickedSection) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    observerRef.current = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const sectionElements = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    sectionElements.forEach((element) => {
      if (element) observerRef.current!.observe(element);
    });

    return () => {
      sectionElements.forEach((element) => {
        if (element) observerRef.current?.unobserve(element);
      });
      observerRef.current?.disconnect();
    };
  }, [isOpen, userClickedSection, isMobile, isMd, isLg, isXl, is2xl, sections]);

  const scrollToSection = (sectionId: string) => {
    // Immediately set active section when user clicks
    setActiveSection(sectionId);
    setUserClickedSection(sectionId);

    // Clear any existing timeout
    if (userClickTimeout) {
      clearTimeout(userClickTimeout);
    }

    // Set a timeout to allow intersection observer to resume after scroll completes
    const timeout = setTimeout(() => {
      setUserClickedSection(null);
    }, 1000); // Give enough time for scroll to complete

    setUserClickTimeout(timeout);

    const element = document.getElementById(sectionId);
    const scrollContainer = document.querySelector(".overflow-y-auto");

    if (element && scrollContainer) {
      // Check if smooth scrolling is supported
      const supportsScrollBehavior =
        "scrollBehavior" in document.documentElement.style;

      if (supportsScrollBehavior) {
        // Use native smooth scrolling if supported
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      } else {
        // Fallback: Custom smooth scrolling for mobile browsers
        const elementTop = element.offsetTop;
        const containerScrollTop = scrollContainer.scrollTop;
        const targetScrollTop = elementTop - 80; // Offset for header
        const distance = targetScrollTop - containerScrollTop;
        const duration = 500; // Animation duration in ms
        const startTime = performance.now();

        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function (ease-in-out)
          const easeInOut =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const currentScrollTop = containerScrollTop + distance * easeInOut;
          scrollContainer.scrollTop = currentScrollTop;

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };

        requestAnimationFrame(animateScroll);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (userClickTimeout) {
        clearTimeout(userClickTimeout);
      }
    };
  }, [userClickTimeout]);

  // Add this function before the return statement
  const getTabColors = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
        : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
      indigo: isActive
        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800",
      purple: isActive
        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
        : "bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800",
      pink: isActive
        ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg"
        : "bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800",
      emerald: isActive
        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
      amber: isActive
        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg"
        : "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const modalVariants = {
    hidden: {
      scale: 0.95,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const, // Use string, not array
        scale: { duration: 0.3 },
        opacity: { duration: 0.3 },
      },
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const, // Use string, not array
        scale: { duration: 0.3 },
        opacity: { duration: 0.25 },
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0, transition: { duration: 0.3 } },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50"
          onClick={onClose}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            isolation: "isolate",
            willChange: "opacity",
            backfaceVisibility: "hidden",
            perspective: 1000,
          }}
        >
          <motion.div
            ref={popupRef}
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[75%] h-[95%] sm:h-[90%] popup-content flex flex-col"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="sticky top-0 bg-gradient-to-br from-slate-50/90 via-white/85 to-slate-100/90  border-b border-slate-200/30 rounded-t-3xl z-10 overflow-hidden">
              <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <Users
                      className="text-white"
                      size={isMobile ? 18 : isMd ? 24 : 32}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-900 leading-tight mb-0.5 sm:mb-1">
                      <span className="hidden sm:inline">Update Lead</span>
                    </h2>
                    <p className="text-blue-700/80 text-xs sm:text-sm font-medium leading-tight hidden lg:block">
                      Update lead information and progress
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Sales Rep Dropdown */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {picList && picList.length > 1 ? (
                      // Show interactive dropdown if user has access to multiple sales reps
                      <PicDropdown
                        onSelect={setPic}
                        defaultValue={pic}
                        onDropdownToggle={handleDropdownToggle}
                        onDropdownOpenStateChange={setIsDropdownOpen}
                        picList={picList}
                      />
                    ) : (
                      // Show static display with same styling as active dropdown
                      <div
                        className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg cursor-default transition-all duration-200 ${
                          pic
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-gray-50 border-gray-300 text-gray-700"
                        }`}
                        title={`Sales Rep: ${pic || "Sales Rep"}`}
                      >
                        <UserCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-current flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                          {pic && pic.length > 8
                            ? `${pic.slice(0, 8)}...`
                            : pic || "Select"}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Source Table Dropdown */}
                  {user &&
                    (user.role !== "salesperson" ||
                      (user.role === "salesperson" &&
                        user.organizations?.includes("mavn") &&
                        user.organizations?.includes("mi"))) && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <SourceTableDropdown
                          onSelect={setSourceTable}
                          defaultValue={getDisplayValue(sourceTable)}
                          onDropdownToggle={handleDropdownToggle}
                          onDropdownOpenStateChange={setIsDropdownOpen}
                        />
                      </div>
                    )}
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="bg-red-100 hover:bg-red-200 text-red-500 p-1.5 sm:p-2 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 hover:scale-110 hover:shadow-md group"
                  >
                    <motion.div
                      transition={{ duration: 0.2 }}
                      whileHover={{
                        rotate: 90,
                        scale: 1.05,
                      }}
                      whileTap={{
                        scale: 0.5,
                      }}
                    >
                      <X className="text-base sm:text-lg group-hover:text-red-600 transition-colors duration-200" />
                    </motion.div>
                  </button>
                </div>
              </div>

              {/* Sticky Navigation Tabs */}
              <div className="flex flex-wrap gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 pb-2 sm:pb-3 md:pb-4">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm ${getTabColors(
                        section.color,
                        isActive
                      )} ${
                        isActive ? "transform scale-105" : "hover:shadow-sm"
                      }`}
                    >
                      <Icon
                        size={isMobile ? 14 : isMd ? 16 : 18}
                        className="flex-shrink-0"
                      />
                      <span className="hidden xs:inline sm:inline whitespace-nowrap">
                        {isMobile ? section.label.split(" ")[0] : section.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              {/* Organization Details Section */}
              <OrganizationInformation
                value={organizationData} // <-- Pass initial value for editing
                onDataChange={setOrganizationData}
                customOptions={{
                  industry: industryOptions.map((opt: any) => opt.data),
                  country: countryOptions.map((opt: any) => opt.data),
                }}
                onDropdownToggle={handleDropdownToggle}
                onMessage={onMessage}
                isMobile={isMobile}
                titleTooltipStyle={titleTooltipStyle}
              />
              {/* Client Information Section */}
              <ClientInformation
                value={clientData}
                onDataChange={setClientData}
                availableClients={organizationData.contacts || []}
                onDropdownToggle={handleDropdownToggle}
                organizationName={organizationData.name}
                isMobile={isMobile}
                onValidationChange={(status) => {
                  setIsPhoneValid(status.phone);
                  setIsEmailValid(status.email);
                }}
              />

              {/* Lead Details Section */}
              <div id="lead" className="mb-6 sm:mb-8 md:mb-10">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border border-purple-200">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
                      <ClipboardList
                        className="text-purple-600"
                        size={isMobile ? 20 : isMd ? 24 : 28}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                        Lead Details
                      </h3>
                      <p className="text-purple-700 text-xs sm:text-sm font-medium leading-tight">
                        Source and service information
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3 sm:mb-4">
                  <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
                    Lead Source<span className="text-red-500">*</span>
                  </label>
                  <LeadSourceDropdown
                    onSelect={setLeadSource}
                    defaultValue={leadSource}
                    onDropdownToggle={handleDropdownToggle}
                    onDropdownOpenStateChange={setIsDropdownOpen}
                    options={leadSourceOptions.map(
                      (option: any) => option.data
                    )}
                    disabled={leadSourceAutofilled}
                    autofilled={leadSourceAutofilled} // <-- Add this line
                  />
                </div>

                <div className="mb-3 sm:mb-4">
                  <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
                    Service Type
                  </label>
                  <TypeDropdown
                    onSelect={setType}
                    defaultValue={type}
                    onDropdownToggle={handleDropdownToggle}
                    onDropdownOpenStateChange={setIsDropdownOpen}
                  />
                </div>

                <div className="mb-3 sm:mb-4">
                  <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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
              <div id="proposal" className="mb-6 sm:mb-8 md:mb-10">
                <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border border-pink-200">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
                      <FileText
                        className="text-pink-600"
                        size={isMobile ? 20 : isMd ? 24 : 28}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                        Proposal Stage
                      </h3>
                      <p className="text-pink-700 text-xs sm:text-sm font-medium leading-tight">
                        Meeting and proposal progress tracking
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3 sm:mb-4">
                  <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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
                      className="mb-3 sm:mb-4"
                      variants={dateDropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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

                <div className="mb-3 sm:mb-4">
                  <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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
                  {proposalInProgress === "Yes" &&
                    !isMeetingDateDropdownOpen && (
                      <motion.div
                        className="mb-3 sm:mb-4"
                        variants={dateDropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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

                <div className="mb-3 sm:mb-4">
                  <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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
                        className="mb-3 sm:mb-4"
                        variants={dateDropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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

                <div className="mb-3 sm:mb-4">
                  <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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
                        className="mb-3 sm:mb-4"
                        variants={dateDropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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

                {/* Lost Lead Dropdown */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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

              {/* Combined Financials & Notes Section */}
              <div id="financials" className="mb-2">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border border-emerald-200">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
                      <DollarSign
                        className="text-emerald-600"
                        size={isMobile ? 20 : isMd ? 24 : 28}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                        Financials & Additional Notes
                      </h3>
                      <p className="text-emerald-700 text-xs sm:text-sm font-medium leading-tight">
                        Pricing information and additional comments
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financials */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                      <DollarSign
                        size={isMobile ? 14 : isMd ? 20 : 22}
                        className="text-emerald-700"
                      />
                    </div>
                    <span className="text-emerald-800 text-sm md:text-base xl:text-lg leading-tight">
                      Financial Information
                    </span>
                  </h4>

                  <div className="mb-3 sm:mb-4">
                    <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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
                    inputClassName={inputClassName}
                  />
                </div>

                {/* Notes */}
                <div className="mb-0">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                      <StickyNote
                        size={isMobile ? 14 : isMd ? 20 : 22}
                        className="text-amber-700"
                      />
                    </div>
                    <span className="text-amber-800 text-sm md:text-base xl:text-lg leading-tight">
                      Additional Notes
                    </span>
                  </h4>

                  <div className="mb-0">
                    <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
                      Notes
                    </label>
                    <textarea
                      className={inputClassName(notes)}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter Notes"
                      rows={isMobile ? 3 : 4}
                      style={{ minHeight: isMobile ? "80px" : "100px" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-gradient-to-tl from-slate-50/90 via-white/85 to-slate-100/90 border-t border-slate-200/30 rounded-b-3xl z-10 overflow-hidden">
              {/* Main Footer Content */}
              <div className="p-3 sm:p-4 md:p-3">
                <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
                  {/* Left side - Admin actions (Desktop/Tablet only) */}
                  <div className="hidden sm:flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {user?.role === "admin" && (
                      <button
                        onClick={handleDelete}
                        className="bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 hover:text-red-800 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 border border-red-300 hover:border-red-400 transform-gpu shadow-md hover:shadow-lg text-sm sm:text-base"
                      >
                        <div className="flex items-center justify-center gap-2 relative z-10">
                          <span>Delete</span>
                        </div>
                      </button>
                    )}
                    <button
                      onClick={data?.isInactive ? handleActive : handleInactive}
                      className={`font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 border transform-gpu shadow-md hover:shadow-lg text-sm sm:text-base ${
                        data?.isInactive
                          ? "bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 hover:text-green-800 border-green-300 hover:border-green-400"
                          : "bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-700 hover:text-yellow-800 border-yellow-300 hover:border-yellow-400"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 relative z-10">
                        <span>
                          {data?.isInactive ? "Unarchive" : "Archive"}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Mobile: Main actions + Menu dropdown */}
                  <div className="flex sm:hidden items-center gap-2 w-full">
                    <button
                      onClick={handleUpdate}
                      className={`flex-1 bg-blue-900 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-xs border border-blue-800 hover:border-blue-600 transition-all duration-200 ${
                        isLoading ? "opacity-90 cursor-not-allowed" : ""
                      }`}
                      disabled={isLoading}
                      style={{ minWidth: 0 }}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          Updating...
                        </span>
                      ) : (
                        "Update"
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-red-100 hover:to-red-200 text-gray-700 hover:text-red-700 font-semibold py-2.5 px-3 rounded-lg text-xs border border-gray-300 hover:border-red-300 transition-all duration-200"
                      style={{ minWidth: 0 }}
                    >
                      Cancel
                    </button>

                    {/* Mobile Actions Dropdown */}
                    <div className="relative">
                      <button
                        ref={mobileActionsButtonRef}
                        onClick={() => setShowMobileActions(!showMobileActions)}
                        className={`p-2.5 rounded-lg flex items-center justify-center transition-all duration-300 border ${
                          showMobileActions
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                        }`}
                        aria-label="More options"
                      >
                        <MoreVertical
                          size={16}
                          className={`transition-transform duration-300 ${
                            showMobileActions ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Mobile Actions Dropdown Portal */}
                      {typeof window !== "undefined" &&
                        createPortal(
                          <AnimatePresence>
                            {showMobileActions && (
                              <motion.div
                                ref={mobileActionsDropdownRef}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-[60]"
                                style={{
                                  position: "fixed",
                                  bottom: mobileDropdownPosition.bottom,
                                  right: mobileDropdownPosition.right,
                                  minWidth: "160px",
                                  boxShadow:
                                    "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col divide-y divide-gray-200">
                                  {user?.role === "admin" && (
                                    <button
                                      onClick={() => {
                                        setShowMobileActions(false);
                                        handleDelete();
                                      }}
                                      className="w-full text-left px-4 py-2 text-red-700 hover:bg-gray-100 transition-colors duration-150 text-xs font-medium"
                                      style={{ background: "none" }}
                                    >
                                      Delete
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setShowMobileActions(false);
                                      if (data?.isInactive) {
                                        handleActive();
                                      } else {
                                        handleInactive();
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-150 text-xs font-medium"
                                    style={{ background: "none" }}
                                  >
                                    {data?.isInactive ? "Unarchive" : "Archive"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>,
                          document.body
                        )}
                    </div>
                  </div>

                  {/* Right side - Main actions (Desktop/Tablet) */}
                  <div className="hidden sm:flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                      onClick={handleUpdate}
                      className={`bg-blue-900 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg transition-all duration-500 ease-in-out relative overflow-hidden group transform-gpu shadow-md hover:shadow-lg border border-blue-800 hover:border-blue-600 text-sm sm:text-base ${
                        isLoading ? "opacity-90 cursor-not-allowed" : ""
                      }`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Updating...
                        </span>
                      ) : (
                        <span>Update Lead</span>
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-red-100 hover:to-red-200 text-gray-700 hover:text-red-700 font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg transition-all duration-300 border border-gray-300 hover:border-red-300 transform-gpu text-sm sm:text-base"
                    >
                      <div className="flex items-center justify-center gap-2 relative z-10">
                        <span>Cancel</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Modals - Keep existing modals */}
            {ReactDOM.createPortal(
              <AnimatePresence>
                {showConfirmation && (
                  <motion.div
                    ref={confirmationPopupRef}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <h2 className="text-lg sm:text-xl font-bold mb-4">
                        Confirm Deletion
                      </h2>
                      <p className="mb-4 text-sm sm:text-base">
                        Please provide a reason for deletion:
                      </p>
                      <textarea
                        className={`w-full p-2 border rounded-lg mb-2 text-sm ${
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
                        <p className="text-red-500 text-xs sm:text-sm mb-4">
                          Please provide a reason for deletion...
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4">
                        <button
                          onClick={handleCancelDelete}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmDelete}
                          className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm sm:text-base ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-xs sm:text-sm">
                                Deleting...
                              </span>
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
                    ref={inactiveConfirmationPopupRef}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <h2 className="text-lg sm:text-xl text-gray-700 font-bold mb-4">
                        Confirm Status Change
                      </h2>
                      <textarea
                        className={`w-full p-2 border rounded-lg mb-2 text-sm ${
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
                        <p className="text-red-500 text-xs sm:text-sm mb-4">
                          Please provide a reason for marking this as archive!
                        </p>
                      )}
                      <div className="flex items-center mb-4">
                        <Info className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="text-xs text-gray-500">
                          Marking this lead as archive will exclude it from the
                          stats.
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4">
                        <button
                          onClick={handleCancelInactive}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmInactive}
                          className={`px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm sm:text-base ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-xs sm:text-sm">
                                Archiving...
                              </span>
                            </span>
                          ) : (
                            "Yes, Archive"
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
                    ref={activeConfirmationPopupRef}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <h2 className="text-lg sm:text-xl font-bold mb-4">
                        Confirm Activation
                      </h2>
                      <p className="mb-4 text-sm sm:text-base">
                        Are you sure you want to activate this data?
                      </p>
                      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4">
                        <button
                          onClick={handleCancelActive}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmActive}
                          className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm sm:text-base ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-xs sm:text-sm">
                                Activating...
                              </span>
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
