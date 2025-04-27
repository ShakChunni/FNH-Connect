import React, { useState, useMemo, useCallback } from "react";
import { ResponsivePie } from "@nivo/pie";
import { useMediaQuery } from "react-responsive";

interface LeadPicsPieChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
      borderWidth?: number;
    }>;
  };
}

interface PicData {
  id: string;
  label: string;
  value: number;
  color: string;
}

// Color palette as specified
const colorPalette = [
  "#00876c",
  "#3d9a70",
  "#64ad73",
  "#89bf77",
  "#afd17c",
  "#d6e184",
  "#fdd576",
  "#fbb862",
  "#f59b56",
  "#ee7d4f",
  "#e35e4e",
  "#d43d51",
  "#c32b4d",
  "#b11f48",
];

// Helper function to truncate strings
const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
};

const LeadPicsPieChart: React.FC<LeadPicsPieChartProps> = ({ data }) => {
  const isExtraSmallScreen = useMediaQuery({ query: "(max-width: 405px)" });
  const isSmallScreen = useMediaQuery({ query: "(max-width: 767px)" });
  const isMediumScreen = useMediaQuery({
    query: "(min-width: 768px) and (max-width: 1279px)",
  });
  const isLargeScreen = useMediaQuery({
    query: "(min-width: 1280px) and (max-width: 1449px)",
  });

  // State to track which segment is being hovered
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Calculate chart height based on screen size - memoized
  const chartHeight = useMemo(() => {
    if (isExtraSmallScreen) return 200;
    if (isSmallScreen) return 280;
    if (isMediumScreen) return 250;
    if (isLargeScreen) return 300;
    return 340;
  }, [isExtraSmallScreen, isSmallScreen, isMediumScreen, isLargeScreen]);

  // Memoize chart margins
  const chartMargin = useMemo(
    () => ({
      top: isSmallScreen ? 30 : 40,
      right: isSmallScreen ? 80 : 120,
      bottom: isSmallScreen ? 30 : 40,
      left: isSmallScreen ? 80 : 120,
    }),
    [isSmallScreen]
  );

  // Memoize data processing to prevent unnecessary calculations
  const { nivoData, picsForDisplay, total } = useMemo(() => {
    // Check if data is valid and properly formatted
    if (
      !data?.labels ||
      !data?.datasets?.[0]?.data ||
      data.labels.length === 0
    ) {
      return {
        nivoData: [],
        picsForDisplay: [],
        total: 0,
      };
    }

    // Sort the data by value from largest to smallest for better visualization
    const picDataArray = data.labels
      .map((label, index) => ({
        id: label,
        label: label,
        value: data.datasets[0].data[index] || 0,
        color: colorPalette[index % colorPalette.length],
      }))
      .filter((item) => item.value > 0) // Remove items with zero value
      .sort((a, b) => b.value - a.value); // Sort by value in descending order

    const total = picDataArray.reduce((sum, pic) => sum + pic.value, 0);

    const picsForDisplay = picDataArray.map((pic) => ({
      name: pic.label,
      value: pic.value,
      color: pic.color,
      id: pic.id,
    }));

    return { nivoData: picDataArray, picsForDisplay, total };
  }, [data]);

  // Memoize theme configuration
  const chartTheme = useMemo(
    () => ({
      labels: {
        text: {
          fontSize: isSmallScreen ? 10 : 12,
          fontWeight: 700,
        },
      },
      tooltip: {
        container: {
          background: "#ffffff",
          fontSize: isSmallScreen ? 10 : 12,
        },
      },
    }),
    [isSmallScreen]
  );

  // Handle hover with useCallback
  const handleSegmentHover = useCallback((id: string | null) => {
    setHoveredSegment(id);
  }, []);

  // Memoized callbacks for pie interactions
  const handleMouseEnter = useCallback(
    (node: any) => {
      if (node && node.id) {
        handleSegmentHover(String(node.id));
      }
    },
    [handleSegmentHover]
  );

  const handleMouseLeave = useCallback(() => {
    handleSegmentHover(null);
  }, [handleSegmentHover]);

  const angleThreshold = useMemo(() => {
    return Math.round(360 * 0.05); // 2% of a full circle (360 degrees)
  }, []);

  // Memoize the arc label callback - showing VALUE inside the slices
  const arcLabelCallback = useCallback(
    (d: any) => {
      if (!d || typeof d.value !== "number") return "";

      const percentage = Math.round((d.value / total) * 100);
      // Show values for segments >= 2%
      return percentage >= 5 ? `${d.value}` : "";
    },
    [total]
  );

  // Memoize the arc link label callback - showing labels with percentages
  const arcLinkLabelCallback = useCallback(
    (d: any) => {
      if (!d || typeof d.value !== "number") return "";

      const percentage = Math.round((d.value / total) * 100);
      if (percentage < 5) return ""; // Don't show very small segments' labels

      const label =
        typeof d.label === "string" ? d.label : String(d.label || "");
      const trimmedLabel = isSmallScreen
        ? truncateString(label, 8)
        : truncateString(label, 16);

      return `${trimmedLabel} (${percentage}%)`;
    },
    [total, isSmallScreen]
  );

  const CustomTooltip = useMemo(() => {
    const TooltipComponent = ({ datum }: { datum: any }) => {
      if (!datum || typeof datum.value !== "number") return null;

      const percentage = Math.round((datum.value / total) * 100);
      return (
        <div
          style={{
            padding: "8px 12px",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            fontSize: isSmallScreen ? "10px" : "12px",
          }}
        >
          <strong>{datum.label}</strong>: {datum.value} ({percentage}%)
        </div>
      );
    };

    TooltipComponent.displayName = "LeadPicsTooltip";
    return TooltipComponent;
  }, [total, isSmallScreen]);

  // Early return for empty data
  if (!nivoData.length) {
    return (
      <div
        style={{
          height: chartHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F4F8FC",
          color: "#666",
          fontWeight: "bold",
        }}
      >
        No data available
      </div>
    );
  }

  return (
    <div className="pie-chart-container" style={{ position: "relative" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "1rem",
          fontWeight: "bold",
          fontSize: isSmallScreen ? "12px" : "14px",
          color: "#333",
        }}
      >
        Total Number of Leads: <b>{total}</b>
      </div>
      <div
        style={{
          height: chartHeight,
          background: "#F4F8FC",
          position: "relative",
        }}
      >
        <ResponsivePie
          data={nivoData}
          colors={{ datum: "data.color" }}
          margin={chartMargin}
          innerRadius={0.6}
          padAngle={1.2}
          cornerRadius={isSmallScreen ? 4 : 12}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          borderColor="#FFFFFF"
          // Inner labels (values)
          arcLabelsSkipAngle={angleThreshold}
          arcLabelsTextColor="#333333"
          arcLabelsRadiusOffset={0.5}
          arcLabel={isSmallScreen ? () => "" : arcLabelCallback}
          // External labels with lines
          enableArcLinkLabels={!isSmallScreen}
          arcLinkLabelsSkipAngle={angleThreshold}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={3}
          arcLinkLabelsColor={{ from: "color" }}
          arcLinkLabel={arcLinkLabelCallback}
          arcLinkLabelsDiagonalLength={isSmallScreen ? 6 : 16}
          arcLinkLabelsStraightLength={isSmallScreen ? 12 : 24}
          arcLinkLabelsTextOffset={isSmallScreen ? 2 : 6}
          tooltip={CustomTooltip}
          // Interactions
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          // Animations
          animate={true}
          motionConfig="gentle"
          transitionMode="innerRadius"
          // Custom colors to match
          theme={chartTheme}
          // Handle active elements highlight
          activeId={hoveredSegment}
        />
      </div>
      <div className="flex flex-wrap justify-center mt-2 gap-1">
        {picsForDisplay.map((pic) => (
          <div
            key={pic.id}
            style={{
              padding: isSmallScreen ? "2px 4px" : "3px 6px",
              border: `1px solid ${pic.color}`,
              borderLeft: `3px solid ${pic.color}`,
              borderRadius: "4px",
              backgroundColor:
                hoveredSegment === pic.id ? `${pic.color}30` : `${pic.color}10`,
              fontSize: isSmallScreen ? "8px" : "12px",
              boxShadow:
                hoveredSegment === pic.id
                  ? "0 2px 4px rgba(0,0,0,0.15)"
                  : "0 1px 1px rgba(0,0,0,0.05)",
              margin: "2px",
              transition: "all 0.2s ease",
              cursor: "pointer",
              transform:
                hoveredSegment === pic.id ? "translateY(-1px)" : "none",
              opacity:
                hoveredSegment !== null && hoveredSegment !== pic.id ? 0.6 : 1,
            }}
            onMouseEnter={() => handleSegmentHover(pic.id)}
            onMouseLeave={() => handleSegmentHover(null)}
          >
            <strong>{pic.name}</strong>: {pic.value} (
            {Math.round((pic.value / total) * 100)}%)
          </div>
        ))}
      </div>
    </div>
  );
};

LeadPicsPieChart.displayName = "LeadPicsPieChart";

export default React.memo(LeadPicsPieChart);
