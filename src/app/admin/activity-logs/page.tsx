"use client";
import React, { useState, useMemo, useCallback, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import useFetchActivityLog from "./hooks/useFetchActivityLog";
import useFetchOverviewLog from "./hooks/useFetchOverviewLog";
import {
  Pagination,
  SkeletonTable,
  Overview,
  TableHeader,
  TableRow,
} from "./components";
import Options from "./components/Options";

const ActivityLogs: React.FC = () => {
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    start: string | null;
    end: string | null;
    option: string[];
  }>({
    start: null,
    end: null,
    option: [],
  });
  const [searchQuery, setSearchQuery] = useState("");

  const {
    activityLogs,
    loading,
    error,
    page,
    totalPages,
    totalRecords,
    setPage,
    refetch,
  } = useFetchActivityLog({
    activityTypes: selectedActivities,
    dateRange,
    searchQuery,
  });

  const {
    overviewData,
    loading: overviewLoading,
    error: overviewError,
    fetchOverviewData,
  } = useFetchOverviewLog();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  } | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentScrollLeft, setCurrentScrollLeft] = useState(0);

  const handleActivityTypeChange = useCallback((values: string[]) => {
    setSelectedActivities(values);
  }, []);

  const handleDateRangeChange = useCallback(
    (value: { start: string | null; end: string | null; option: string[] }) => {
      setDateRange(value);
    },
    []
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  const compareIPs = (ip1: string, ip2: string) => {
    const ip1Parts = ip1.split(".").map(Number);
    const ip2Parts = ip2.split(".").map(Number);

    for (let i = 0; i < 4; i++) {
      if (ip1Parts[i] !== ip2Parts[i]) {
        return ip1Parts[i] - ip2Parts[i];
      }
    }
    return 0;
  };

  // We don't need to filter logs client-side anymore
  // Let the API handle filtering based on search query
  const sortedLogs = useMemo(() => {
    const sortableLogs = [...activityLogs];
    if (sortConfig !== null) {
      sortableLogs.sort((a, b) => {
        if (sortConfig.key === "ipAddress") {
          const comparison = compareIPs(a.ip_address, b.ip_address);
          return sortConfig.direction === "ascending"
            ? comparison
            : -comparison;
        }

        if (sortConfig.key === "timestamp") {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return sortConfig.direction === "ascending"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        }

        if (sortConfig.key === "deviceInfo") {
          const aDeviceInfo = a.browser_name || a.device_type || "";
          const bDeviceInfo = b.browser_name || b.device_type || "";

          if (aDeviceInfo < bDeviceInfo) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (aDeviceInfo > bDeviceInfo) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }

        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];

        if (aValue !== undefined && bValue !== undefined) {
          if (aValue < bValue) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
        }
        return 0;
      });
    }
    return sortableLogs;
  }, [activityLogs, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prevSortConfig) => {
      if (prevSortConfig && prevSortConfig.key === key) {
        if (prevSortConfig.direction === "ascending") {
          return { key, direction: "descending" };
        } else if (prevSortConfig.direction === "descending") {
          return null;
        }
      }
      return { key, direction: "ascending" };
    });
  };

  const getClassNamesFor = (name: string) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === "ascending") {
      return <ChevronUp className="w-4 h-4 inline text-gray-500" />;
    }
    if (sortConfig.direction === "descending") {
      return <ChevronDown className="w-4 h-4 inline text-gray-500" />;
    }
    return null;
  };

  const handleDescriptionClick = (log: any) => {
    const { action, source_table, source_id, description } = log;

    setSelectedLog(log);

    if (action === "DELETE") {
      fetchOverviewData(source_id, source_table, true);
    } else if (["CREATE", "UPDATE", "INACTIVE"].includes(action)) {
      fetchOverviewData(source_id, source_table, false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tableContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - tableContainerRef.current.offsetLeft);
      setCurrentScrollLeft(tableContainerRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (tableContainerRef.current) {
      const x = e.pageX - tableContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      tableContainerRef.current.scrollLeft = currentScrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-[#E3E6EB] p-6">
      <div className="px-4 lg:px-6 mx-auto">
        {/* Filter Controls */}
        <div className="w-full mb-6">
          <Options
            onActivityTypeChange={handleActivityTypeChange}
            onDateRangeChange={handleDateRangeChange}
            onSearchChange={handleSearchChange}
            selectedActivities={selectedActivities}
            dateRange={dateRange}
            searchQuery={searchQuery}
          />
        </div>

        {/* Record count info */}
        {!loading && totalRecords > 0 && (
          <div className="text-sm text-gray-600 mb-2">
            Showing {activityLogs.length} of {totalRecords} records
          </div>
        )}

        {/* Main Content Container */}
        <div
          className="overflow-x-auto w-full rounded-2xl"
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            transition: "scroll-left 0.3s ease-out",
            userSelect: "none",
            maxHeight: "calc(100vh - 200px)",
          }}
        >
          {loading ? (
            <SkeletonTable />
          ) : (
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <TableHeader
                requestSort={requestSort}
                getClassNamesFor={getClassNamesFor}
                getSortIcon={getSortIcon}
              />
              <tbody>
                {sortedLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    log={{ ...log, id: String(log.id) }}
                    handleDescriptionClick={() => handleDescriptionClick(log)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls - Add this block */}
        {totalPages > 0 && (
          <div className="mt-2 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPreviousPage={() => setPage(page > 1 ? page - 1 : 1)}
              onNextPage={() =>
                setPage(page < totalPages ? page + 1 : totalPages)
              }
              onPageChange={setPage}
              scrollToTop={scrollToTop}
            />
          </div>
        )}
      </div>

      {/* Overview Modal */}
      {selectedLog && (
        <Overview
          selectedRow={selectedLog}
          formatDate={(date) =>
            date ? new Date(date).toLocaleDateString("en-GB") : ""
          }
          handleClosePopup={() => setSelectedLog(null)}
          onEditClick={() => {}}
        />
      )}
    </div>
  );
};

export default ActivityLogs;
