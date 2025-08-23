import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { User, PlusCircle, Loader2, Info } from "lucide-react";
import { Client } from "../../../hooks/useFetchOrganizationInformation";
import { ClientWithOrg } from "../../../hooks/useFetchClientInformation";
import { ClientData } from "../hooks/useClientDropdown";

interface ClientDropdownProps {
  isDropdownOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  dropdownPosition: { top: number; left: number; width: number };
  currentOrgClient: Client | null;
  localData: ClientData;
  handleSelectOrgClient: (client: Client) => void;
  showOrgClients: boolean;
  filteredAvailableClients: Client[];
  handleSelectGlobalClient: (client: ClientWithOrg) => void;
  showGlobalClients: boolean;
  globalClients: ClientWithOrg[];
  showAddNew: boolean;
  handleAddNew: () => void;
  loading: boolean;
  searchQuery: string;
  organizationName: string;
}

const ClientDropdown: React.FC<ClientDropdownProps> = ({
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
  searchQuery,
  organizationName,
}) => {
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
            {/* Current org client section */}
            {currentOrgClient && (
              <>
                <div className="bg-blue-50 px-3 py-2 border-b border-blue-200 flex items-center gap-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Existing Linked Client
                  </p>
                  <span title="This is the client that was originally selected for this organization.">
                    <Info className="w-3 h-3 text-blue-400" />
                  </span>
                </div>
                <div
                  key={`current-org-${currentOrgClient.id}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectOrgClient(currentOrgClient);
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 ${
                    localData.id === currentOrgClient.id ? "bg-blue-25" : ""
                  }`}
                >
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">
                      {currentOrgClient.name}
                    </p>
                    {localData.id === currentOrgClient.id ? (
                      <p className="text-xs text-blue-600 font-medium">
                        Currently selected
                      </p>
                    ) : (
                      <p className="text-xs text-blue-600 font-medium">
                        Original selection
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Organization clients section */}
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
                {filteredAvailableClients.map((client) => {
                  const isCurrentOrgClient =
                    currentOrgClient && client.id === currentOrgClient.id;
                  const isCurrentlySelected = localData.id === client.id;

                  if (isCurrentOrgClient) return null;

                  return (
                    <div
                      key={`org-${client.id}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectOrgClient(client);
                      }}
                      className={`px-4 py-3 cursor-pointer hover:bg-green-50 flex items-center gap-3 border-b border-gray-100 ${
                        isCurrentlySelected ? "bg-green-25" : ""
                      }`}
                    >
                      <div className="p-1.5 rounded-full bg-green-100">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">
                          {client.name}
                        </p>
                        {isCurrentlySelected ? (
                          <p className="text-xs text-green-600 font-medium">
                            Currently selected
                          </p>
                        ) : (
                          <p className="text-xs text-green-600 font-medium">
                            {organizationName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Search hint */}
            {searchQuery.length === 0 && showOrgClients && (
              <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-xs border-t border-gray-100">
                <Info className="w-4 h-4 text-gray-400" />
                Type to search for more contacts from our database.
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center p-4 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Searching...
              </div>
            )}

            {/* Global clients section */}
            {showGlobalClients && (
              <>
                {(showOrgClients || currentOrgClient) && (
                  <div className="bg-green-50 px-3 py-2 border-b border-t border-green-200">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      From Other Organizations
                    </p>
                  </div>
                )}
                {!showOrgClients && !currentOrgClient && (
                  <div className="bg-green-50 px-3 py-2 border-b border-green-200">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      From Other Organizations
                    </p>
                  </div>
                )}
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

            {/* Add new option */}
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

            {/* No results state */}
            {!currentOrgClient &&
              !showOrgClients &&
              !showGlobalClients &&
              !showAddNew &&
              !loading && (
                <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-xs">
                  <Info className="w-4 h-4 text-gray-400" />
                  No organization contacts available. Type to search our
                  database.
                </div>
              )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof window !== "undefined"
    ? createPortal(dropdownContent, document.body)
    : null;
};

export default ClientDropdown;
