"use client";
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
import IndustryDropdown from "./Dropdowns/IndustryDropdown";
import useAddData from "@/app/home/hooks/useAddData";
import { useAuth } from "@/app/AuthContext";
import ContactPhoneInput from "@/app/home/AddNewData/components/ContactPhoneInput";
import ContactEmailInput from "@/app/home/AddNewData/components/ContactEmailInput";

interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    user: { username: string; role: string } | null;
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
  }) => void;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  customOptions: any;
  tableSelectorValue: string;
}

const AddNewData: React.FC<AddNewDataProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onMessage,
  messagePopupRef,
  customOptions,
  tableSelectorValue,
}) => {
  const { user } = useAuth(); // Use useAuth to get the user object

  const capitalizeFirstLetter = (string: string) =>
    string.charAt(0).toUpperCase() + string.slice(1);
  const [organizationWebsite, setOrganizationWebsite] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
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
    hidden: { opacity: 0, height: 0, marginBottom: 0 },
    visible: { opacity: 1, height: "auto", marginBottom: 16 },
  };

  const [isLoading, setIsLoading] = useState(false);
  const addData = useAddData(onClose);

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
        { value: sourceTable?.trim(), name: "Source Table" },
        { value: industryName?.trim(), name: "Industry Name" },
        { value: organizationName?.trim(), name: "Organization Name" },
        { value: organizationLocation?.trim(), name: "Organization Location" },
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
      const hasClientContact = contactPhone || contactEmail;
      if (!hasClientContact) {
        onMessage(
          "error",
          "At least one client contact detail (Phone, or Email) is required."
        );
        return;
      }

      const currentDate = new Date();

      // Step 2: Validate dates chronology and business rules
      // Basic date validation function
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
          organizationName,
          organizationWebsite,
          organizationLocation,
          industryName,
          clientName,
          clientPhone: contactPhone,
          clientEmail: contactEmail,
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
        onMessage("success", "Data submitted successfully!");

        // Reset all form fields
        setClientName("");
        setOrganizatioName("");
        setOrganizationWebsite("");
        setOrganizationLocation("");
        setIndustryName("");
        setContactPhone("");
        setContactEmail("");
        setType("");
        setNotes("");
        setQuotationNumber("");
        setProposedValue(null);
        setClosedSale(null);
        setSourceTable("");
        setLeadSource("");
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
        console.error("Error submitting data:", error);
        onMessage("error", "Error submitting data. Please try again.");
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
    organizationName,
    organizationWebsite,
    organizationLocation,
    industryName,
    contactPhone,
    contactEmail,
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
    setLastClickTimestamp(Date.now());
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

  const [borderColor, setBorderColor] = useState("border-gray-300");

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
            className="bg-white rounded-lg shadow-lg p-6 w-[90%] md:w-[70%] lg:w-[40%] h-[85%] popup-content overflow-y-auto"
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
              <h2 className="text-xl md:text-2xl font-bold">Add New Data</h2>
              <div className="flex items-center">
                {user &&
                  (user.role !== "salesperson" ||
                    (user.role === "salesperson" &&
                      user.organizations?.includes("mavn") &&
                      user.organizations?.includes("mi"))) && (
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
                  )}
                <button
                  onClick={onClose}
                  className="bg-white text-red-500 font-bold py-1 px-2 rounded-lg flex items-center justify-center transition duration-300 ease-in-out hover:cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, color: "#b91c1c" }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaTimes className="text-xl md:text-2xl" />
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
                  onSelect={setOrganizationLocation}
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
                  value={contactPhone}
                  onChange={setContactPhone}
                  defaultCountry="MY" // Malaysia by default
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                  Client Email
                </label>
                <ContactEmailInput
                  value={contactEmail}
                  onChange={setContactEmail}
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
                <label className="block text-[#001F3F] text-sm sm:text-base font-bold mb-2">
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

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={`bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg ${
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
                  "Submit"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddNewData;
