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
import SkeletonRecentLeadsTable from "@/app/home/SkeletonCards/SkeletonRecentLeadsTable";
import SkeletonThreeDDoughnutChart from "@/app/home/SkeletonCards/SkeletonThreeDDoughnutChart";
import SkeletonBarChart from "@/app/home/SkeletonCards/SkeletonBarChart";
import SkeletonThreeDPieChart from "@/app/home/SkeletonCards/SkeletonThreeDPieChart";
import SkeletonMetricCard from "@/app/home/SkeletonCards/SkeletonMetricCard";
import ExpandButton from "@/app/home/components/ExpandButton";
import { AnimatePresence, motion } from "framer-motion";
import Dropdowns from "@/app/home/Dropdowns";
import useFetchedFilteredData from "@/app/home/hooks/useFetchedFilteredData";
import { useAuth } from "@/app/AuthContext";
import useFetchPics from "@/app/home/hooks/useFetchPics";

interface FilterState {
  pic: string[];
  dateSelector: {
    start: string | null;
    end: string | null;
    option: string[];
  };
  tableSelector: string;
  leadsFilter: string;
  location: string[]; // Ensure this is an array for multi-select
}

interface SearchParams {
  searchTerm: string;
  searchField: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { tableSelectorValue } = useTableSelector();
  const {
    users: fetchedPics,
    loading: picsLoading,
    error: picsError,
  } = useFetchPics();

  const [filters, setFilters] = useState<FilterState>({
    pic: [],
    dateSelector: { start: null, end: null, option: [] },
    leadsFilter: "All",
    location: [], // Initialize as empty array
    tableSelector: tableSelectorValue,
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [shouldFetchFilteredData, setShouldFetchFilteredData] = useState(false);
  const [picsReady, setPicsReady] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams | undefined>(
    undefined
  );

  // Process PICs when they're fetched
  useEffect(() => {
    if (fetchedPics && fetchedPics.length > 0 && filters.pic.length === 0) {
      const availablePics = fetchedPics
        .filter((user) => !user.archived)
        .map(
          (user) =>
            user.username.charAt(0).toUpperCase() + user.username.slice(1)
        );

      setFilters((prevFilters) => ({
        ...prevFilters,
        pic: availablePics,
      }));

      setPicsReady(true);
      setShouldFetchFilteredData(true);
    }
  }, [fetchedPics, filters.pic.length]);

  // Always call the hook, but use a disabled state when data isn't ready
  const {
    data: filteredData,
    activeData,
    previousData,
    filteredLeadSourcePieData,
    filteredPicPieData,
    totalProposalValue,
    totalClosedSale,
    stagesData,
    picPieChartOptions: filteredPicPieChartOptions,
    leadSourcePieChartOptions: filteredLeadSourcePieChartOptions,
    filteredIndustryBarData,
    isLoading: filteredLoading,
    customOptions,
    refetch,
    refetchPreviousData,
    refetchCustomOptions,
  } = useFetchedFilteredData(
    filters,
    shouldFetchFilteredData && picsReady,
    searchParams
  );

  const handleTableSearch = useCallback(
    (searchTerm: string, searchField: string) => {
      // Reset location filter when searching
      if (filters.location.length > 0) {
        setFilters((prev) => ({
          ...prev,
          location: [],
        }));
      }

      setSearchParams({ searchTerm, searchField });
      setShouldFetchFilteredData(true);

      // Refetch data with search params
      if (picsReady) {
        refetch();
      }
    },
    [refetch, picsReady, filters.location]
  );

  const searchBarRef = useRef<{ search: () => void }>({ search: () => {} });
  const [showDropdowns, setShowDropdowns] = useState(false);

  const handleFilterUpdate = useCallback(
    (key: string, value: any) => {
      setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
      setIsInitialLoad(false);
      setShouldFetchFilteredData(true);

      // Reset search when filters change
      if (searchParams) {
        setSearchParams(undefined);
      }

      // Only run these if PICs are ready
      if (picsReady) {
        Promise.all([
          refetch(),
          refetchPreviousData(),
          refetchCustomOptions(),
        ]).catch((error) => {
          console.error("Error refetching data:", error);
        });
      }
    },
    [
      refetch,
      refetchPreviousData,
      refetchCustomOptions,
      picsReady,
      searchParams,
    ]
  );

  const handleToggleDropdowns = useCallback((isExpanded: boolean) => {
    setShowDropdowns(() => isExpanded);
  }, []);

  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [messageContent, setMessageContent] = useState<string>("");

  const handleMessage = useCallback(
    (type: "success" | "error", content: string) => {
      setMessageType(type);
      setMessageContent(content);
      setShouldFetchFilteredData(true);

      // Add this to also trigger the notification
      setNotification({
        message: content,
        type: type,
        visible: true,
      });

      if (picsReady) {
        refetch();
      }
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

  const messagePopupRef = useRef<HTMLDivElement>(null);

  // Use empty data if PICs are not ready yet
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
      filteredIndustryBarData,
      stagesData,
      filteredPicPieChartOptions,
      filteredLeadSourcePieChartOptions,
    ]
  );

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  // Add this handler to show notifications
  const handleNotification = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      setNotification({
        message,
        type,
        visible: true,
      });

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, visible: false }));
      }, 3000);
    },
    []
  );

  // Consider both the PIC loading and filtered data loading states
  const isLoading = picsLoading || (picsReady && filteredLoading) || !picsReady;

  const handleTableSelectorSelect = useCallback(
    (value: string) => {
      handleFilterUpdate("tableSelector", value);
    },
    [handleFilterUpdate]
  );

  // Handle location selection
  const handleLocationSelect = useCallback(
    (locations: string[]) => {
      handleFilterUpdate("location", locations);
    },
    [handleFilterUpdate]
  );

  const previousProposalValue =
    parseFloat(previousData?.data?.[0]?.total_proposal_value) || 0;
  const previousClosedSale =
    parseFloat(previousData?.data?.[0]?.total_closed_sale) || 0;

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

  return (
    <div className="bg-[#E3E6EB] min-h-screen pt-6">
      <ExpandButton
        onToggle={handleToggleDropdowns}
        isExpanded={showDropdowns}
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
        <AnimatePresence>
          {messageType && (
            <motion.div
              ref={messagePopupRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-[9999]"
            >
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 text-center">
                <div className="mb-4">{messageContent}</div>
                <button
                  onClick={dismissMessage}
                  className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg w-full"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 mb-8">
          <div className="col-span-1 xl:col-span-4 space-y-6 flex flex-col w-full">
            {isLoading ? (
              <SkeletonMetricCard />
            ) : (
              <MetricCard
                title1="Total Successful Sales"
                value1={`RM ${currentData.totalClosedSale}`}
                percentage1={70}
                color1="#4A90E2"
                title2="Total Proposal Value"
                value2={`RM ${currentData.totalProposalValue}`}
                percentage2={50}
                color2="#003366"
                percentageChange1={percentageChange1}
                percentageChange2={percentageChange2}
                direction1={percentageChange1 >= 0 ? "up" : "down"}
                direction2={percentageChange2 >= 0 ? "up" : "down"}
                previousValue1={`RM ${previousClosedSale}`}
                previousValue2={`RM ${previousProposalValue}`}
                previousStartDate={previousStartDate}
                previousEndDate={previousEndDate}
              />
            )}
            {isLoading ? (
              <SkeletonThreeDDoughnutChart />
            ) : (
              <ChartCard
                title="Leads by PIC"
                data={currentData.filteredPicPieData}
                options={currentData.picPieChartOptions}
                type="picPie"
              />
            )}
            {isLoading ? (
              <SkeletonBarChart />
            ) : (
              <ChartCard
                title="Metrics"
                data={currentData.stagesData}
                type="stagesBar"
              />
            )}
          </div>
          <div className="col-span-1 xl:col-span-6 flex flex-col h-full gap-6">
            <div className="xl:flex-[0.5] flex-auto">
              {isLoading ? (
                <SkeletonThreeDPieChart />
              ) : (
                <ChartCard
                  title="Lead Source"
                  data={currentData.filteredLeadSourcePieData}
                  options={currentData.leadSourcePieChartOptions}
                  type="leadsourcePie"
                />
              )}
            </div>
            <div className="xl:flex-[0.5] flex-auto xl:h-auto">
              {isLoading ? (
                <SkeletonBarChart />
              ) : (
                <ChartCard
                  title="Industries"
                  data={currentData.filteredIndustryBarData}
                  options={currentData.leadSourcePieChartOptions}
                  type="industryBar"
                />
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <SkeletonRecentLeadsTable />
          ) : (
            <RecentLeadsTable
              tableData={currentData.tableData}
              tableSelectorValue={filters.tableSelector}
              customOptions={customOptions}
              onMessage={handleMessage}
              messagePopupRef={messagePopupRef}
              onSearch={handleTableSearch} // Pass the search handler
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
