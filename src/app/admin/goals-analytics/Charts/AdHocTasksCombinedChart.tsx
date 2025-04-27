import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useMediaQuery } from "react-responsive";

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    targetQuantity?: number[]; // Added for consistency, but won't display
  }[];
}

interface ProcessedChartItem {
  label: string;
  value: number;
  timeSpent: number;
  color: string;
  targetQuantity: number; // Added for consistency, but won't display
}

interface AdHocTasksCombinedChartProps {
  quantityData: ChartData;
  timeSpentData: ChartData;
}

// Helper function to format time display
const formatTimeSpent = (minutes: number): string => {
  if (minutes === 0) return "0 min";

  // For minutes less than 10, pad with a leading zero
  if (minutes < 10) return `0${minutes} min`;

  // For minutes between 10 and 59, show regular format
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  // If no remaining minutes
  if (remainingMinutes === 0) return `${hours} hr`;

  // For remaining minutes less than 10, pad with a zero
  if (remainingMinutes < 10) return `${hours} hr 0${remainingMinutes} min`;

  // Regular format for hours and minutes
  return `${hours} hr ${remainingMinutes} min`;
};

const truncateLabel = (label: string, maxLength: number): string => {
  return label.length > maxLength ? `${label.slice(0, maxLength)}..` : label;
};

const AdHocTasksCombinedChart: React.FC<AdHocTasksCombinedChartProps> = ({
  quantityData,
  timeSpentData,
}) => {
  const isSmallScreen = useMediaQuery({ query: "(max-width: 600px)" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const lightColors = [
    "#FF9ED8",
    "#59C1FF",
    "#8654E3",
    "#4EDECD",
    "#B388FF",
    "#FF9F7C",
    "#66FF8F",
    "#FF77BC",
    "#82B1FF",
    "#40C4FF",
  ];

  const { processedPieData, hasSomeQuantity } = useMemo(() => {
    if (
      !quantityData ||
      (!quantityData?.labels?.length && !Array.isArray(quantityData))
    ) {
      return {
        processedPieData: [] as ProcessedChartItem[],
        hasSomeQuantity: false,
      };
    }

    let processed: ProcessedChartItem[] = [];
    let hasQuantity = false;

    if (quantityData.labels && quantityData.datasets) {
      // Process structured chart data
      processed = quantityData.labels
        .map((label, index) => {
          const quantity = quantityData.datasets[0].data[index] || 0;
          const timeSpent = timeSpentData?.datasets?.[0]?.data?.[index] || 0;
          const targetQuantity =
            quantityData.datasets[0].targetQuantity?.[index] || 0; // Store but don't display

          if (quantity > 0) hasQuantity = true;

          return {
            label: label.charAt(0).toUpperCase() + label.slice(1),
            value: quantity,
            timeSpent: timeSpent,
            targetQuantity: targetQuantity, // Store but don't display
            color: lightColors[index % lightColors.length],
          };
        })
        .filter((item) => item.timeSpent > 0) // Include items with time spent even if quantity is 0
        .sort((a, b) => {
          // First sort by quantity, then by time spent if quantities are equal
          if (b.value !== a.value) return b.value - a.value;
          return b.timeSpent - a.timeSpent;
        });
    } else if (Array.isArray(quantityData)) {
      // Process array-style data
      type GroupedData = Record<
        string,
        {
          type: string;
          quantity: number;
          timeSpent: number;
          targetQuantity: number;
        }
      >;

      const groupedData = quantityData.reduce((acc, item) => {
        if (typeof item !== "object" || !item) return acc;

        const type = typeof item.type === "string" ? item.type : "";
        if (!type) return acc;

        if (!acc[type]) {
          acc[type] = {
            type,
            quantity: 0,
            timeSpent: 0,
            targetQuantity: 0, // Initialize but don't display
          };
        }

        acc[type].quantity +=
          typeof item.quantity === "number" ? item.quantity : 0;
        acc[type].timeSpent +=
          typeof item.timeSpent === "number" ? item.timeSpent : 0;
        acc[type].targetQuantity +=
          typeof item.targetQuantity === "number" ? item.targetQuantity : 0; // Store but don't display
        return acc;
      }, {} as GroupedData);

      processed = Object.values(groupedData)
        .map((item, index) => {
          // Cast the item to the correct type since Object.values returns unknown[]
          const typedItem = item as {
            type: string;
            quantity: number;
            timeSpent: number;
            targetQuantity: number;
          };

          if (typedItem.quantity > 0) hasQuantity = true;

          return {
            label:
              typedItem.type.charAt(0).toUpperCase() + typedItem.type.slice(1),
            value: typedItem.quantity,
            timeSpent: typedItem.timeSpent,
            targetQuantity: typedItem.targetQuantity, // Store but don't display
            color: lightColors[index % lightColors.length],
          };
        })
        .filter((item) => item.timeSpent > 0) // Include items with time spent even if quantity is 0
        .sort((a, b) => {
          // First sort by quantity, then by time spent if quantities are equal
          if (b.value !== a.value) return b.value - a.value;
          return b.timeSpent - a.timeSpent;
        });
    }

    return {
      processedPieData: processed,
      hasSomeQuantity: hasQuantity,
    };
  }, [quantityData, timeSpentData, lightColors]);

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        background: "transparent",
        events: {
          dataPointMouseEnter: function (_event, _chartContext, config) {
            if (config.dataPointIndex !== undefined) {
              setHoveredIndex(config.dataPointIndex);
            }
          },
          dataPointMouseLeave: function () {
            setHoveredIndex(null);
          },
        },
      },
      states: {
        hover: { filter: { type: "none" } },
        active: { filter: { type: "none" } },
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: "65%",
            labels: {
              show: true,
              name: {
                show: false,
              },
              value: {
                show: false,
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                fontSize: isSmallScreen ? "10px" : "12px",
                fontWeight: 600,
                color: "#5C7CFA",
                formatter: function () {
                  // Show only the total, not the target
                  return processedPieData
                    .reduce((sum, item) => sum + item.value, 0)
                    .toString();
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        enabled: true,
        fillSeriesColor: false,
        y: {
          formatter: function (value, { dataPointIndex }) {
            // Calculate percentage of total
            const total = pieChartSeries.reduce((sum, val) => sum + val, 0);
            const percentage =
              total > 0 ? Math.round((value / total) * 100) : 0;

            // Get target quantity for this item
            const targetQuantity =
              pieChartItems[dataPointIndex]?.targetQuantity || 0;

            // Return formatted string with value/target and percentage
            return `${value}/${targetQuantity} (${percentage}%)`;
          },
        },
      },
      legend: {
        show: false,
      },
      stroke: {
        width: 0,
      },
      responsive: [
        {
          breakpoint: 600,
          options: {
            chart: {
              height: "200px",
            },
          },
        },
      ],
    }),
    [processedPieData, isSmallScreen]
  );

  // Only include items with non-zero quantity for the pie chart
  const pieChartItems = useMemo(
    () => processedPieData.filter((item) => item.value > 0),
    [processedPieData]
  );

  const pieChartSeries = useMemo(
    () => pieChartItems.map((item) => item.value),
    [pieChartItems]
  );

  const pieChartLabels = useMemo(
    () => pieChartItems.map((item) => item.label),
    [pieChartItems]
  );

  // Calculate total quantity and time spent
  const totalQuantity = useMemo(
    () => processedPieData.reduce((sum, item) => sum + item.value, 0),
    [processedPieData]
  );

  const totalTimeSpent = useMemo(
    () => processedPieData.reduce((sum, item) => sum + item.timeSpent, 0),
    [processedPieData]
  );

  // Show empty state if there's no data at all
  if (!processedPieData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">No Ad Hoc tasks data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row">
      <div className="w-full md:w-2/5 mb-3 md:mb-0 flex items-center justify-center">
        {hasSomeQuantity && pieChartItems.length > 0 ? (
          <Chart
            options={{
              ...chartOptions,
              labels: pieChartLabels,
              colors: pieChartItems.map((item, index) =>
                hoveredIndex === null || hoveredIndex === index
                  ? item.color
                  : `${item.color}40`
              ),
            }}
            series={pieChartSeries}
            type="donut"
            height={isSmallScreen ? 160 : 300}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-2xs sm:text-xs xl:text-sm">
              No quantity data for pie chart
            </p>
          </div>
        )}
      </div>

      <div className="hidden md:block w-px bg-gray-200 mx-2 xl:mx-4"></div>

      <div className="w-full md:w-3/5 px-1 sm:px-2 md:px-3 xl:px-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left md:w-[45%] 2xl:w-[48%] pb-1.5 font-semibold text-2xs sm:text-xs xl:text-sm text-blue-900">
                Task Type
              </th>
              <th
                className="text-center pb-1.5 font-semibold text-2xs sm:text-xs xl:text-sm text-blue-900"
                colSpan={2}
              >
                Quantity
              </th>
              <th
                className="text-center pb-1.5 font-semibold text-2xs sm:text-xs xl:text-sm text-blue-900"
                colSpan={2}
              >
                Time Spent
              </th>
            </tr>
          </thead>
          <tbody>
            {processedPieData.map((item, index) => {
              const pieIndex = pieChartItems.findIndex(
                (pi) => pi.label === item.label
              );

              return (
                <tr
                  key={index}
                  className={`hover:bg-gray-200 hover:cursor-pointer rounded ${
                    hoveredIndex === pieIndex && pieIndex !== -1
                      ? "bg-gray-200"
                      : ""
                  }`}
                  onMouseEnter={() => {
                    if (pieIndex !== -1) setHoveredIndex(pieIndex);
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Task type */}
                  <td className="py-1 sm:py-1.5">
                    <div className="flex items-start">
                      <div
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 xl:w-3 xl:h-3 rounded-lg mr-1 sm:mr-1.5 xl:mr-2 flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-2xs sm:text-xs xl:text-xs text-gray-700 break-words line-clamp-2">
                        {isSmallScreen
                          ? truncateLabel(item.label, 15)
                          : item.label}
                      </span>
                    </div>
                  </td>

                  {/* Quantity column that contains both actual and target quantities */}
                  <td className="py-1 sm:py-1.5" colSpan={2}>
                    <div className="flex w-full">
                      {/* Actual quantity - 65% width */}
                      <div className="w-[65%] text-right">
                        <span className="text-2xs sm:text-xs xl:text-xs text-gray-600 font-medium">
                          {item.value}
                        </span>
                      </div>

                      {/* Target quantity space - 35% width (empty for ad hoc tasks) */}
                      <div className="w-[35%] pl-1">
                        {/* Intentionally left empty to match structure */}
                      </div>
                    </div>
                  </td>

                  {/* Time spent column that contains both actual and target times */}
                  <td className="py-1 sm:py-1.5" colSpan={2}>
                    <div className="flex w-full">
                      {/* Actual time spent - 65% width */}
                      <div className="w-[65%] text-right">
                        <span className="text-2xs sm:text-xs xl:text-xs text-gray-600 font-medium">
                          {formatTimeSpent(item.timeSpent)}
                        </span>
                      </div>

                      {/* Target time spent space - 35% width (empty for ad hoc tasks) */}
                      <div className="w-[35%] pl-1.5">
                        {/* Intentionally left empty to match structure */}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Total row */}
            <tr className="border-t border-gray-300 mt-1 sm:mt-2">
              <td className="py-1 sm:py-1.5">
                <span className="text-2xs sm:text-xs xl:text-sm font-semibold text-blue-900">
                  In Total
                </span>
              </td>

              {/* Quantity totals column */}
              <td className="py-1 sm:py-1.5" colSpan={2}>
                <div className="flex w-full">
                  {/* Total actual quantity - 65% width */}
                  <div className="w-[65%] text-right">
                    <span className="text-2xs sm:text-xs xl:text-xs text-gray-600 font-medium">
                      {totalQuantity}
                    </span>
                  </div>

                  {/* Total target quantity space - 35% width (empty for ad hoc tasks) */}
                  <div className="w-[35%] pl-1">
                    {/* Intentionally left empty to match structure */}
                  </div>
                </div>
              </td>

              {/* Time spent total column */}
              <td className="py-1 sm:py-1.5" colSpan={2}>
                <div className="flex w-full">
                  {/* Total actual time spent - 65% width */}
                  <div className="w-[65%] text-right">
                    <span className="text-2xs sm:text-xs xl:text-xs text-gray-600 font-medium">
                      {formatTimeSpent(totalTimeSpent)}
                    </span>
                  </div>

                  {/* Total target time spent space - 35% width (empty for ad hoc tasks) */}
                  <div className="w-[35%] pl-1.5">
                    {/* Intentionally left empty to match structure */}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdHocTasksCombinedChart;
