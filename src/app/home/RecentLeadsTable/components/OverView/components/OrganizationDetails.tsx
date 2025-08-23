"use client";

import React from "react";
import { Building2, Briefcase, MapPin, Link } from "lucide-react";
import InfoField from "./InfoField";

interface OrganizationDetailsProps {
  selectedRow: any;
  onCopy: (text: string, fieldName: string) => void;
}

const OrganizationDetails: React.FC<OrganizationDetailsProps> = ({
  selectedRow,
  onCopy,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-3 lg:p-4 shadow-sm">
      <h3 className="text-sm md:text-base lg:text-lg font-medium text-slate-800 mb-2 md:mb-3 flex items-center border-b border-slate-200 pb-2">
        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-600" />
        Organization Details
      </h3>
      <div className="space-y-2 md:space-y-3">
        {/* Organization and Industry - Stack on small, side by side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
          <InfoField
            icon={Building2}
            label="Organization"
            value={selectedRow.organization_name}
            onCopy={onCopy}
          />
          <InfoField
            icon={Briefcase}
            label="Industry"
            value={selectedRow.industry_name}
            onCopy={onCopy}
          />
        </div>

        {/* Location and Website - Stack on small, side by side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
          <InfoField
            icon={MapPin}
            label="Location"
            value={selectedRow.organization_location}
            onCopy={onCopy}
          />
          <InfoField
            icon={Link}
            label="Website"
            value={selectedRow.organization_website}
            isLink={true}
            onCopy={onCopy}
          />
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetails;
