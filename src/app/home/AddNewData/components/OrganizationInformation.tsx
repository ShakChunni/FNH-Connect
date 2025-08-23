import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Building2, PlusCircle, Loader2, Info, X } from "lucide-react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import useFetchOrganizationInformation, {
  Organization,
  Client,
} from "../hooks/useFetchOrganizationInformation";
import IndustryDropdown from "../Dropdowns/IndustryDropdown";
import CountryDropdown from "../Dropdowns/CountryDropdown";

export interface OrganizationData {
  id: number | null;
  name: string;
  website: string;
  location: string;
  industry: string;
  campaignName: string;
  lead_source: string;
  contacts: Client[];
}

interface OrganizationInformationProps {
  onDataChange: (data: OrganizationData) => void;
  customOptions: {
    industry: string[];
    country: string[];
  };
  onDropdownToggle: (isOpen: boolean) => void;
  onMessage: (type: "success" | "error", content: string) => void;
  isMobile: boolean;
  titleTooltipStyle: React.CSSProperties;
}

const OrganizationInformation: React.FC<OrganizationInformationProps> = ({
  onDataChange,
  customOptions,
  onDropdownToggle,
  onMessage,
  isMobile,
  titleTooltipStyle,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    organizations,
    loading,
    setOrganizations,
  } = useFetchOrganizationInformation();

  const [isNewMode, setIsNewMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localData, setLocalData] = useState<OrganizationData>({
    id: null,
    name: "",
    website: "",
    location: "",
    industry: "",
    campaignName: "",
    lead_source: "",
    contacts: [],
  });

  const [autofilledFields, setAutofilledFields] = useState<{
    website: boolean;
    location: boolean;
    industry: boolean;
    lead_source: boolean;
  }>({
    website: false,
    location: false,
    industry: false,
    lead_source: false,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const orgInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const [orgStatus, setOrgStatus] = useState<"" | "existing" | "new">("");
  const [orgTouched, setOrgTouched] = useState(false);

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string, disabled: boolean = false) => {
      let style = disabled
        ? `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`
        : baseStyle;
      if (!disabled) {
        style += value
          ? ` bg-white border-2 border-green-700`
          : ` bg-gray-50 border-2 border-gray-300`;
      }
      return style;
    };
  }, []);

  useEffect(() => {
    onDataChange(localData);
  }, [localData, onDataChange]);

  const updateDropdownPosition = useCallback(() => {
    if (orgInputRef.current) {
      const rect = orgInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setLocalData((prev) => ({
      ...prev,
      id: null,
      name: newQuery,
      lead_source: "",
      contacts: [],
    }));
    setIsNewMode(false);
    setOrgTouched(true);
    setOrgStatus(""); // Reset status until blur
    if (newQuery.length >= 1) {
      updateDropdownPosition();
      setIsDropdownOpen(true);
      onDropdownToggle(true);
    } else {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
    }
  };

  const handleInputBlur = () => {
    if (!searchQuery || !orgTouched) {
      setOrgStatus("");
      return;
    }
    if (localData.id) {
      setOrgStatus("existing");
    } else if (searchQuery.length > 1) {
      setOrgStatus("new");
    } else {
      setOrgStatus("");
    }
  };

  const handleSelectOrganization = useCallback(
    (org: Organization) => {
      setTimeout(() => {
        setLocalData((prev) => ({
          ...prev,
          id: org.id,
          name: org.name,
          website: org.website || "",
          location: org.location || "",
          industry: org.industry || "",
          lead_source: org.lead_source || "",
          contacts: org.contacts || [],
        }));

        setAutofilledFields({
          website: !!org.website,
          location: !!org.location,
          industry: !!org.industry,
          lead_source: !!org.lead_source,
        });

        setSearchQuery(org.name);
        setIsDropdownOpen(false);
        onDropdownToggle(false);
        setOrgTouched(true);
        setOrgStatus("existing");
      }, 0);
    },
    [
      setLocalData,
      setAutofilledFields,
      setSearchQuery,
      setIsDropdownOpen,
      onDropdownToggle,
    ]
  );

  const handleAddNew = useCallback(() => {
    setTimeout(() => {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
      setLocalData((prev) => ({
        ...prev,
        id: null,
        name: searchQuery,
        website: "",
        location: "",
        industry: "",
        campaignName: "",
        lead_source: "",
        contacts: [],
      }));

      setAutofilledFields({
        website: false,
        location: false,
        industry: false,
        lead_source: false,
      });
      setOrgTouched(true);
      setOrgStatus("new");
    }, 0);
  }, [
    searchQuery,
    setIsNewMode,
    setIsDropdownOpen,
    onDropdownToggle,
    setLocalData,
    setAutofilledFields,
  ]);

  const handleClearSelection = () => {
    setLocalData({
      id: null,
      name: "",
      website: "",
      location: "",
      industry: "",
      campaignName: "",
      lead_source: "",
      contacts: [],
    });
    setSearchQuery("");
    setIsNewMode(false);
    setAutofilledFields({
      website: false,
      location: false,
      industry: false,
      lead_source: false,
    });
    setOrgStatus("");
    setOrgTouched(false);
  };

  const handleLocalDataChange = (
    field: keyof OrganizationData,
    value: string
  ) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleScroll = useCallback(
    (event: Event) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (dropdownRef.current && dropdownRef.current.contains(target)) {
          return;
        }
        if (orgInputRef.current && orgInputRef.current.contains(target)) {
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
        (orgInputRef.current && orgInputRef.current.contains(target))
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
  }, [isDropdownOpen, onDropdownToggle, handleScroll]);

  const isOrgSelected = localData.id !== null;

  useEffect(() => {
    if (!localData.name) {
      setLocalData((prev) => ({
        ...prev,
        location: "",
        industry: "",
        website: "",
        lead_source: "",
        contacts: [],
      }));
      setAutofilledFields({
        website: false,
        location: false,
        industry: false,
        lead_source: false,
      });
      setOrgStatus("");
      setOrgTouched(false);
    }
  }, [localData.name]);

  // Status message and dynamic header styling
  const getHeaderBg = () => {
    if (orgStatus === "existing") {
      return "from-blue-50 to-blue-100 border-blue-200";
    }
    if (orgStatus === "new") {
      return "from-green-50 to-green-100 border-green-200";
    }
    return "from-blue-50 to-blue-100 border-blue-200";
  };

  const getStatusBadge = () => {
    if (!orgStatus) return null;
    if (orgStatus === "existing") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold ml-2 border border-blue-200 shadow-sm">
          <Building2 className="w-3 h-3 mr-1 text-blue-500" />
          Auto-filled from organization
        </span>
      );
    }
    if (orgStatus === "new") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2 border border-green-200 shadow-sm">
          <PlusCircle className="w-3 h-3 mr-1 text-green-500" />
          Adding as a new organization
        </span>
      );
    }
    return null;
  };

  const getDescription = () => {
    if (orgStatus === "existing") {
      return "Organization details have been auto-filled. You can update the campaign name.";
    }
    if (orgStatus === "new") {
      return "You are adding a new organization. Please fill in all required details.";
    }
    return "Search for a company or add a new one, then name the campaign.";
  };

  const dropdownContent = (
    <AnimatePresence>
      {isDropdownOpen && !isOrgSelected && (
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
            {loading && (
              <div className="flex items-center justify-center p-4 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Searching...
              </div>
            )}
            {!loading &&
              organizations.length > 0 &&
              organizations.map((org) => (
                <div
                  key={org.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectOrganization(org);
                  }}
                  className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {org.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {org.location || "No location"}
                    </p>
                  </div>
                </div>
              ))}
            {!loading && searchQuery.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-xs border-t border-gray-100">
                <Info className="w-4 h-4 text-gray-400" />
                Start typing to search for organizations from our database.
              </div>
            )}
            {!loading && searchQuery.length >= 1 && (
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
                  Add &quot;{searchQuery}&quot; as a new organization
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div id="organization" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      <div
        className={`bg-gradient-to-r ${getHeaderBg()} rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
            <Building2
              className={
                orgStatus === "new" ? "text-green-600" : "text-blue-600"
              }
              size={28}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                Organization & Campaign
              </h3>
            </div>
            <p
              className={`${
                orgStatus === "new"
                  ? "text-green-700"
                  : orgStatus === "existing"
                  ? "text-blue-700"
                  : "text-blue-700"
              } text-xs sm:text-sm font-medium leading-tight transition-colors duration-300 mt-1`}
            >
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
          <span className="flex items-center gap-2">
            Campaign Name
            <Info
              className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors duration-200 flex-shrink-0"
              size={isMobile ? 12 : 14}
              data-tooltip-id="campaign-name-tooltip"
            />
          </span>
        </label>
        <ReactTooltip
          id="campaign-name-tooltip"
          content="Enter the specific campaign or deal name for this client. Use a clear, descriptive title to differentiate multiple projects under the same organization.&#10;&#10;Example: Q3 SEO Campaign, Senka UV Video Production, FINO Oct 2024 Campaign"
          place="top"
          style={titleTooltipStyle}
        />
        <input
          type="text"
          className={inputClassName(localData.campaignName)}
          value={localData.campaignName}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 60) {
              handleLocalDataChange("campaignName", value);
            }
          }}
          placeholder="Enter campaign or deal name"
          maxLength={60}
        />
        <div className="flex justify-between items-center mt-1">
          {localData.campaignName.length >= 55 && (
            <span className="text-xs text-orange-500">
              {60 - localData.campaignName.length} characters remaining
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 sm:mb-4 relative">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Organization Name<span className="text-red-500">*</span>
          </label>
          {/* Mobile status badge next to label */}
          <div className="sm:hidden">
            {orgStatus === "new" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
                <PlusCircle className="w-3 h-3 mr-1 text-green-500" />
                New
              </span>
            )}
            {orgStatus === "existing" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            )}
          </div>
        </div>
        <div className="relative flex items-center">
          <input
            ref={orgInputRef}
            type="text"
            className={
              inputClassName(localData.name, isOrgSelected) + " pr-44 sm:pr-56"
            }
            value={searchQuery}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => {
              if (!isOrgSelected && searchQuery.length >= 0) {
                updateDropdownPosition();
                setIsDropdownOpen(true);
                onDropdownToggle(true);
              }
            }}
            placeholder="Start typing to search for an organization..."
            readOnly={isOrgSelected}
          />
          {/* Desktop badge container: only show on sm and up */}
          <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 flex-row gap-2 items-center max-w-[70vw] sm:max-w-none">
            {orgStatus === "new" && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm pointer-events-none whitespace-nowrap"
                style={{ zIndex: 2 }}
              >
                <PlusCircle className="w-3 h-3 mr-1 text-green-500" />
                Adding as a new organization
              </span>
            )}
            {orgStatus === "existing" && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm pointer-events-none whitespace-nowrap"
                style={{ zIndex: 2 }}
              >
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled from database
              </span>
            )}
            {isOrgSelected && (
              <button
                onClick={handleClearSelection}
                className="ml-2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
                aria-label="Clear selection"
                style={{ zIndex: 2 }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {/* Mobile clear button: only show on mobile when org is selected */}
          {isOrgSelected && (
            <button
              onClick={handleClearSelection}
              className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
              aria-label="Clear selection"
              style={{ zIndex: 2 }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}

      <div className="mb-3 sm:mb-4 relative">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Industry Name<span className="text-red-500">*</span>
          </label>
          {/* Mobile auto-filled badge next to label */}
          {isOrgSelected && !isNewMode && autofilledFields.industry && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <IndustryDropdown
            onSelect={(value) => handleLocalDataChange("industry", value)}
            defaultValue={localData.industry}
            onDropdownToggle={onDropdownToggle}
            onDropdownOpenStateChange={onDropdownToggle}
            options={customOptions.industry}
            onNotification={(message, type) => {
              if (type === "success" || type === "error") {
                onMessage(type, message);
              }
            }}
            disabled={isOrgSelected && !isNewMode && autofilledFields.industry}
          />
          {/* Desktop auto-filled badge inside dropdown */}
          {isOrgSelected && !isNewMode && autofilledFields.industry && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm pointer-events-none">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 sm:mb-4 relative">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Organization Location<span className="text-red-500">*</span>
          </label>
          {/* Mobile auto-filled badge next to label */}
          {isOrgSelected && !isNewMode && autofilledFields.location && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <CountryDropdown
            onSelect={(value) => handleLocalDataChange("location", value)}
            defaultValue={localData.location}
            onDropdownToggle={onDropdownToggle}
            onDropdownOpenStateChange={onDropdownToggle}
            options={customOptions.country}
            disabled={isOrgSelected && !isNewMode && autofilledFields.location}
          />
          {/* Desktop auto-filled badge inside dropdown */}
          {isOrgSelected && !isNewMode && autofilledFields.location && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm pointer-events-none">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Organization Website
          </label>
          {/* Mobile auto-filled badge next to label */}
          {isOrgSelected && !isNewMode && autofilledFields.website && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            className={inputClassName(
              localData.website,
              isOrgSelected && !isNewMode && autofilledFields.website
            )}
            value={localData.website}
            onChange={(e) => handleLocalDataChange("website", e.target.value)}
            placeholder="Enter organization website"
            disabled={isOrgSelected && !isNewMode && autofilledFields.website}
          />
          {/* Desktop auto-filled badge inside input */}
          {isOrgSelected && !isNewMode && autofilledFields.website && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm pointer-events-none">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

OrganizationInformation.displayName = "OrganizationInformation";
export default React.memo(OrganizationInformation);
