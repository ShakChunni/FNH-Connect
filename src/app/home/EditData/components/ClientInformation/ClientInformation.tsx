import React, { useMemo } from "react";
import { User } from "lucide-react";
import { Client } from "../../hooks/useFetchOrganizationInformation";
import useClientDropdown, { ClientData } from "./hooks/useClientDropdown";

import ContactPhoneInput from "../ContactPhoneInput";
import ContactEmailInput from "../ContactEmailInput";
import ClientNameInput from "./components/ClientNameInput";

interface ClientInformationProps {
  onDataChange: (data: ClientData) => void;
  availableClients: Client[];
  onDropdownToggle: (isOpen: boolean) => void;
  isMobile: boolean;
  onValidationChange: (isValid: { phone: boolean; email: boolean }) => void;
  value?: ClientData;
  organizationName: string;
}

const ClientInformation: React.FC<ClientInformationProps> = ({
  onDataChange,
  availableClients,
  onDropdownToggle,
  isMobile,
  onValidationChange,
  value,
  organizationName,
}) => {
  const {
    // State
    localData,
    searchQuery,
    isDropdownOpen,
    clientStatus,
    isClientSelected,
    autofilledFields,
    isPhoneValid,
    isEmailValid,
    originalClientData,
    isEditingExisting,

    // Refs
    nameInputRef,
    dropdownRef,
    dropdownPosition,

    // Computed values
    filteredAvailableClients,
    currentOrgClient,
    showOrgClients,
    showGlobalClients,
    showAddNew,
    loading,
    globalClients,

    // Handlers
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleClearSelection,
    handleFieldChange,
    handleSelectOrgClient,
    handleSelectGlobalClient,
    handleAddNew,
    handleRevertName,
    setIsPhoneValid,
    setIsEmailValid,
  } = useClientDropdown({
    availableClients,
    onDropdownToggle,
    onValidationChange,
    onDataChange,
    value,
  });

  const getHeaderBg = () => {
    if (clientStatus === "editing-existing") {
      return "from-yellow-50 to-yellow-100 border-yellow-200";
    }
    if (
      clientStatus === "org-filled" ||
      clientStatus === "global-filled" ||
      clientStatus === "new"
    ) {
      return "from-green-50 to-green-100 border-green-200";
    }
    return "from-indigo-50 to-indigo-100 border-indigo-200";
  };

  const getDescription = () => {
    if (clientStatus === "editing-existing") {
      return "You are updating an existing client's name. All other fields remain editable.";
    }
    if (clientStatus === "org-filled") {
      return "Client details auto-filled from organization. All fields remain editable.";
    }
    if (clientStatus === "global-filled") {
      return "Client details auto-filled. All fields remain editable.";
    }
    if (clientStatus === "new") {
      return "You are adding a new client. Please fill in all required details.";
    }
    return "Search for an existing contact or add a new one.";
  };

  const getHeaderIcon = () => {
    if (clientStatus === "editing-existing") {
      return "text-yellow-600";
    }
    if (clientStatus) {
      return "text-green-600";
    }
    return "text-indigo-600";
  };

  const getHeaderTextColor = () => {
    if (clientStatus === "editing-existing") {
      return "text-yellow-700";
    }
    if (clientStatus) {
      return "text-green-700";
    }
    return "text-indigo-700";
  };

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

  return (
    <div id="client" className="mb-6 sm:mb-8 md:mb-10">
      <div
        className={`bg-gradient-to-r ${getHeaderBg()} rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
            <User className={getHeaderIcon()} size={isMobile ? 20 : 24} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
              Client Information (PIC)
            </h3>
            <p
              className={`${getHeaderTextColor()} text-xs sm:text-sm font-medium leading-tight transition-colors duration-300`}
            >
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Client Name Input */}
      <ClientNameInput
        searchQuery={searchQuery}
        isClientSelected={isClientSelected}
        clientStatus={clientStatus}
        isMobile={isMobile}
        nameInputRef={nameInputRef}
        handleInputChange={handleInputChange}
        handleInputFocus={handleInputFocus}
        handleInputBlur={handleInputBlur}
        handleClearSelection={handleClearSelection}
        handleRevertName={handleRevertName}
        originalClientData={originalClientData}
        isEditingExisting={isEditingExisting}
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
        organizationName={organizationName}
      />

      {/* Client Position */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Client Position
          </label>
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

      {/* Client Phone */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Client Phone
          </label>
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
            onChange={(value) => handleFieldChange("phone", value)}
            onValidationChange={setIsPhoneValid}
            defaultCountry="MY"
            isAutofilled={autofilledFields.phone}
          />
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

      {/* Client Email */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Client Email
          </label>
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
            onChange={(value) => handleFieldChange("email", value)}
            onValidationChange={setIsEmailValid}
            placeholder="Enter email address"
            isAutofilled={autofilledFields.email}
          />
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
    </div>
  );
};

ClientInformation.displayName = "ClientInformation";
export default React.memo(ClientInformation);
