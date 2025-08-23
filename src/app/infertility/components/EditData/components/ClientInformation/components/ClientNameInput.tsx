import React, { useMemo } from "react";
import {
  X,
  PlusCircle,
  Building2,
  User,
  Edit3,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientData } from "../hooks/useClientDropdown";
import ClientDropdown from "./ClientDropdown";

interface ClientNameInputProps {
  searchQuery: string;
  isClientSelected: boolean;
  clientStatus:
    | ""
    | "org-filled"
    | "global-filled"
    | "new"
    | "editing-existing";
  isMobile: boolean;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputFocus: () => void;
  handleInputBlur: () => void;
  handleClearSelection: () => void;
  handleRevertName: () => void;
  originalClientData: ClientData | null;
  isEditingExisting: boolean;
  // Dropdown props
  isDropdownOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  dropdownPosition: { top: number; left: number; width: number };
  currentOrgClient: any;
  localData: ClientData;
  handleSelectOrgClient: (client: any) => void;
  showOrgClients: boolean;
  filteredAvailableClients: any[];
  handleSelectGlobalClient: (client: any) => void;
  showGlobalClients: boolean;
  globalClients: any[];
  showAddNew: boolean;
  handleAddNew: () => void;
  loading: boolean;
  organizationName: string;
}

const ClientNameInput: React.FC<ClientNameInputProps> = ({
  searchQuery,
  isClientSelected,
  clientStatus,
  isMobile,
  nameInputRef,
  handleInputChange,
  handleInputFocus,
  handleInputBlur,
  handleClearSelection,
  handleRevertName,
  originalClientData,
  isEditingExisting,
  isDropdownOpen,
  dropdownRef,
  dropdownPosition,
  currentOrgClient,
  localData,
  handleSelectOrgClient,
  showOrgClients,
  filteredAvailableClients,
  handleSelectGlobalClient,
  showGlobalClients,
  globalClients,
  showAddNew,
  handleAddNew,
  loading,
  organizationName,
}) => {
  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";

    if (clientStatus === "editing-existing") {
      return `bg-yellow-50 border-2 border-yellow-400 ${baseStyle}`;
    }
    if (clientStatus === "org-filled" || clientStatus === "global-filled") {
      return `bg-green-50 border-2 border-green-300 ${baseStyle}`;
    }
    return searchQuery
      ? `bg-white border-2 border-green-700 ${baseStyle}`
      : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
  }, [searchQuery, clientStatus]);

  const getStatusDisplay = () => {
    if (clientStatus === "editing-existing") {
      return {
        icon: <Edit3 className="w-3 h-3 mr-1 text-yellow-600" />,
        text: "Editing existing client",
        shortText: "Editing",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
      };
    }
    if (clientStatus === "new") {
      return {
        icon: <PlusCircle className="w-3 h-3 mr-1 text-green-500" />,
        text: "Adding as new client",
        shortText: "New",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      };
    }
    if (clientStatus === "org-filled") {
      return {
        icon: <Building2 className="w-3 h-3 mr-1 text-green-500" />,
        text: "From current organization",
        shortText: "From Org",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      };
    }
    if (clientStatus === "global-filled") {
      return {
        icon: <User className="w-3 h-3 mr-1 text-green-500" />,
        text: "Auto-filled",
        shortText: "Auto-filled",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      };
    }
    return null;
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="mb-3 sm:mb-4">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <label className="block text-gray-700 text-sm sm:text-base font-semibold">
          Client Name<span className="text-red-500">*</span>
        </label>
        <div className="sm:hidden">
          {statusDisplay && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full ${statusDisplay.bgColor} ${statusDisplay.textColor} text-xs font-semibold border ${statusDisplay.borderColor} shadow-sm`}
            >
              {statusDisplay.icon}
              {statusDisplay.shortText}
            </span>
          )}
        </div>
      </div>

      {/* Editing notification banner with smooth animation */}
      <AnimatePresence>
        {isEditingExisting && originalClientData && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="mt-0.5 flex-shrink-0">
                    <Edit3 className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      Editing existing client name
                    </p>

                    {/* Mobile layout - stacked */}
                    <div className="sm:hidden space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-yellow-700 font-medium">
                          Original:
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-md border border-blue-200">
                          {originalClientData.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-yellow-700 font-medium">
                          New:
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
                          {searchQuery}
                        </span>
                      </div>
                    </div>

                    {/* Desktop layout - single row with arrow */}
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-yellow-700 font-medium">
                          Original:
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg border border-blue-200 shadow-sm">
                          {originalClientData.name}
                        </span>
                      </div>

                      <div className="flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-yellow-600" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-yellow-700 font-medium">
                          New:
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 shadow-sm">
                          {searchQuery}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRevertName}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 hover:border-yellow-400 transition-colors duration-200 shadow-sm hover:shadow-md flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Revert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <input
          ref={nameInputRef}
          type="text"
          className={inputClassName + (isClientSelected ? " pr-12" : "")}
          value={searchQuery}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder="Search for a client or enter new name..."
          autoComplete="off"
        />
        <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 flex-row gap-2 items-center">
          {statusDisplay && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full ${statusDisplay.bgColor} ${statusDisplay.textColor} text-xs font-semibold border ${statusDisplay.borderColor} shadow-sm pointer-events-none whitespace-nowrap`}
            >
              {statusDisplay.icon}
              {statusDisplay.text}
            </span>
          )}

          {isClientSelected && (
            <button
              onClick={handleClearSelection}
              className="p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {isClientSelected && (
          <button
            onClick={handleClearSelection}
            className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors duration-200 flex items-center justify-center"
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        )}

        <ClientDropdown
          isDropdownOpen={isDropdownOpen}
          dropdownRef={dropdownRef}
          dropdownPosition={dropdownPosition}
          currentOrgClient={currentOrgClient}
          localData={localData}
          handleSelectOrgClient={handleSelectOrgClient}
          showOrgClients={showOrgClients}
          filteredAvailableClients={filteredAvailableClients}
          handleSelectGlobalClient={handleSelectGlobalClient}
          showGlobalClients={showGlobalClients}
          globalClients={globalClients}
          showAddNew={showAddNew}
          handleAddNew={handleAddNew}
          loading={loading}
          searchQuery={searchQuery}
          organizationName={organizationName}
        />
      </div>
    </div>
  );
};

export default ClientNameInput;
