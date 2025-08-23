"use client";

import React from "react";
import {
  Activity,
  CheckCircle,
  X,
  Clock4,
  AlertCircle,
  Tag,
  Archive,
} from "lucide-react";
import InfoField from "./InfoField";

interface CampaignInformationProps {
  selectedRow: any;
  onCopy: (text: string, fieldName: string) => void;
}

const CampaignInformation: React.FC<CampaignInformationProps> = ({
  selectedRow,
  onCopy,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-3 lg:p-4 shadow-sm">
      <h3 className="text-sm md:text-base lg:text-lg font-medium text-slate-800 mb-2 md:mb-3 flex items-center border-b border-slate-200 pb-2">
        <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-600" />
        Campaign Details
      </h3>

      <div className="space-y-3">
        {/* Campaign Name - Always shown */}
        <div className="w-full">
          <InfoField
            icon={Tag}
            label="Campaign Name"
            value={selectedRow.campaign_name}
            onCopy={onCopy}
          />
        </div>

        {/* Lead Status */}
        <div
          className={`p-4 rounded-2xl border-2 shadow-sm ${
            selectedRow.isInactive
              ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
              : selectedRow.quotation_signed
              ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
              : selectedRow.lost_lead
              ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
              : selectedRow.proposal_in_progress ||
                selectedRow.proposal_sent_out ||
                selectedRow.meetings_conducted
              ? "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
              : "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200"
          }`}
          style={{ minHeight: "60px" }}
        >
          <div className="flex items-center justify-center space-x-2 h-full">
            {selectedRow.isInactive ? (
              <Archive className="h-6 w-6 text-orange-600" />
            ) : selectedRow.quotation_signed ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : selectedRow.lost_lead ? (
              <X className="h-6 w-6 text-red-600" />
            ) : selectedRow.proposal_in_progress ||
              selectedRow.proposal_sent_out ||
              selectedRow.meetings_conducted ? (
              <Clock4 className="h-6 w-6 text-amber-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-slate-500" />
            )}
            <span
              className={`text-base font-semibold ${
                selectedRow.isInactive
                  ? "text-orange-800"
                  : selectedRow.quotation_signed
                  ? "text-green-800"
                  : selectedRow.lost_lead
                  ? "text-red-800"
                  : selectedRow.proposal_in_progress ||
                    selectedRow.proposal_sent_out ||
                    selectedRow.meetings_conducted
                  ? "text-amber-800"
                  : "text-slate-700"
              }`}
            >
              {selectedRow.isInactive
                ? "Archived"
                : selectedRow.quotation_signed
                ? "Deal Closed - Quotation Signed"
                : selectedRow.lost_lead
                ? "Lost Lead"
                : selectedRow.proposal_in_progress ||
                  selectedRow.proposal_sent_out ||
                  selectedRow.meetings_conducted
                ? "In Progress"
                : "New Lead"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignInformation;
