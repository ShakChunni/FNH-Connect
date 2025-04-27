import React, { useState, useRef, useEffect } from "react";
import { Minus, MoreHorizontal, Info } from "lucide-react";

interface TableRowProps {
  log: any;
  handleDescriptionClick: (log: any) => void;
}

const TableRow: React.FC<TableRowProps> = ({ log, handleDescriptionClick }) => {
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: true,
    right: true,
  });
  const infoRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isActionApplicable = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "INACTIVE",
    "ACTIVE",
  ].includes(log.action);

  // Responsive tooltip positioning
  useEffect(() => {
    if (showDeviceDetails && infoRef.current && tooltipRef.current) {
      const infoRect = infoRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - infoRect.bottom;
      const spaceAbove = infoRect.top;
      const spaceToRight = viewportWidth - infoRect.right;

      setTooltipPosition({
        top: spaceBelow < tooltipRect.height && spaceAbove > tooltipRect.height,
        right: spaceToRight < tooltipRect.width,
      });
    }
  }, [showDeviceDetails]);

  const formatDescription = (description: string) => {
    if (["DELETE", "INACTIVE"].includes(log.action) && description) {
      const cutoffDate = new Date("2025-01-09");
      const logDate = new Date(log.timestamp);

      if (logDate >= cutoffDate) {
        const parts = description.split("Reason:");
        return (
          <>
            {parts[0]}
            <br />
            <strong>Reason:</strong>
            <i>{parts[1]}</i>
          </>
        );
      } else {
        return description.split("Reason:")[0];
      }
    }
    return description;
  };

  const getDeviceInfo = () => {
    if (log.os_name) {
      return log.os_name + (log.os_version ? ` ${log.os_version}` : "");
    }
    return log.device_type || "Unknown device";
  };

  // Responsive device details tooltip
  const deviceDetails = (
    <div className="p-2 sm:p-3 bg-white rounded-xl shadow-lg border border-gray-200 text-[10px] xs:text-xs sm:text-xs md:text-sm space-y-1 z-[100] w-[90vw] max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg break-words overflow-auto">
      {log.browser_name && (
        <div>
          <strong>Browser:</strong> {log.browser_name}{" "}
          {log.browser_version || ""}
        </div>
      )}
      {log.os_name && (
        <div>
          <strong>OS:</strong> {log.os_name} {log.os_version || ""}
        </div>
      )}
      {log.device_vendor && (
        <div>
          <strong>Device Vendor:</strong> {log.device_vendor}
        </div>
      )}
      {log.device_model && (
        <div>
          <strong>Device Model:</strong> {log.device_model}
        </div>
      )}
      {log.device_type_spec && (
        <div>
          <strong>Device Type:</strong> {log.device_type_spec}
        </div>
      )}
      {log.device_type && (
        <div>
          <strong>Device Category:</strong> {log.device_type}
        </div>
      )}
    </div>
  );

  return (
    <tr
      key={log.id}
      className="hover:bg-gray-50 border-b text-[10px] xs:text-xs sm:text-sm md:text-base"
    >
      <td className="px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-4 whitespace-nowrap border-r border-gray-100">
        {new Date(log.timestamp).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "UTC",
        })}
      </td>
      <td className="px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-4 font-bold whitespace-nowrap border-r border-gray-100">
        {log.action}
      </td>
      <td className="px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-4 border-r border-gray-100">
        <div className="flex justify-between items-start gap-1 xs:gap-2">
          <span className="break-words whitespace-pre-wrap max-w-[120px] xs:max-w-[200px] sm:max-w-[300px] md:max-w-[450px]">
            {isActionApplicable ? (
              <span
                onClick={() => handleDescriptionClick(log)}
                className="cursor-pointer"
              >
                {formatDescription(log.description) || (
                  <Minus className="w-4 h-4 inline text-gray-500" />
                )}
              </span>
            ) : (
              <span>
                {formatDescription(log.description) || (
                  <Minus className="w-4 h-4 inline text-gray-500" />
                )}
              </span>
            )}
          </span>
          {isActionApplicable && (
            <MoreHorizontal
              className="w-4 h-4 inline text-gray-500 cursor-pointer flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (!log.source_id) {
                  log.source_id = log.id;
                }
                handleDescriptionClick(log);
              }}
            />
          )}
        </div>
      </td>
      <td className="px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-4 whitespace-nowrap border-r border-gray-100">
        {log.username.charAt(0).toUpperCase() + log.username.slice(1)}
      </td>
      <td className="px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-4 whitespace-nowrap border-r border-gray-100">
        {log.ip_address}
      </td>
      <td className="px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-4 whitespace-nowrap border-r border-gray-100 relative">
        <div className="flex items-center gap-1 xs:gap-2">
          <span
            className="truncate max-w-[60px] xs:max-w-[90px] sm:max-w-[150px]"
            title={getDeviceInfo()}
          >
            {getDeviceInfo()}
          </span>
          <div className="relative" ref={infoRef}>
            <Info
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-900 cursor-pointer"
              onMouseEnter={() => setShowDeviceDetails(true)}
              onMouseLeave={() => setShowDeviceDetails(false)}
              onClick={() => setShowDeviceDetails(!showDeviceDetails)}
            />
            {showDeviceDetails && (
              <div
                ref={tooltipRef}
                className={`absolute ${
                  tooltipPosition.top ? "bottom-full mb-2" : "top-full mt-2"
                } ${tooltipPosition.right ? "right-0" : "left-0"} z-[99]`}
              >
                {deviceDetails}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default TableRow;
