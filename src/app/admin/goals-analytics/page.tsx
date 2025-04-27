"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import ExpandButton from "@/app/home/components/ExpandButton";
import Dropdowns from "./Dropdowns";
import AnalyticsTable from "@/app/admin/goals-analytics/components/AnalyticsTable/AnalyticsTable";
import { useAuth } from "@/app/AuthContext";
import useFetchPics from "./hooks/useFetchPics";
import useFetchGoalsAnalytics from "./hooks/useFetchGoalsAnalytics";
import ChartCard from "@/app/admin/goals-analytics/Charts/ChartCard";
import SkeletonAnalyticsTable from "./SkeletonCards/SkeletonAnalyticsTable";

interface TaskData {
  label: string;
  quantity: number;
  timeSpent: number;
  targetQuantity: number;
  targetTime?: number;
  targetType?: string | null;
  measurementType?: string;
  taskId: number;
}

interface ChartTaskData {
  type: string;
  quantity: number;
  timeSpent: number;
  count: number;
  targetQuantity: number;
  targetTime?: number;
  targetType?: string | null;
  measurementType?: string;
  taskId: number;
}

const GoalsAnalytics = () => {
  const { user } = useAuth();
  const {
    users: fetchedPics,
    loading: picsLoading,
    error: picsError,
  } = useFetchPics();

  const [filters, setFilters] = useState<{
    pic: string[];
    taskType: string[];
    dateSelector: {
      start: string | null;
      end: string | null;
      option: string[];
    };
  }>({
    pic: [],
    taskType: [],
    dateSelector: { start: null, end: null, option: [] },
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [shouldFetchFilteredData, setShouldFetchFilteredData] = useState(false);
  const [picsReady, setPicsReady] = useState(false);

  // Process PICs when they're fetched - follow home page pattern
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

  // Only fetch data when PICs are ready
  const {
    data: filteredData,
    chartData,
    customOptions,
    isLoading: filteredLoading,
    refetch,
  } = useFetchGoalsAnalytics(filters, shouldFetchFilteredData && picsReady);

  const searchBarRef = useRef<{ search: () => void }>({ search: () => {} });
  const [showDropdowns, setShowDropdowns] = useState(false);

  const handleFilterUpdate = useCallback(
    (key: string, value: any) => {
      setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
      setIsInitialLoad(false);
      setShouldFetchFilteredData(true);

      if (picsReady) {
        refetch();
      }
    },
    [refetch, picsReady]
  );

  const formatTaskDataForChart = useCallback(
    (tasks: TaskData[]): ChartTaskData[] => {
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return [];

      return tasks.map((task) => ({
        taskId: task.taskId,
        type: task.label,
        quantity: task.quantity,
        timeSpent: task.timeSpent,
        count: 1,
        targetQuantity: task.targetQuantity || 0,
        targetTime: task.targetTime || 0,
        targetType: task.targetType || null,
        measurementType: task.measurementType || "BOTH",
      }));
    },
    []
  );

  // Process chart data for rendering
  const predefinedTasksChartData = useMemo(() => {
    return formatTaskDataForChart(chartData?.predefinedTasks || []);
  }, [chartData?.predefinedTasks, formatTaskDataForChart]);

  const adHocTasksChartData = useMemo(() => {
    return formatTaskDataForChart(chartData?.adHocTasks || []);
  }, [chartData?.adHocTasks, formatTaskDataForChart]);

  const handleToggleDropdowns = useCallback((isExpanded: boolean) => {
    setShowDropdowns(isExpanded);
  }, []);

  const combinedTasksData = useMemo(() => {
    return [
      ...(predefinedTasksChartData || []),
      ...(adHocTasksChartData || []),
    ];
  }, [predefinedTasksChartData, adHocTasksChartData]);

  // Consider both the PIC loading and filtered data loading states
  const isLoading = picsLoading || (picsReady && filteredLoading) || !picsReady;

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
            transition={{ duration: 0.2 }} // Simplified transition like dashboard page
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
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-4 lg:px-12 mx-auto">
        {/* Pre-defined Tasks Chart with combined cards */}
        <div className="w-full xl:col-span-10">
          <ChartCard
            title="Pre-defined Tasks"
            chartType="combined"
            data={predefinedTasksChartData}
            showProspectCards={false}
            showCombinedCards={true}
            combinedData={combinedTasksData}
            isLoading={isLoading}
          />
        </div>

        {/* Ad Hoc Tasks Chart */}
        <div className="w-full xl:col-span-10 mt-6 mb-6">
          <ChartCard
            title="Ad Hoc Tasks"
            chartType="combined"
            data={adHocTasksChartData}
            showProspectCards={false}
            showCombinedCards={false}
            isLoading={isLoading}
          />
        </div>
      </div>
      {/* Analytics Table */}
      <div className="px-4 lg:px-12 mx-auto">
        <div className="overflow-x-auto">
          {isLoading ? (
            <SkeletonAnalyticsTable />
          ) : (
            <AnalyticsTable
              tableData={filteredData}
              customOptions={customOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalsAnalytics;
