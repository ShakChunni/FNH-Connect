import React, { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import LeadSourcePieChart from "./LeadSourcePieChart";
import LeadPicsPieChart from "./LeadPicsPieChart";
import IndustryBarChart from "./IndustryBarChart";
import StagesBarChart from "./StagesBarChart";
import { List, Building } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { Tooltip as ReactTooltip } from "react-tooltip";

interface ChartCardProps {
  title: string;
  data: any;
  options?: any;
  type:
    | "bar"
    | "doughnut"
    | "leadsourcePie"
    | "picPie"
    | "totalMetrics"
    | "industryBar"
    | "stagesBar";
  isLoading?: boolean;
  chartViewMode?: "leads" | "organizations";
  toggleChartViewMode?: () => void;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  options,
  type,
  isLoading = false,
  chartViewMode = "leads",
  toggleChartViewMode,
}) => {
  // Responsive sizes
  const isSm = useMediaQuery({ maxWidth: 639 });
  const isMd = useMediaQuery({ minWidth: 640, maxWidth: 1023 });
  const isLg = useMediaQuery({ minWidth: 1024, maxWidth: 1279 });
  const isXl = useMediaQuery({ minWidth: 1280, maxWidth: 1535 });
  const is2xl = useMediaQuery({ minWidth: 1536 });

  // Sizing logic
  const switchHeight = isSm
    ? 28
    : isMd
    ? 30
    : isLg
    ? 32
    : isXl
    ? 34
    : is2xl
    ? 38
    : 32;
  const switchWidth = isSm
    ? 80
    : isMd
    ? 80
    : isLg
    ? 90
    : isXl
    ? 100
    : is2xl
    ? 100
    : 150;
  const iconSize = isSm
    ? 16
    : isMd
    ? 16
    : isLg
    ? 16
    : isXl
    ? 18
    : is2xl
    ? 18
    : 30;

  // Color codes for modes
  const leadsColor = "#2563eb"; // blue-600
  const leadsBg = "#e0e7ff"; // blue-100
  const orgsColor = "#059669"; // emerald-600
  const orgsBg = "#d1fae5"; // emerald-100

  // Dynamic color
  const activeBgColor = chartViewMode === "leads" ? leadsBg : orgsBg;

  // Tooltip IDs
  const leadsTooltipId = "chartcard-leads-tooltip";
  const orgsTooltipId = "chartcard-orgs-tooltip";

  // Hover state for accessibility (optional, but ReactTooltip supports data-tooltip-id)
  const [hovered, setHovered] = useState<"leads" | "orgs" | null>(null);

  return (
    <div className="bg-white p-4 rounded-3xl shadow-md h-full flex flex-col border border-slate-200">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm sm:text-base xl:text-lg font-bold text-blue-950">
          {title}
        </h3>
        {toggleChartViewMode && (
          <div className="flex items-center gap-2">
            {/* Switcher pill with icons only */}
            <div className="relative ">
              <div
                className="relative flex bg-slate-50 rounded-full p-1 border border-slate-200 shadow-sm"
                style={{
                  height: switchHeight,
                  width: switchWidth,
                  minWidth: switchWidth,
                  transition: "width 0.2s, height 0.2s",
                }}
              >
                {/* Active side background */}
                <div
                  className="absolute rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    height: switchHeight - 8,
                    width: (switchWidth - 12) / 2,
                    top: 4,
                    left: chartViewMode === "leads" ? 4 : switchWidth / 2,
                    background: activeBgColor,
                    zIndex: 1,
                  }}
                />
                {/* Leads icon button */}
                <button
                  onClick={() =>
                    chartViewMode !== "leads" && toggleChartViewMode()
                  }
                  className="relative flex-1 flex items-center justify-center transition-all duration-200 rounded-full"
                  style={{
                    color:
                      hovered === "leads"
                        ? leadsColor
                        : chartViewMode === "leads"
                        ? leadsColor
                        : "#64748b",
                    background:
                      chartViewMode === "leads" ? leadsBg : "transparent",
                    zIndex: 2,
                  }}
                  aria-label="Leads"
                  data-tooltip-id={leadsTooltipId}
                  onMouseEnter={() => setHovered("leads")}
                  onMouseLeave={() => setHovered(null)}
                >
                  <List size={iconSize} />
                </button>

                {/* Organizations icon button */}
                <button
                  onClick={() =>
                    chartViewMode !== "organizations" && toggleChartViewMode()
                  }
                  className="relative flex-1 flex items-center justify-center transition-all duration-200 rounded-full"
                  style={{
                    color:
                      hovered === "orgs"
                        ? orgsColor
                        : chartViewMode === "organizations"
                        ? orgsColor
                        : "#64748b",
                    background:
                      chartViewMode === "organizations"
                        ? orgsBg
                        : "transparent",
                    zIndex: 2,
                  }}
                  aria-label="Organizations"
                  data-tooltip-id={orgsTooltipId}
                  onMouseEnter={() => setHovered("orgs")}
                  onMouseLeave={() => setHovered(null)}
                >
                  <Building size={iconSize} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className={`w-full flex-grow ${
          type === "stagesBar"
            ? "h-[300px]"
            : type === "industryBar"
            ? "h-[400px]"
            : type === "picPie"
            ? "h-[660px] md:min-h-[20rem]"
            : "h-full md:min-h-[20rem]"
        }`}
      >
        {type === "doughnut" ? (
          <Doughnut data={data} options={options} />
        ) : type === "leadsourcePie" ? (
          <LeadSourcePieChart data={data} isLoading={isLoading} />
        ) : type === "picPie" ? (
          <LeadPicsPieChart data={data} isLoading={isLoading} />
        ) : type === "industryBar" ? (
          <IndustryBarChart data={data} isLoading={isLoading} />
        ) : type === "stagesBar" ? (
          <StagesBarChart data={data} isLoading={isLoading} />
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>
    </div>
  );
};

export default ChartCard;
