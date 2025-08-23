"use client";
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
  Loader2,
  UserCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProspectDateDropdown from "@/app/home/AddNewData/Dropdowns/ProspectDateDropdown";
import LeadSourceDropdown from "@/app/home/AddNewData/Dropdowns/LeadSourceDropdown";
import PicDropdown from "@/app/home/AddNewData/Dropdowns/PICDropdown";
import CountryDropdown from "@/app/home/AddNewData/Dropdowns/CountryDropdown";
import MeetingsConductedDropdown from "@/app/home/AddNewData/Dropdowns/MeetingsConductedDropdown";
import ProposalSentDropdown from "@/app/home/AddNewData/Dropdowns/ProposalSentDropdown";
import MeetingDateDropdown from "@/app/home/AddNewData/Dropdowns/MeetingDateDropdown";
import ProposalSentDateDropdown from "@/app/home/AddNewData/Dropdowns/ProposalSentDateDropdown";
import ProposalInProgressDateDropdown from "@/app/home/AddNewData/Dropdowns/ProposalInProgressDateDropdown";
import ProposalInProgressDropdown from "@/app/home/AddNewData/Dropdowns/ProposalInProgressDropdown";
import ProposalSignedDropdown from "@/app/home/AddNewData/Dropdowns/ProposalSignedDropdown";
import ProposalSignedDateDropdown from "@/app/home/AddNewData/Dropdowns/ProposalSignedDateDropdown";
import TypeDropdown from "@/app/home/AddNewData/Dropdowns/TypeDropdown";
import SourceTableDropdown from "@/app/home/AddNewData/Dropdowns/SourceTableDropdown";
import SaleFields from "@/app/home/AddNewData/components/SaleFields";
import useAddData from "@/app/home/hooks/useAddData";
import { useAuth } from "@/app/AuthContext";
import ContactPhoneInput from "@/app/home/AddNewData/components/ContactPhoneInput";
import ContactEmailInput from "@/app/home/AddNewData/components/ContactEmailInput";
import { Tooltip as ReactTooltip } from "react-tooltip"; // Add this import
import { useMediaQuery } from "react-responsive"; // Add this import
import OrganizationInformation, {
  OrganizationData,
} from "./components/OrganizationInformation";

import ClientInformation, { ClientData } from "./components/ClientInformation";

interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    user: { username: string; role: string } | null;
    organizationName: string;
    campaignName: string;
    organizationWebsite: string;
    organizationLocation: string;
    industryName: string;
    clientName: string;
    clientPosition: string;
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
  }) => void;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  customOptions: any;
  tableSelectorValue: string;
  picList?: string[];
}

const AddNewData: React.FC<AddNewDataProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onMessage,
  messagePopupRef,
  customOptions,
  tableSelectorValue,
  picList,
}) => {
  const { user } = useAuth(); // Use useAuth to get the user object

  const capitalizeFirstLetter = (string: string) =>
    string.charAt(0).toUpperCase() + string.slice(1);

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

  const [validationStatus, setValidationStatus] = useState({
    phone: true,
    email: true,
  });
  const [leadSourceAutofilled, setLeadSourceAutofilled] = useState(false);

  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [quotationNumber, setQuotationNumber] = useState<string>("");
  const [proposedValue, setProposedValue] = useState<number | null>(null);
  const [closedSale, setClosedSale] = useState<number | null>(null);
  const [sourceTable, setSourceTable] = useState<string>("");
  const [leadSource, setLeadSource] = useState<string>("");
  const [pic, setPic] = useState<string>("");
  const [meetingsConducted, setMeetingsConducted] = useState<string>("No");
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
  const [industryOptions, setIndustryOptions] = useState<any[]>([]); // Add this line

  const [meetingsConductedChanged, setMeetingsConductedChanged] =
    useState(false);
  const [prospectDateChanged, setProspectDateChanged] = useState(false);
  const [meetingDateChanged, setMeetingDateChanged] = useState(false);
  const [proposalSentChanged, setProposalSentChanged] = useState(false);
  const [proposalInProgressChanged, setProposalInProgressChanged] =
    useState(false);
  const [proposalSignedChanged, setProposalSignedChanged] = useState(false);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState<any[]>([]);

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

  const [isLoading, setIsLoading] = useState(false);
  const addData = useAddData(onClose);

  const [userClickedSection, setUserClickedSection] = useState<string | null>(
    null
  );
  const [userClickTimeout, setUserClickTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const [borderColor, setBorderColor] = useState("border-gray-300");

  const [activeSection, setActiveSection] = useState("organization");

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

  // Replace the existing useEffect (lines 270-286) with this:
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

  useEffect(() => {
    if (user && isOpen) {
      const defaultPic = capitalizeFirstLetter(user.username);
      let defaultSourceTable = "";

      switch (tableSelectorValue.toLowerCase()) {
        case "all":
          defaultSourceTable = ""; // Show table selector if 'all'
          break;
        case "mavn":
          defaultSourceTable = "MAVN";
          break;
        case "moving image":
          defaultSourceTable = "MI";
          break;
        default:
          defaultSourceTable = ""; // Default to empty if no match
      }

      setPic(defaultPic);
      setSourceTable(defaultSourceTable);
    }

    return () => {
      // Cleanup function to reset the source table when the component is closed
      if (!isOpen) {
        setSourceTable("");
      }
    };
  }, [user, isOpen, tableSelectorValue]);

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

  const handleSubmit = useCallback(async () => {
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
        { value: clientData.name?.trim(), name: "Client Name" }, // <-- Add this line
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

      // Add phone validation check
      if (clientData.phone && !validationStatus.phone) {
        onMessage("error", "Please enter a valid phone number.");
        return;
      }

      // Add email validation check
      if (clientData.email && !validationStatus.email) {
        onMessage("error", "Please enter a valid email address.");
        return;
      }

      const now = new Date();
      const currentDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );

      // Step 2: Validate dates chronology and business rules
      // Basic date validation function
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
      // Required date validation when corresponding dropdown is "Yes"
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

      // Step 3: Validate all dates in order of workflow
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

      // Step 4: Validate required dates based on corresponding dropdown values
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

      // Step 5: Validate business flow logic
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

      // Step 6: Validate sales data
      if (proposalSignedLower === "yes") {
        // When proposal is signed, we need closed sale value
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

        // Optional: Validate proposed value exists if there's a closed sale
        if (!proposedValue && proposedValue !== 0) {
          onMessage(
            "error",
            "Proposed Value should be provided when there's a Closed Sale."
          );
          return;
        }
      }

      // Step 7: Submit data if all validations pass
      setIsLoading(true);
      try {
        await addData({
          organizationId: organizationData.id, // Send ID if exists
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
          notes,
          quotationNumber,
          type,
        });

        // Success message and reset form
        onMessage("success", "Lead Added successfully!");

        // Reset all form fields
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

        setContactPhone("");
        setContactEmail("");
        setType("");
        setNotes("");
        setQuotationNumber("");
        setProposedValue(null);
        setClosedSale(null);
        setSourceTable("");
        setLeadSource("");
        setLeadSourceAutofilled(false);
        setPic("");
        setMeetingsConducted("No");
        setProposalSent("No");
        setProposalInProgress("No");
        setProspectDate(null);
        setProspectDateChanged(false);
        setMeetingDate(null);
        setProposalSentDate(null);
        setProposalInProgressDate(null);
        setProposalSigned("No");
        setProposalSignedDate(null);
        setBorderColor("border-gray-300");

        onClose();
      } catch (error) {
        console.error("Error adding lead:", error);
        onMessage("error", "Error submitting lead. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      // Catch any unexpected errors in the validation process
      console.error("Validation error:", error);
      onMessage("error", "An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }, [
    organizationData,
    clientData,
    leadSource,
    pic,
    meetingsConducted,
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
    sourceTable,
    notes,
    quotationNumber,
    type,
    addData,
    onMessage,
    onClose,
  ]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const currentTimestamp = Date.now();

      if (currentTimestamp - lastClickTimestamp < 50) {
        return;
      }

      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !isDropdownOpen &&
        !(
          messagePopupRef.current &&
          messagePopupRef.current.contains(event.target as Node)
        )
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
  }, []);

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

  const handleProposalSentDateChange = useCallback((value: Date | null) => {
    setProposalSentDate(value);
    setIsProposalSentDateDropdownOpen(value !== null);
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
      setIndustryOptions(uniqueIndustryOptions);
    }, 500);
  }, [customOptions]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -30% 0px",
      threshold: 0.2,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Don't update active section if user just clicked a tab
      if (userClickedSection) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const handleScroll = (e: Event) => {
      // Don't update active section if user just clicked a tab
      if (userClickedSection) return;

      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;

      // Calculate scroll percentage
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // For other sections, use normal intersection observer logic
      // Only update if we're not in the bottom 5%
      if (scrollPercentage < 0.95) {
        // Let intersection observer handle the rest
        // This prevents the notes section from being overridden
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Observe all section elements
    const sectionElements = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);
    sectionElements.forEach((element) => {
      if (element) observer.observe(element);
    });

    // Add scroll listener to the scrollable container
    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      sectionElements.forEach((element) => {
        if (element) observer.unobserve(element);
      });
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOpen, userClickedSection]);

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

  const sections = [
    {
      id: "organization",
      label: "Organization",
      icon: Building2,
      color: "blue",
    },
    { id: "client", label: "Client Info", icon: User, color: "indigo" },
    { id: "lead", label: "Lead Details", icon: ClipboardList, color: "purple" },
    { id: "proposal", label: "Proposal Stage", icon: FileText, color: "pink" },
    {
      id: "financials",
      label: "Financials & Notes",
      icon: DollarSign,
      color: "emerald",
    },
  ];

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
            {/* Sticky Header */}
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
                      <span className="hidden sm:inline"> New Lead</span>
                    </h2>
                    <p className="text-blue-700/80 text-xs sm:text-sm font-medium leading-tight hidden lg:block">
                      Add a new lead to sales pipeline
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
                        scale: 1.1,
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
                        isActive ? "transform scale-110" : "hover:shadow-md"
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
                onDataChange={setOrganizationData}
                customOptions={{
                  industry: industryOptions.map((opt: any) => opt.data),
                  country: countryOptions.map((opt: any) => opt.data),
                }}
                onDropdownToggle={handleDropdownToggle}
                onMessage={onMessage}
                // REMOVE campaignName and onCampaignNameChange props
                isMobile={isMobile}
                titleTooltipStyle={titleTooltipStyle}
              />
              {/* Client Information Section */}
              <ClientInformation
                onDataChange={setClientData}
                availableClients={organizationData.contacts || []}
                onDropdownToggle={handleDropdownToggle}
                isMobile={isMobile}
                onValidationChange={setValidationStatus}
                organizationName={organizationData.name}
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
                    autofilled={leadSourceAutofilled}
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
              <div className="p-3 sm:p-4 md:p-3 relative z-10">
                <div className="flex flex-row justify-end gap-2 sm:gap-4">
                  <button
                    onClick={handleSubmit}
                    className={`bg-blue-900 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:py-2.5 sm:px-6 rounded-lg transition-all duration-500 ease-in-out relative overflow-hidden group transform-gpu shadow-md hover:shadow-lg border border-blue-800 hover:border-blue-600 text-xs sm:text-base ${
                      isLoading ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse"></div>
                    )}

                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                        <span className="text-white font-medium tracking-wide">
                          Saving Lead...
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 relative z-10">
                        <span>Add Lead</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-red-100 hover:to-red-200 text-gray-700 hover:text-red-700 font-semibold py-2 px-3 sm:py-2.5 sm:px-6 rounded-lg transition-all duration-300 border border-gray-300 hover:border-red-300 transform-gpu text-xs sm:text-base"
                  >
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <span>Cancel</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddNewData;
