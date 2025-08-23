import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { User, PlusCircle, Loader2, Building2, X, Info } from "lucide-react";
import { Client } from "../hooks/useFetchOrganizationInformation";
import useFetchClientInformation, {
  ClientWithOrg,
} from "../hooks/useFetchClientInformation";
import ContactPhoneInput from "./ContactPhoneInput";
import ContactEmailInput from "./ContactEmailInput";

export interface ClientData {
  id: number | null;
  name: string;
  position: string;
  phone: string;
  email: string;
}

interface ClientInformationProps {
  onDataChange: (data: ClientData) => void;
  availableClients: Client[];
  onDropdownToggle: (isOpen: boolean) => void;
  isMobile: boolean;
  onValidationChange: (isValid: { phone: boolean; email: boolean }) => void;
  organizationName: string;
}

const ClientInformation: React.FC<ClientInformationProps> = ({
  onDataChange,
  availableClients,
  onDropdownToggle,
  isMobile,
  onValidationChange,
  organizationName,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    clients: globalClients,
    loading,
  } = useFetchClientInformation();

  const [localData, setLocalData] = useState<ClientData>({
    id: null,
    name: "",
    position: "",
    phone: "",
    email: "",
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const [clientStatus, setClientStatus] = useState<
    "" | "org-filled" | "global-filled" | "new"
  >("");
  const [clientTouched, setClientTouched] = useState(false);
  const [autofilledFields, setAutofilledFields] = useState<{
    position: boolean;
    phone: boolean;
    email: boolean;
  }>({
    position: false,
    phone: false,
    email: false,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset client form when organization changes
  useEffect(() => {
    setLocalData({ id: null, name: "", position: "", phone: "", email: "" });
    setIsDropdownOpen(false);
    setSearchQuery("");
    setClientStatus("");
    setClientTouched(false);
    setAutofilledFields({ position: false, phone: false, email: false });
    onDropdownToggle(false);
  }, [availableClients, onDropdownToggle, setSearchQuery]);

  // Lift state up when local data changes
  useEffect(() => {
    onDataChange(localData);
  }, [localData, onDataChange]);

  // Lift validation state up
  useEffect(() => {
    onValidationChange({ phone: isPhoneValid, email: isEmailValid });
  }, [isPhoneValid, isEmailValid, onValidationChange]);

  const updateDropdownPosition = useCallback(() => {
    if (nameInputRef.current) {
      const rect = nameInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Autofill selection
  const handleSelectOrgClient = (client: Client) => {
    setLocalData({
      id: client.id,
      name: client.name,
      position: client.position || "",
      phone: client.contact_number || "",
      email: client.contact_email || "",
    });
    setSearchQuery(client.name);
    setIsDropdownOpen(false);
    onDropdownToggle(false);
    setClientTouched(true);
    setClientStatus("org-filled");
    setAutofilledFields({
      position: !!client.position,
      phone: !!client.contact_number,
      email: !!client.contact_email,
    });
    setTimeout(() => {
      setIsPhoneValid(
        !client.contact_number ||
          (!!client.contact_number &&
            /^[\d\s()+-]+$/.test(client.contact_number))
      );
      setIsEmailValid(
        !client.contact_email ||
          (!!client.contact_email &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.contact_email))
      );
    }, 100);
  };

  const handleSelectGlobalClient = (client: ClientWithOrg) => {
    setLocalData({
      id: client.id,
      name: client.name,
      position: client.position || "",
      phone: client.contact_number || "",
      email: client.contact_email || "",
    });
    setSearchQuery(client.name);
    setIsDropdownOpen(false);
    onDropdownToggle(false);
    setClientTouched(true);
    setClientStatus("global-filled");
    setAutofilledFields({
      position: !!client.position,
      phone: !!client.contact_number,
      email: !!client.contact_email,
    });
    setTimeout(() => {
      setIsPhoneValid(
        !client.contact_number ||
          (!!client.contact_number &&
            /^[\d\s()+-]+$/.test(client.contact_number))
      );
      setIsEmailValid(
        !client.contact_email ||
          (!!client.contact_email &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.contact_email))
      );
    }, 100);
  };

  // Add new client
  const handleAddNew = useCallback(() => {
    setTimeout(() => {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
      setLocalData({
        id: null,
        name: searchQuery,
        position: "",
        phone: "",
        email: "",
      });
      setAutofilledFields({ position: false, phone: false, email: false });
      setClientTouched(true);
      setClientStatus("new");
    }, 0);
  }, [searchQuery, onDropdownToggle]);

  // Clear selection
  const handleClearSelection = () => {
    setLocalData({ id: null, name: "", position: "", phone: "", email: "" });
    setSearchQuery("");
    setClientStatus("");
    setClientTouched(false);
    setAutofilledFields({ position: false, phone: false, email: false });
  };

  // Handle name change: if user edits name after autofill, clear other fields and autofill status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    // If previously autofilled and now name is changed, clear other fields
    if (
      (clientStatus === "org-filled" || clientStatus === "global-filled") &&
      newQuery !== localData.name
    ) {
      setLocalData({
        id: null,
        name: newQuery,
        position: "",
        phone: "",
        email: "",
      });
      setAutofilledFields({ position: false, phone: false, email: false });
      setClientStatus("new");
    } else {
      setLocalData((prev) => ({
        ...prev,
        id: null,
        name: newQuery,
      }));
    }
    setSearchQuery(newQuery);
    setClientTouched(true);

    if (newQuery.length > 0 || availableClients.length > 0) {
      updateDropdownPosition();
      setIsDropdownOpen(true);
      onDropdownToggle(true);
    } else {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
    }
  };

  const handleInputFocus = () => {
    updateDropdownPosition();
    setIsDropdownOpen(true);
    onDropdownToggle(true);
  };

  const handleInputBlur = () => {
    if (!searchQuery || !clientTouched) {
      setClientStatus("");
      return;
    }
    if (localData.id) {
      // Status already set when selecting
      return;
    } else if (searchQuery.length > 1) {
      setClientStatus("new");
    } else {
      setClientStatus("");
    }
  };

  // When user edits autofilled fields, remove autofill and color
  const handleFieldChange = (
    field: keyof ClientData,
    value: string,
    validator?: (val: string) => boolean
  ) => {
    setLocalData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setAutofilledFields((prev) => ({
      ...prev,
      [field]: false,
    }));
    // Validation for phone/email
    if (field === "phone" && validator) setIsPhoneValid(validator(value));
    if (field === "email" && validator) setIsEmailValid(validator(value));
  };

  // Enhanced click outside & scroll handler (matches OrganizationInformation)
  const handleScroll = useCallback(
    (event: Event) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (dropdownRef.current && dropdownRef.current.contains(target)) {
          return;
        }
        if (nameInputRef.current && nameInputRef.current.contains(target)) {
          return;
        }
        setIsDropdownOpen(false);
        onDropdownToggle(false);
      }
    },
    [isDropdownOpen, onDropdownToggle]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (dropdownRef.current && dropdownRef.current.contains(target)) ||
        (nameInputRef.current && nameInputRef.current.contains(target))
      ) {
        return;
      }
      setIsDropdownOpen(false);
      onDropdownToggle(false);
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("scroll", handleScroll, { capture: true });
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", updateDropdownPosition);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isDropdownOpen, onDropdownToggle, handleScroll, updateDropdownPosition]);

  const isClientSelected = localData.id !== null;

  // Status message and dynamic header styling
  const getHeaderBg = () => {
    if (clientStatus === "org-filled") {
      return "from-green-50 to-green-100 border-green-200";
    }
    if (clientStatus === "global-filled") {
      return "from-green-50 to-green-100 border-green-200";
    }
    if (clientStatus === "new") {
      return "from-green-50 to-green-100 border-green-200";
    }
    return "from-indigo-50 to-indigo-100 border-indigo-200";
  };

  const getDescription = () => {
    if (clientStatus === "org-filled") {
      return "Client details auto-filled from organization. All fields remain editable.";
    }
    if (clientStatus === "global-filled") {
      return "Client details auto-filled from database. All fields remain editable.";
    }
    if (clientStatus === "new") {
      return "You are adding a new client. Please fill in all required details.";
    }
    return "Search for an existing contact or add a new one.";
  };

  // Input color logic
  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (
      value: string,
      isAutofilled: boolean = false,
      isValid: boolean = true
    ) => {
      if (isAutofilled) {
        return `bg-green-50 border-2 border-green-300 ${baseStyle}`;
      }
      if (!isValid && value) {
        return `bg-white border-2 border-red-500 ${baseStyle}`;
      }
      return value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
    };
  }, []);

  const showOrgClients = availableClients.length > 0;
  const showGlobalClients =
    !loading && globalClients.length > 0 && searchQuery.length > 0;
  const showAddNew = !loading && searchQuery.length > 1;

  const dropdownContent = (
    <AnimatePresence>
      {isDropdownOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white border border-gray-300 rounded-lg shadow-2xl z-[60] overflow-hidden"
          style={{
            position: "absolute",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: "300px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#D1D5DB transparent",
            }}
          >
            {/* Always show pinned org clients */}
            {showOrgClients && (
              <>
                <div className="bg-green-50 px-3 py-2 border-b border-green-200 flex items-center gap-2">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    From Current Organization
                  </p>
                  <span title="These contacts are linked to this organization and always shown.">
                    <Info className="w-3 h-3 text-green-400" />
                  </span>
                </div>
                {availableClients.map((client) => (
                  <div
                    key={`org-${client.id}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectOrgClient(client);
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-green-50 flex items-center gap-3 border-b border-gray-100"
                  >
                    <div className="p-1.5 rounded-full bg-green-100">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {client.name}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        {organizationName}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Hint to search for more */}
            {searchQuery.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-xs border-t border-gray-100">
                <Info className="w-4 h-4 text-gray-400" />
                Type to search for more contacts from our database.
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center p-4 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Searching...
              </div>
            )}

            {/* Global Clients */}
            {showGlobalClients && (
              <>
                <div className="bg-green-50 px-3 py-2 border-b border-green-200">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    From Other Organizations
                  </p>
                </div>
                {globalClients.map((client) => (
                  <div
                    key={`global-${client.id}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectGlobalClient(client);
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-green-50 flex items-center gap-3 border-b border-gray-100"
                  >
                    <div className="p-1.5 rounded-full bg-green-100">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {client.name}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        {client.organization.name}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Add New Option */}
            {showAddNew && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddNew();
                }}
                className="px-4 py-3 cursor-pointer hover:bg-green-50 flex items-center gap-3 border-t border-gray-200"
              >
                <PlusCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="font-medium text-green-700 text-sm">
                  Add &quot;{searchQuery}&quot; as a new client
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div id="client" className="mb-6 sm:mb-8 md:mb-10">
      <div
        className={`bg-gradient-to-r ${getHeaderBg()} rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
            <User
              className={
                clientStatus === "new"
                  ? "text-green-600"
                  : clientStatus === "org-filled"
                  ? "text-green-600"
                  : clientStatus === "global-filled"
                  ? "text-green-600"
                  : "text-indigo-600"
              }
              size={isMobile ? 20 : 24}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
              Client Information (PIC)
            </h3>
            <p
              className={`${
                clientStatus === "new"
                  ? "text-green-700"
                  : clientStatus === "org-filled"
                  ? "text-green-700"
                  : clientStatus === "global-filled"
                  ? "text-green-700"
                  : "text-indigo-700"
              } text-xs sm:text-sm font-medium leading-tight transition-colors duration-300`}
            >
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Client Name<span className="text-red-500">*</span>
          </label>
          {/* Mobile status badge next to label */}
          <div className="sm:hidden">
            {clientStatus === "new" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
                <PlusCircle className="w-3 h-3 mr-1 text-green-500" />
                New
              </span>
            )}
            {clientStatus === "org-filled" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-green-500" />
                From Org
              </span>
            )}
            {clientStatus === "global-filled" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-green-500" />
                From DB
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            ref={nameInputRef}
            type="text"
            className={
              inputClassName(
                localData.name,
                clientStatus === "org-filled" ||
                  clientStatus === "global-filled",
                true
              ) + (isClientSelected ? " pr-12" : "")
            }
            value={searchQuery}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholder="Search for a client or enter new name..."
            autoComplete="off"
          />
          {/* Desktop badge container */}
          <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 flex-row gap-2 items-center">
            {clientStatus === "new" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm pointer-events-none whitespace-nowrap">
                <PlusCircle className="w-3 h-3 mr-1 text-green-500" />
                Adding as new client
              </span>
            )}
            {clientStatus === "org-filled" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm pointer-events-none whitespace-nowrap">
                <Building2 className="w-3 h-3 mr-1 text-green-500" />
                From current organization
              </span>
            )}
            {clientStatus === "global-filled" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm pointer-events-none whitespace-nowrap">
                <User className="w-3 h-3 mr-1 text-green-500" />
                From database
              </span>
            )}
            {isClientSelected && (
              <button
                onClick={handleClearSelection}
                className="ml-2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
                aria-label="Clear selection"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {/* Mobile clear button */}
          {isClientSelected && (
            <button
              onClick={handleClearSelection}
              className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Client Position
          </label>
          {/* Mobile auto-filled badge */}
          {autofilledFields.position && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-green-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            className={inputClassName(
              localData.position,
              autofilledFields.position,
              true
            )}
            value={localData.position}
            onChange={(e) => handleFieldChange("position", e.target.value)}
            placeholder="Enter the position of the client"
          />
          {/* Desktop auto-filled badge */}
          {autofilledFields.position && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm pointer-events-none">
                <User className="w-3 h-3 mr-1 text-green-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Client Phone
          </label>
          {/* Mobile auto-filled badge */}
          {autofilledFields.phone && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-green-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <ContactPhoneInput
            value={localData.phone}
            onChange={(value) =>
              handleFieldChange(
                "phone",
                value,
                (val) => /^[\d\s()+-]+$/.test(val) || val === ""
              )
            }
            onValidationChange={setIsPhoneValid}
            defaultCountry="MY"
            isAutofilled={autofilledFields.phone}
          />
          {/* Desktop auto-filled badge */}
          {autofilledFields.phone && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm pointer-events-none">
                <User className="w-3 h-3 mr-1 text-green-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Client Email
          </label>
          {/* Mobile auto-filled badge */}
          {autofilledFields.email && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-green-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <ContactEmailInput
            value={localData.email}
            onChange={(value) =>
              handleFieldChange(
                "email",
                value,
                (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || val === ""
              )
            }
            onValidationChange={setIsEmailValid}
            placeholder="Enter email address"
            isAutofilled={autofilledFields.email}
          />
          {/* Desktop auto-filled badge */}
          {autofilledFields.email && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm pointer-events-none">
                <User className="w-3 h-3 mr-1 text-green-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
};

ClientInformation.displayName = "ClientInformation";
export default React.memo(ClientInformation);
