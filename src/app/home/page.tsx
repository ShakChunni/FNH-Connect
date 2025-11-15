"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useTableSelector } from "../context/TableSelectorContext";
import ChartCard from "@/app/home/Charts/ChartCard";
import MetricCard from "@/app/home/Charts/MetricCard";
import RecentLeadsTable from "@/app/home/RecentLeadsTable/RecentLeadsTable";
import { AnimatePresence, motion } from "framer-motion";
import Dropdowns from "@/app/home/Dropdowns";
import useFetchedFilteredData from "@/app/home/hooks/useFetchedFilteredData";
import { useAuth } from "@/app/AuthContext";
import useFetchPics from "@/app/home/hooks/useFetchPics";
import { CheckCircle, XCircle, X } from "lucide-react";
import { createPortal } from "react-dom";
import ButtonContainer from "./components/ButtonContainer";
import AddNewData from "@/app/home/AddNewData/AddNewData";

interface FilterState {
  pic: string[];
  dateSelector: {
    start: string | null;
    end: string | null;
    option: string[];
  };
  tableSelector: string;
  leadsFilter: string;
  location: string[];
}

interface SearchParams {
  searchTerm: string;
}

interface UserData {
  id: number;
  username: string;
  role: string;
  manages: string[];
  organizations: string[];
  archived: boolean;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { tableSelectorValue } = useTableSelector();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const handleOpenAddPopup = () => setIsPopupOpen(true);
  const handleCloseAddPopup = () => {
    setIsPopupClosing(true);
    setTimeout(() => {
      setIsPopupOpen(false);
      setIsPopupClosing(false);
    }, 300);
  };
  const handleAddData = (data: any) => {
    handleMessage("success", "Data added successfully!");
  };
  // Fetch PICs with optimized caching
  const { users: fetchedPics, loading: picsLoading } = useFetchPics();

  // State management
  const [filters, setFilters] = useState<FilterState>({
    pic: [],
    dateSelector: { start: null, end: null, option: [] },
    leadsFilter: "All",
    location: [],
    tableSelector: tableSelectorValue,
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [shouldFetchFilteredData, setShouldFetchFilteredData] = useState(false);
  const [picsReady, setPicsReady] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams | undefined>(
    undefined
  );
  const [showDropdowns, setShowDropdowns] = useState(false);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [messageContent, setMessageContent] = useState<string>("");

  // Refs
  const searchBarRef = useRef<{ search: () => void }>({ search: () => {} });
  const messagePopupRef = useRef<HTMLDivElement>(null!);

  // Optimize PIC processing
  useEffect(() => {
    if (fetchedPics?.length > 0 && filters.pic.length === 0) {
      const availablePics = fetchedPics
        .filter((user: UserData) => !user.archived)
        .map(
          (user: UserData) =>
            user.username.charAt(0).toUpperCase() + user.username.slice(1)
        );

      setFilters((prev) => ({ ...prev, pic: availablePics }));

      // Batch state updates to avoid multiple renders
      queueMicrotask(() => {
        setPicsReady(true);
        setShouldFetchFilteredData(true);
      });
    }
  }, [fetchedPics, filters.pic.length]);

  // Fetch main dashboard data
  const {
    data: filteredData,
    activeData,
    previousData,
    filteredLeadSourcePieData,
    filteredPicPieData,
    totalProposalValue,
    totalClosedSale,
    totalPendingSales,
    stagesData,
    picPieChartOptions: filteredPicPieChartOptions,
    leadSourcePieChartOptions: filteredLeadSourcePieChartOptions,
    filteredIndustryBarData,
    isLoading: filteredLoading,
    customOptions,
    chartViewMode,
    toggleChartViewMode,
    refetch,
  } = useFetchedFilteredData(
    filters,
    shouldFetchFilteredData && picsReady,
    searchParams
  );

  // Initial data fetch when PICs are ready
  useEffect(() => {
    if (picsReady && shouldFetchFilteredData) {
      refetch().catch((error) => {
        console.error("Error fetching data:", error);
      });
    }
  }, [picsReady, shouldFetchFilteredData, refetch]);

  const handleTableSearch = useCallback(
    (searchTerm: string) => {
      if (!searchTerm || searchTerm.trim() === "") {
        // When clearing search, reset search params and trigger a fetch
        setSearchParams(undefined);
        // Use setTimeout to ensure state is updated before refetch
        setTimeout(() => {
          refetch();
        }, 0);
      } else {
        // For actual searches - only trigger when called from SearchBar debounce logic

        // Reset location filters when searching
        if (filters.location.length > 0) {
          setFilters((prev) => ({ ...prev, location: [] }));
        }

        // Set search params
        setSearchParams({ searchTerm });

        // Use setTimeout to ensure state is updated before refetch
        setTimeout(() => {
          refetch();
        }, 0);
      }

      // Always ensure fetch flag is set
      setShouldFetchFilteredData(true);
    },
    [refetch, filters.location]
  );

  const handleFilterUpdate = useCallback(
    (key: string, value: any) => {
      setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
      setIsInitialLoad(false);
      setShouldFetchFilteredData(true);

      if (searchParams) {
        setSearchParams(undefined);
      }

      if (picsReady) {
        refetch().catch((error) => {
          console.error("Error refetching data:", error);
        });
      }
    },
    [refetch, picsReady, searchParams]
  );

  const handleToggleDropdowns = useCallback((isExpanded: boolean) => {
    setShowDropdowns(isExpanded);
  }, []);

  const handleMessage = useCallback(
    (type: "success" | "error", content: string) => {
      setMessageType(type);
      setMessageContent(content);
      setShouldFetchFilteredData(true);

      setTimeout(() => {
        setMessageType(null);
        setMessageContent("");
        setShouldFetchFilteredData(false);
      }, 2500);
    },
    [refetch, picsReady]
  );

  const dismissMessage = useCallback(() => {
    setMessageType(null);
    setMessageContent("");
  }, []);

  const handleTableSelectorSelect = useCallback(
    (value: string) => {
      handleFilterUpdate("tableSelector", value);
    },
    [handleFilterUpdate]
  );

  const handleLocationSelect = useCallback(
    (locations: string[]) => {
      handleFilterUpdate("location", locations);
    },
    [handleFilterUpdate]
  );

  // Listen for table filter change events
  useEffect(() => {
    const handleTableFilterChange = (event: CustomEvent) => {
      handleFilterUpdate("tableSelector", event.detail);
    };

    window.addEventListener(
      "tableFilterChange",
      handleTableFilterChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "tableFilterChange",
        handleTableFilterChange as EventListener
      );
    };
  }, [handleFilterUpdate]);

  const picList = useMemo(() => {
    if (!fetchedPics || fetchedPics.length === 0) return [];

    return fetchedPics
      .filter((user: UserData) => !user.archived)
      .map(
        (user: UserData) =>
          user.username.charAt(0).toUpperCase() + user.username.slice(1)
      );
  }, [fetchedPics]);

  // Memoized computed values
  const currentData = useMemo(
    () => ({
      tableData: picsReady ? filteredData : [],
      chartData: picsReady ? activeData : { labels: [], datasets: [] },
      filteredLeadSourcePieData: picsReady
        ? filteredLeadSourcePieData
        : { labels: [], datasets: [] },
      filteredPicPieData: picsReady
        ? filteredPicPieData
        : { labels: [], datasets: [] },
      totalProposalValue: picsReady ? totalProposalValue : 0,
      totalClosedSale: picsReady ? totalClosedSale : 0,
      totalPendingSales: picsReady ? totalPendingSales : 0,
      filteredIndustryBarData: picsReady
        ? filteredIndustryBarData
        : { labels: [], datasets: [] },
      stagesData: picsReady ? stagesData : { labels: [], datasets: [] },
      picPieChartOptions: picsReady ? filteredPicPieChartOptions : {},
      leadSourcePieChartOptions: picsReady
        ? filteredLeadSourcePieChartOptions
        : {},
    }),
    [
      picsReady,
      filteredData,
      activeData,
      filteredLeadSourcePieData,
      filteredPicPieData,
      totalProposalValue,
      totalClosedSale,
      totalPendingSales,
      filteredIndustryBarData,
      stagesData,
      filteredPicPieChartOptions,
      filteredLeadSourcePieChartOptions,
    ]
  );

  const isLoading = picsLoading || (picsReady && filteredLoading) || !picsReady;

  const previousProposalValue =
    parseFloat(previousData?.data?.[0]?.total_proposal_value) || 0;
  const previousClosedSale =
    parseFloat(previousData?.data?.[0]?.total_closed_sale) || 0;
  const previousPendingSales =
    parseFloat(previousData?.data?.[0]?.total_pending_sales) || 0;
  const previousStartDate = previousData?.dateRange?.previousStartDate || "";
  const previousEndDate = previousData?.dateRange?.previousEndDate || "";

  const percentageChange1 =
    previousClosedSale !== 0
      ? ((currentData.totalClosedSale - previousClosedSale) /
          previousClosedSale) *
        100
      : 0;

  const percentageChange2 =
    previousProposalValue !== 0
      ? ((currentData.totalProposalValue - previousProposalValue) /
          previousProposalValue) *
        100
      : 0;

  const percentageChange3 =
    previousPendingSales !== 0
      ? ((currentData.totalPendingSales - previousPendingSales) /
          previousPendingSales) *
        100
      : 0;

  return (
    <>
      <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-3 lg:pb-2">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-3 lg:pt-2">
          <div className="space-y-4 px-4 sm:space-y-6 sm:px-6 lg:px-8 w-full max-w-full overflow-hidden">
            <ButtonContainer
              onToggleExpand={handleToggleDropdowns}
              isExpanded={showDropdowns}
              onAddData={handleOpenAddPopup}
            />

            <AnimatePresence>
              {showDropdowns && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex justify-center items-center mb-4 py-4">
                    <div className="flex items-center space-x-4">
                      <Dropdowns
                        filters={filters}
                        fetchedPics={fetchedPics}
                        onFilterChange={handleFilterUpdate}
                        searchBarRef={searchBarRef}
                        isInitialLoad={isInitialLoad}
                        shouldFetchFilteredData={shouldFetchFilteredData}
                        setShouldFetchFilteredData={setShouldFetchFilteredData}
                        tableSelectorValue={filters.tableSelector}
                        onTableSelectorChange={handleTableSelectorSelect}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

        <div className="px-4 lg:px-12 mx-auto">
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="w-full rounded-3xl">
              <MetricCard
                title1="Total Successful Sales"
                value1={`RM ${currentData.totalClosedSale}`}
                percentage1={70}
                color1="#4A90E2"
                title2="Total Pending Sales"
                value2={`RM ${currentData.totalPendingSales}`}
                percentage2={50}
                color2="#FF9F40"
                title3="Total Proposal Value"
                value3={`RM ${currentData.totalProposalValue}`}
                percentage3={50}
                color3="#003366"
                percentageChange1={percentageChange1}
                percentageChange2={percentageChange3}
                percentageChange3={percentageChange2}
                direction1={percentageChange1 >= 0 ? "up" : "down"}
                direction2={percentageChange3 >= 0 ? "up" : "down"}
                direction3={percentageChange2 >= 0 ? "up" : "down"}
                previousValue1={`RM ${previousClosedSale}`}
                previousValue2={`RM ${previousPendingSales}`}
                previousValue3={`RM ${previousProposalValue}`}
                previousStartDate={previousStartDate}
                previousEndDate={previousEndDate}
                isLoading={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-10 gap-4 md:gap-6">
              <div className="col-span-1 xl:col-span-4">
                <div className="flex flex-col h-full gap-4 md:gap-6">
                  <div className="flex-1 min-h-[460px] xl:min-h-[600px] rounded-3xl">
                    <ChartCard
                      title={
                        chartViewMode === "leads"
                          ? "Leads by PIC"
                          : "Organizations by PIC"
                      }
                      data={currentData.filteredPicPieData}
                      options={currentData.picPieChartOptions}
                      type="picPie"
                      isLoading={isLoading}
                      chartViewMode={chartViewMode}
                      toggleChartViewMode={toggleChartViewMode}
                    />
                  </div>

                  <div className="flex-1 rounded-3xl">
                    <ChartCard
                      title="Metrics"
                      data={currentData.stagesData}
                      type="stagesBar"
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-1 xl:col-span-6">
                <div className="flex flex-col h-full gap-4 md:gap-6">
                  <div className="flex-1 xl:min-h-[600px] rounded-3xl">
                    <ChartCard
                      title={
                        chartViewMode === "leads"
                          ? "Lead Source"
                          : "Organization Source"
                      }
                      data={currentData.filteredLeadSourcePieData}
                      options={currentData.leadSourcePieChartOptions}
                      type="leadsourcePie"
                      isLoading={isLoading}
                      chartViewMode={chartViewMode}
                      toggleChartViewMode={toggleChartViewMode}
                    />
                  </div>

                  <div className="flex-1 rounded-3xl">
                    <ChartCard
                      title={
                        chartViewMode === "leads"
                          ? "Industries"
                          : "Organization Industries"
                      }
                      data={currentData.filteredIndustryBarData}
                      options={currentData.leadSourcePieChartOptions}
                      type="industryBar"
                      isLoading={isLoading}
                      chartViewMode={chartViewMode}
                      toggleChartViewMode={toggleChartViewMode}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl shadow-lg mb-16 md:mb-8">
            <RecentLeadsTable
              tableData={currentData.tableData}
              tableSelectorValue={filters.tableSelector}
              customOptions={customOptions}
              onMessage={handleMessage}
              messagePopupRef={messagePopupRef}
              onSearch={handleTableSearch}
              isLoading={isLoading}
              picList={picList}
              enableAutoSearch={true}
              debounceMs={500}
              minSearchLength={2}
            />
          </div>
          </div>
        </div>
      </div>
      {/* Message Popup Portal */}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {messageType && (
              <motion.div
                ref={messagePopupRef}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 flex items-center justify-center z-[99999]"
              >
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center border border-gray-100">
                  {/* Icon */}
                  <div className="mb-4 flex justify-center">
                    <div
                      className={`p-3 rounded-full ${
                        messageType === "success"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {messageType === "success" ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                  </div>
                  {/* Title */}
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      messageType === "success"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {messageType === "success" ? "Success!" : "Error!"}
                  </h3>
                  {/* Message */}
                  <div className="mb-6 text-gray-600 leading-relaxed">
                    {messageContent}
                  </div>
                  <button
                    onClick={dismissMessage}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      messageType === "success"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      {(isPopupOpen || isPopupClosing) &&
        typeof window !== "undefined" &&
        createPortal(
          <AddNewData
            isOpen={isPopupOpen && !isPopupClosing}
            onClose={handleCloseAddPopup}
            onSubmit={handleAddData}
            onMessage={handleMessage}
            messagePopupRef={messagePopupRef}
            customOptions={customOptions}
            tableSelectorValue={filters.tableSelector || ""}
            picList={picList}
          />,
          document.body
        )}
    </>
  );
};

export default Dashboard;
