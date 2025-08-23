"use client";
import { motion } from "framer-motion";
import React from "react";
import {
  Building2,
  Database,
  TrendingUp,
  TrendingDown,
  Circle,
  Users,
  Calendar,
  Clock,
  Edit3,
  X,
  Minus,
  Globe,
  Instagram,
  Mail,
  MessageSquare,
  Phone,
  ShoppingBag,
  Linkedin,
  UserCheck,
  CalendarDays,
  TrendingUp as Warm,
  Handshake,
  User,
  ClipboardList,
} from "lucide-react";

interface OverviewHeaderProps {
  selectedRow: any;
  onEdit: () => void;
  onClose: () => void;
  onCopy: (text: string, fieldName: string) => void;
  formatDateTime: (dateString: string) => string;
}

const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  selectedRow,
  onEdit,
  onClose,
  onCopy,
  formatDateTime,
}) => {
  const getOrganizationValue = (org: string, id: string) => {
    if (org === "MAVN") return `MV-${id}`;
    if (org === "MI") return `TMI-${id}`;
    return org;
  };

  const getLeadSourceIcon = (leadSource: string) => {
    if (!leadSource) return ClipboardList;

    const source = leadSource.toLowerCase();

    switch (source) {
      case "client referral":
        return Handshake;
      case "email":
        return Mail;
      case "whatsapp":
        return MessageSquare;
      case "linkedin":
        return Linkedin;
      case "cold call":
        return Phone;
      case "shopee":
        return ShoppingBag;
      case "instagram":
        return Instagram;
      case "existing client":
        return UserCheck;
      case "event":
        return CalendarDays;
      case "warm lead":
        return Warm;
      case "referral":
        return Handshake;
      case "personal":
        return User;
      case "lazada":
        return ShoppingBag;
      default:
        return ClipboardList;
    }
  };
  const LeadSourceIcon = getLeadSourceIcon(selectedRow.lead_source);

  const getDisplayId = () => {
    return selectedRow.id !== null && selectedRow.source_table
      ? getOrganizationValue(selectedRow.source_table, selectedRow.id)
      : selectedRow.id;
  };

  const renderTimestamp = (
    label: string,
    value: string,
    IconComponent: React.ElementType,
    size: "xs" | "sm" | "md" = "sm"
  ) => {
    const iconSizes = { xs: "h-3 w-3", sm: "h-4 w-4", md: "h-4 w-4" };
    const textSizes = { xs: "text-xs", sm: "text-sm", md: "text-sm" };

    return (
      <div className="flex items-center">
        <IconComponent
          className={`${iconSizes[size]} text-slate-600 mr-1.5 flex-shrink-0`}
        />
        <span
          className={`${textSizes[size]} font-semibold text-slate-700 min-w-[50px]`}
        >
          {label}:
        </span>
        <span className={`${textSizes[size]} text-slate-600 ml-1.5`}>
          {value ? (
            formatDateTime(value)
          ) : (
            <Minus className="inline w-3 h-3 text-slate-400" />
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="mb-3">
      {/* Extra Small Mobile Layout (< sm) */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-blue-900">
            Lead Overview
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={onEdit}
              className="group flex items-center justify-center w-7 h-7 hover:bg-blue-50 rounded-full transition-all duration-200 border border-slate-200 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-600" />
            </button>
            <button
              onClick={onClose}
              className="bg-red-100 hover:bg-red-200 text-red-500 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 hover:scale-110 hover:shadow-md group cursor-pointer"
            >
              <motion.div
                transition={{ duration: 0.2 }}
                whileHover={{
                  rotate: 90,
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.5,
                }}
              >
                <X className="h-5 w-5 group-hover:text-red-600 transition-colors duration-200" />
              </motion.div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div
            className="flex items-center justify-center px-2 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors"
            onClick={() => onCopy(selectedRow.id?.toString() || "", "ID")}
          >
            <Database className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{getDisplayId()}</span>
          </div>
          {selectedRow.PIC && (
            <div
              className="flex items-center justify-center px-2 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200 cursor-pointer hover:bg-green-200 transition-colors"
              onClick={() => onCopy(selectedRow.PIC, "Sales Rep")}
            >
              <Users className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium truncate">
                {selectedRow.PIC}
              </span>
            </div>
          )}
        </div>

        {selectedRow.lead_source && (
          <div
            className="flex items-center justify-center px-2 py-2 bg-purple-100 text-purple-800 rounded-lg cursor-pointer hover:bg-purple-200 transition-colors w-full mb-2 border border-purple-200"
            onClick={() => onCopy(selectedRow.lead_source, "Lead Source")}
          >
            <LeadSourceIcon className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium truncate">
              {selectedRow.lead_source}
            </span>
          </div>
        )}

        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-2">
          <div className="space-y-1">
            {renderTimestamp("Created", selectedRow.createdAt, Calendar, "xs")}
            {renderTimestamp("Updated", selectedRow.updatedAt, Clock, "xs")}
          </div>
        </div>
      </div>

      {/* Small to Medium Layout (sm to lg) */}
      <div className="hidden sm:block lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-blue-900">Lead Overview</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={onEdit}
              className="group flex items-center justify-center w-7 h-7 hover:bg-blue-50 rounded-full transition-all duration-200 border border-slate-200"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-600" />
            </button>
            <button
              onClick={onClose}
              className="bg-red-100 hover:bg-red-200 text-red-500 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 hover:scale-110 hover:shadow-md group"
            >
              <motion.div
                transition={{ duration: 0.2 }}
                whileHover={{
                  rotate: 90,
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.5,
                }}
              >
                <X className="h-5 w-5 group-hover:text-red-600 transition-colors duration-200" />
              </motion.div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div
            className="flex items-center px-2.5 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors"
            onClick={() => onCopy(getDisplayId()?.toString() || "", "ID")}
          >
            <Database className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium">{getDisplayId()}</span>
          </div>
          {selectedRow.PIC && (
            <div
              className="flex items-center px-2.5 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200 cursor-pointer hover:bg-green-200 transition-colors"
              onClick={() => onCopy(selectedRow.PIC, "Sales Rep")}
            >
              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {selectedRow.PIC}
              </span>
            </div>
          )}
        </div>

        {selectedRow.lead_source && (
          <div
            className="flex items-center px-2.5 py-2 bg-purple-100 text-purple-800 rounded-lg cursor-pointer hover:bg-purple-200 transition-colors w-full mb-2 border border-purple-200"
            onClick={() => onCopy(selectedRow.lead_source, "Lead Source")}
          >
            <LeadSourceIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {selectedRow.lead_source}
            </span>
          </div>
        )}

        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-2.5">
          <div className="space-y-1.5">
            {renderTimestamp("Created", selectedRow.createdAt, Calendar)}
            {renderTimestamp("Updated", selectedRow.updatedAt, Clock)}
          </div>
        </div>
      </div>

      {/* Large Desktop Layout (lg and above) */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center space-x-2 lg:space-x-3 flex-1">
          <h2 className="text-base lg:text-lg font-semibold text-blue-900">
            Lead Overview
          </h2>

          <div className="flex items-center space-x-1.5 lg:space-x-2">
            <div className="flex items-center px-2 lg:px-2.5 py-1 lg:py-1.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200 h-7 lg:h-8">
              <Database className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-0.5 lg:mr-1" />
              <span className="text-xs lg:text-sm font-medium">
                {getDisplayId()}
              </span>
            </div>

            {selectedRow.PIC && (
              <div
                className="flex items-center px-2 lg:px-2.5 py-1 lg:py-1.5 bg-green-100 text-green-800 rounded-full border border-green-200 cursor-pointer hover:bg-green-200 transition-colors h-7 lg:h-8"
                onClick={() => onCopy(selectedRow.PIC, "Sales Rep")}
              >
                <Users className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-0.5 lg:mr-1" />
                <span className="text-xs lg:text-sm font-medium">
                  {selectedRow.PIC}
                </span>
              </div>
            )}

            {selectedRow.lead_source && (
              <div
                className="flex items-center px-2 lg:px-2.5 py-1 lg:py-1.5 bg-purple-100 text-purple-800 rounded-full border border-purple-200 cursor-pointer hover:bg-purple-200 transition-colors h-7 lg:h-8"
                onClick={() => onCopy(selectedRow.lead_source, "Lead Source")}
              >
                <LeadSourceIcon className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-0.5 lg:mr-1" />
                <span className="text-xs lg:text-sm font-medium">
                  {selectedRow.lead_source}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5 lg:space-x-2">
          <div className="flex items-center px-2 lg:px-2.5 py-1 lg:py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-full h-7 lg:h-8 space-x-2 lg:space-x-3">
            <div className="flex items-center hover:text-blue-700 transition-colors cursor-default">
              <Calendar className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-0.5 lg:mr-1" />
              <span className="text-xs lg:text-sm font-medium mr-1 hidden xl:inline">
                Created:
              </span>
              <span className="text-xs lg:text-sm">
                {selectedRow.createdAt
                  ? formatDateTime(selectedRow.createdAt)
                  : "N/A"}
              </span>
            </div>
            {selectedRow.updatedAt && (
              <div className="flex items-center hover:text-blue-700 transition-colors cursor-default">
                <Clock className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-0.5 lg:mr-1" />
                <span className="text-xs lg:text-sm font-medium mr-1 hidden xl:inline">
                  Updated:
                </span>
                <span className="text-xs lg:text-sm">
                  {formatDateTime(selectedRow.updatedAt)}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onEdit}
            className="group flex items-center px-2 lg:px-2.5 py-1 lg:py-1.5 bg-slate-100 hover:bg-blue-100 text-slate-800 hover:text-blue-800 rounded-full transition-colors duration-200 border border-slate-200 h-7 lg:h-8"
          >
            <Edit3 className="h-3 w-3 lg:h-3.5 lg:w-3.5 mr-0.5 lg:mr-1" />
            <span className="text-xs lg:text-sm font-medium">Edit</span>
          </button>

          <button
            onClick={onClose}
            className="bg-red-100 hover:bg-red-200 text-red-500 px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 hover:scale-110 hover:shadow-md group h-7 lg:h-8 min-w-[1.75rem] lg:min-w-[2rem]"
          >
            <motion.div
              transition={{ duration: 0.2 }}
              whileHover={{
                rotate: 90,
                scale: 1.1,
              }}
              whileTap={{
                scale: 0.5,
              }}
            >
              <X className="h-4 w-4 lg:h-5 lg:w-4 group-hover:text-red-600 transition-colors duration-200" />
            </motion.div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewHeader;
