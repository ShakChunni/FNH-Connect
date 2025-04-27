"use client";
import React, { useState, useRef } from "react";
import { useAuth } from "@/app/AuthContext";
import ContactsTable from "./components/ContactsTable";
import useFetchLeadsData from "./hooks/useFetchLeadsData";

export default function LeadsManagement() {
  const { user } = useAuth();
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [messageContent, setMessageContent] = useState<string>("");
  const messagePopupRef = useRef<HTMLDivElement>(null);

  // Use the data fetching hook instead of hardcoded data
  const {
    data: contactsData,
    loading: isLoading,
    error,
    refetch,
    applyFilters,
  } = useFetchLeadsData();

  // If there's an error from the hook, show it
  React.useEffect(() => {
    if (error) {
      handleMessage("error", error);
    }
  }, [error]);

  const handleDataChange = (newData?: any[]) => {
    if (newData) {
      // Handle the new data - we'll send it to the API
      // and then refetch to get the updated list
      refetch();

      // For immediate UI feedback, we could also do:
      // refetch(newData);
    }
  };

  const handleMessage = (type: "success" | "error", content: string) => {
    setMessageType(type);
    setMessageContent(content);
    setTimeout(() => {
      setMessageType(null);
      setMessageContent("");
    }, 2500);
  };

  const dismissMessage = () => {
    setMessageType(null);
    setMessageContent("");
  };

  return (
    <div className="bg-[#E3E6EB] min-h-screen pt-6">
      <div className="px-4 lg:px-12 mx-auto">
        {/* Message popup */}
        {messageType && (
          <div
            ref={messagePopupRef}
            className="fixed inset-0 flex items-center justify-center z-[9999]"
            onClick={dismissMessage}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`mb-4 ${
                  messageType === "error" ? "text-red-500" : "text-green-500"
                }`}
              >
                {messageContent}
              </div>
              <button
                onClick={dismissMessage}
                className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg w-full"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        <div className="mt-6">
          <ContactsTable
            tableData={contactsData}
            isLoading={isLoading}
            onMessage={handleMessage}
            messagePopupRef={messagePopupRef}
            onDataChange={handleDataChange}
          />
        </div>
      </div>
    </div>
  );
}
