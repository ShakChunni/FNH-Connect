import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useMediaQuery } from "react-responsive";
import { time } from "console";

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    targetQuantity?: number[];
    targetTime?: number[];
    targetType?: (string | null)[];
    measurementType?: string[];
  }[];
}

interface ProcessedChartItem {
  label: string;
  value: number;
  timeSpent: number;
  color: string;
  targetQuantity?: number;
  targetTime?: number;
  targetType?: string | null;
  measurementType?: string;
}

interface PreDefinedTasksCombinedChartProps {
  quantityData: ChartData;
  timeSpentData: ChartData;
}

const formatTimeSpent = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === 0) return "0 min";

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  // If we have exact hours (no remaining minutes)
  if (remainingMinutes === 0) return `${hours} hr`;

  // If we have both hours and minutes
  return `${hours} hr ${remainingMinutes} min`;
};

const truncateLabel = (label: string, maxLength: number): string => {
  return label.length > maxLength ? `${label.slice(0, maxLength)}..` : label;
};

const PreDefinedTasksCombinedChart: React.FC<
  PreDefinedTasksCombinedChartProps
> = ({ quantityData, timeSpentData }) => {
  const isSmallScreen = useMediaQuery({ query: "(max-width: 600px)" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const lightColors = [
    "#00876c",
    "#3d9a70",
    "#64ad73",
    "#89bf77",
    "#afd17c",
    "#d6e184",
    "#fff18f",
    "#fdd576",
    "#fbb862",
    "#f59b56",
    "#ee7d4f",
    "#e35e4e",
    "#d43d51",
    "#c32b4d",
    "#b11f48",
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
      processed = quantityData.labels
        .map((label, index) => {
          const quantity = quantityData.datasets[0].data[index] || 0;
          const timeSpent = timeSpentData?.datasets?.[0]?.data?.[index] || 0;
          const targetQuantity =
            quantityData.datasets[0].targetQuantity?.[index] || 0;
          const targetTime = quantityData.datasets[0].targetTime?.[index] || 0;
          const targetType =
            quantityData.datasets[0].targetType?.[index] || null;
          const measurementType =
            quantityData.datasets[0].measurementType?.[index] || "BOTH";

          if (quantity > 0) hasQuantity = true;

          return {
            label: label.charAt(0).toUpperCase() + label.slice(1),
            value: quantity,
            timeSpent: timeSpent,
            targetQuantity,
            targetTime,
            targetType,
            measurementType,
            color: "",
          };
        })
        .filter((item) => item.timeSpent > 0 || item.value > 0)
        .sort((a, b) => {
          if (b.value !== a.value) return b.value - a.value;
          return b.timeSpent - a.timeSpent;
        });

      // Assign colors after sorting
      processed = processed.map((item, index) => ({
        ...item,
        color: lightColors[index % lightColors.length],
      }));
    } else if (Array.isArray(quantityData)) {
      type GroupedData = Record<
        string,
        {
          name: string;
          quantity: number;
          timeSpent: number;
          targetQuantity: number;
          targetTime: number;
          targetType: string | null;
          measurementType: string;
        }
      >;

      const groupedData = quantityData.reduce((acc, item) => {
        if (typeof item !== "object" || !item) return acc;

        const name = typeof item.type === "string" ? item.type : "";
        if (!name) return acc;

        if (!acc[name]) {
          acc[name] = {
            name,
            quantity: 0,
            timeSpent: 0,
            targetQuantity: 0,
            targetTime: 0,
            targetType: null,
            measurementType: "BOTH",
          };
        }

        acc[name].quantity +=
          typeof item.quantity === "number" ? item.quantity : 0;
        acc[name].timeSpent +=
          typeof item.timeSpent === "number" ? item.timeSpent : 0;
        acc[name].targetQuantity +=
          typeof item.targetQuantity === "number" ? item.targetQuantity : 0;
        acc[name].targetTime +=
          typeof item.targetTime === "number" ? item.targetTime : 0;

        // Only update targetType if it's not null
        if (item.targetType) {
          acc[name].targetType = item.targetType;
        }

        // Update measurement type if available
        if (item.measurementType) {
          acc[name].measurementType = item.measurementType;
        }

        return acc;
      }, {} as GroupedData);

      processed = Object.values(groupedData)
        .map((item) => {
          if ((item as any).quantity > 0) hasQuantity = true;

          return {
            label:
              (item as GroupedData[string]).name.charAt(0).toUpperCase() +
              (item as GroupedData[string]).name.slice(1),
            value: (item as GroupedData[number]).quantity,
            timeSpent: (item as GroupedData[number]).timeSpent,
            targetQuantity: (item as GroupedData[number]).targetQuantity,
            targetTime: (item as GroupedData[number]).targetTime,
            targetType: (item as GroupedData[string]).targetType,
            measurementType: (item as GroupedData[string]).measurementType,
            color: "",
          };
        })
        .filter((item) => item.timeSpent > 0 || item.value > 0)
        .sort((a, b) => {
          if (b.value !== a.value) return b.value - a.value;
          return b.timeSpent - a.timeSpent;
        });

      // Assign colors after sorting
      processed = processed.map((item, index) => ({
        ...item,
        color: lightColors[index % lightColors.length],
      }));
    }

    return {
      processedPieData: processed,
      hasSomeQuantity: hasQuantity,
    };
  }, [quantityData, timeSpentData, lightColors]);

  // Calculate total quantities
  // For pie chart, we only care about task quantity values
  const totalQuantity = useMemo(
    () => processedPieData.reduce((sum, item) => sum + item.value, 0),
    [processedPieData]
  );

  const totalTargetQuantity = useMemo(() => {
    let total = 0;
    for (const item of processedPieData) {
      // Only include targetQuantity in total if the target type is QUANTITY or null
      if (item.targetType === "QUANTITY" || !item.targetType) {
        total += item.targetQuantity || 0;
      }
    }
    return total;
  }, [processedPieData]);

  const totalTimeSpent = useMemo(
    () => processedPieData.reduce((sum, item) => sum + item.timeSpent, 0),
    [processedPieData]
  );

  const totalTargetTime = useMemo(() => {
    let total = 0;
    for (const item of processedPieData) {
      // Only include targetTime in total if the target type is TIME or null
      if (item.targetType === "TIME" || !item.targetType) {
        total += item.targetTime || 0;
      }
    }
    return total;
  }, [processedPieData]);

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
                  // Only show total quantity for the pie chart
                  return `${totalQuantity}`;
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

            // Return formatted string with value and percentage
            return `${value} (${percentage}%)`;
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
    [processedPieData, isSmallScreen, totalQuantity]
  );

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

  if (!processedPieData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">
          No Predefined tasks data available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row">
      {/* Pie chart section - keep as is */}
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

      {/* Table-based layout for data */}
      <div className="w-full md:w-3/5 px-1 sm:px-2 md:px-3 xl:px-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left pb-1.5 font-semibold text-2xs sm:text-xs xl:text-sm text-blue-900">
                Task Name
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
                  {/* Task name */}
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

                      {/* Target quantity - 35% width */}
                      <div className="w-[35%] pl-1">
                        {(item.targetType === "QUANTITY" || !item.targetType) &&
                        item.targetQuantity ? (
                          <span className="px-1 py-0.5 rounded-md bg-amber-200 text-blue-950 text-2xs sm:text-xs xl:text-xs whitespace-nowrap">
                            {item.targetQuantity}
                          </span>
                        ) : null}
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

                      {/* Target time spent - 35% width */}
                      <div className="w-[35%] pl-1.5">
                        {(item.targetType === "TIME" || !item.targetType) &&
                        item.targetTime ? (
                          <span className="px-1 py-0.5 rounded-md bg-amber-200 text-blue-950 text-2xs sm:text-xs xl:text-xs whitespace-nowrap">
                            {formatTimeSpent(item.targetTime)}
                          </span>
                        ) : null}
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

                  {/* Total target quantity - 35% width */}
                  <div className="w-[35%] pl-1">
                    {totalTargetQuantity > 0 && (
                      <span className="px-1 py-0.5 rounded-md bg-amber-200 text-blue-950 text-2xs sm:text-xs xl:text-xs whitespace-nowrap">
                        {totalTargetQuantity}
                      </span>
                    )}
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

                  {/* Total target time spent - 35% width */}
                  <div className="w-[35%] pl-1.5">
                    {totalTargetTime > 0 && (
                      <span className="px-1 py-0.5 rounded-md bg-amber-200 text-blue-950 text-2xs sm:text-xs xl:text-xs whitespace-nowrap">
                        {formatTimeSpent(totalTargetTime)}
                      </span>
                    )}
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

export default PreDefinedTasksCombinedChart;
