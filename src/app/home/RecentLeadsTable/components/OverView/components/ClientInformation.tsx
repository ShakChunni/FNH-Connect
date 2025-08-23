"use client";

import React from "react";
import { User, Mail, Phone, Briefcase } from "lucide-react";
import InfoField from "./InfoField";

interface ClientInformationProps {
  selectedRow: any;
  onCopy: (text: string, fieldName: string) => void;
}

const ClientInformation: React.FC<ClientInformationProps> = ({
  selectedRow,
  onCopy,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-3 lg:p-4 shadow-sm">
      <h3 className="text-sm md:text-base lg:text-lg font-medium text-slate-800 mb-2 md:mb-3 flex items-center border-b border-slate-200 pb-2">
        <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-600" />
        Client Information
      </h3>
      <div className="space-y-2 md:space-y-3">
        {/* Client Name and Position - Side by Side on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          <InfoField
            icon={User}
            label="Client Name"
            value={selectedRow.client_name}
            onCopy={onCopy}
          />
          <InfoField
            icon={Briefcase}
            label="Client Position"
            value={selectedRow.client_position}
            onCopy={onCopy}
          />
        </div>

        {/* Phone and Email - Side by Side on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          <InfoField
            icon={Phone}
            label="Client Phone"
            value={selectedRow.client_contact_number}
            isPhoneNumber={true}
            onCopy={onCopy}
          />
          <InfoField
            icon={Mail}
            label="Client Email"
            value={selectedRow.client_contact_email}
            onCopy={onCopy}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientInformation;
