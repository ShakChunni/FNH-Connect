import React, { useMemo } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { Tooltip as ReactTooltip } from "react-tooltip";
import AdHocTasksCombinedChart from "./AdHocTasksCombinedChart";
import PreDefinedTasksCombinedChart from "./PreDefinedTasksCombinedChart";
import ProspectCard from "./ProspectCard";
import BookedMeetingsCard from "./BookedMeetingsCard";
import EmailCard from "./EmailCard";
import CallCard from "./CallCard";
import SkeletonBigNumberCard from "../SkeletonCards/SkeletonBigNumberCard";
import SkeletonCombinedChart from "../SkeletonCards/SkeletonCombinedChart";
import { FaUsers } from "react-icons/fa6";
import { FaPhoneVolume, FaAt } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";

interface TaskChartData {
  type: string;
  quantity: number;
  timeSpent: number;
  count: number;
  targetQuantity?: number;
  targetTime?: number;
  targetType?: string | null;
  measurementType?: string;
  taskId: number;
}

interface ChartCardProps {
  title: string;
  data: TaskChartData[];
  chartType: "combined";
  showProspectCards?: boolean;
  showCombinedCards?: boolean;
  combinedData?: TaskChartData[];
  isLoading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  showProspectCards = false,
  showCombinedCards = false,
  combinedData,
  isLoading = false,
}) => {
  const tooltipMessage =
    "This chart shows both task distribution and time spent for each task type.";

  const colors = [
    "#E5536B",
    "#2A8AC4",
    "#E5B845",
    "#3A9C9C",
    "#8654E3",
    "#E68934",
    "#27AE60",
    "#C0392B",
    "#8E44AD",
    "#2980B9",
  ];

  const processedChartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        quantityData: {
          labels: [],
          datasets: [{ label: "No Data", data: [], backgroundColor: [] }],
        },
        timeSpentData: {
          labels: [],
          datasets: [{ label: "No Data", data: [], backgroundColor: [] }],
        },
      };
    }

    const tasksByType = data.reduce(
      (acc, item) => {
        const type = item.type;
        if (!acc[type]) {
          acc[type] = {
            quantity: 0,
            timeSpent: 0,
            targetQuantity: 0,
            targetTime: 0,
            targetType: null,
            measurementType: "BOTH",
            taskIds: new Set(),
          };
        }
        acc[type].quantity += item.quantity || 0;
        acc[type].timeSpent += item.timeSpent || 0;
        acc[type].targetQuantity += item.targetQuantity || 0;
        acc[type].targetTime += item.targetTime || 0;

        // Track task IDs
        if (item.taskId) {
          acc[type].taskIds.add(item.taskId);
        }

        // Only set targetType if it's not already set or if current value is not null
        if (item.targetType) {
          acc[type].targetType = item.targetType;
        }

        // Set measurement type if provided
        if (item.measurementType) {
          acc[type].measurementType = item.measurementType;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          quantity: number;
          timeSpent: number;
          targetQuantity: number;
          targetTime: number;
          targetType: string | null;
          measurementType: string;
          taskIds: Set<number>;
        }
      >
    );

    const labels = Object.keys(tasksByType);

    const quantityData = {
      labels,
      datasets: [
        {
          label: "Tasks Quantity",
          data: labels.map((label) => tasksByType[label].quantity),
          backgroundColor: colors.slice(0, labels.length),
          targetQuantity: labels.map(
            (label) => tasksByType[label].targetQuantity
          ),
          targetTime: labels.map((label) => tasksByType[label].targetTime),
          targetType: labels.map((label) => tasksByType[label].targetType),
          measurementType: labels.map(
            (label) => tasksByType[label].measurementType
          ),
        },
      ],
    };

    const timeSpentData = {
      labels,
      datasets: [
        {
          label: "Time Spent (minutes)",
          data: labels.map((label) => tasksByType[label].timeSpent),
          backgroundColor: colors.slice(0, labels.length),
          targetTime: labels.map((label) => tasksByType[label].targetTime),
          targetType: labels.map((label) => tasksByType[label].targetType),
        },
      ],
    };


    return { quantityData, timeSpentData };
  }, [data]);

  const isAdHoc = title.toLowerCase().includes("ad hoc");

  return (
    <div className="space-y-4">
      {/* Show big number cards (either real or skeleton) */}
      {(showCombinedCards || showProspectCards) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {isLoading ? (
            <>
              {/* Skeleton Big Number Cards */}
              <SkeletonBigNumberCard
                icon={<FaUsers size={130} />}
                backgroundColor="#85CE96"
              />
              <SkeletonBigNumberCard
                icon={<FaAt size={130} />}
                backgroundColor="#4C55BE"
              />
              <SkeletonBigNumberCard
                icon={<FaPhoneVolume size={130} />}
                backgroundColor="#F28E5C"
              />
            </>
          ) : (
            <>
              {/* Real Big Number Cards */}
              {showCombinedCards && combinedData ? (
                <>
                  <BookedMeetingsCard data={combinedData} />
                  <EmailCard data={combinedData} />
                  <CallCard data={combinedData} />
                </>
              ) : (
                showProspectCards && (
                  <>
                    <BookedMeetingsCard data={data} />
                    <EmailCard data={data} />
                    <CallCard data={data} />
                  </>
                )
              )}
            </>
          )}
        </div>
      )}

      {/* Chart area */}
      <div className="bg-[#fff] p-4 sm:p-6 md:p-8 rounded-3xl shadow-md h-full">
        <div className="flex items-center mb-2">
          <h3 className="text-xs md:text-base lg:text-xl font-bold text-blue-950 truncate">
            {isLoading ? <Skeleton width={150} /> : `${title} Overview`}
          </h3>
          {!isLoading && (
            <div className="flex items-center ml-2">
              <FaInfoCircle
                data-tooltip-id={`combined-chart-tooltip-${
                  isAdHoc ? "adhoc" : "predefined"
                }`}
                className="text-gray-600"
              />
              <ReactTooltip
                id={`combined-chart-tooltip-${
                  isAdHoc ? "adhoc" : "predefined"
                }`}
                content={tooltipMessage}
                place="top"
                className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg !rounded-[12px] !bg-[#172554] !opacity-100"
              />
            </div>
          )}
        </div>
        <div className="w-full h-auto min-h-[300px] flex flex-col">
          {isLoading ? (
            <SkeletonCombinedChart />
          ) : isAdHoc ? (
            <AdHocTasksCombinedChart
              quantityData={processedChartData.quantityData}
              timeSpentData={processedChartData.timeSpentData}
            />
          ) : (
            <PreDefinedTasksCombinedChart
              quantityData={processedChartData.quantityData}
              timeSpentData={processedChartData.timeSpentData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
