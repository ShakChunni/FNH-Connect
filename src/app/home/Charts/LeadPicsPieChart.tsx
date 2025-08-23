import React, { useState, useMemo, useCallback } from "react";
import { ResponsivePie } from "@nivo/pie";
import { useMediaQuery } from "react-responsive";
import LeadPicsPieChartSkeleton from "./Skeletons/LeadPicsPieChartSkeleton";

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
  isLoading?: boolean;
}

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

const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
};

const LeadPicsPieChart: React.FC<LeadPicsPieChartProps> = ({
  data,
  isLoading = false,
}) => {
  const isExtraSmallScreen = useMediaQuery({ query: "(max-width: 405px)" });
  const isSmallScreen = useMediaQuery({ query: "(max-width: 767px)" });
  const isMediumScreen = useMediaQuery({
    query: "(min-width: 768px) and (max-width: 1279px)",
  });
  const isLargeScreen = useMediaQuery({
    query: "(min-width: 1280px) and (max-width: 1449px)",
  });
  const isExtraLargeScreen = useMediaQuery({
    query: "(min-width: 1450px) and (max-width: 1689px)",
  });

  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const { nivoData, picsForDisplay, total } = useMemo(() => {
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

    const picDataArray = data.labels
      .map((label, index) => ({
        id: label,
        label: label,
        value: data.datasets[0].data[index] || 0,
        color: colorPalette[index % colorPalette.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const total = picDataArray.reduce((sum, pic) => sum + pic.value, 0);

    const picsForDisplay = picDataArray.map((pic) => ({
      name: pic.label,
      value: pic.value,
      color: pic.color,
      id: pic.id,
    }));

    return { nivoData: picDataArray, picsForDisplay, total };
  }, [data]);

  // Chart height based on number of segments
  const chartHeight = useMemo(() => {
    const count = nivoData.length;
    if (isExtraSmallScreen) {
      if (count > 6) return 240;
      if (count > 4) return 250;
      return 300;
    }
    if (isSmallScreen) {
      if (count > 6) return 280;
      if (count > 4) return 300;
      return 320;
    }
    if (isMediumScreen) {
      if (count > 6) return 280;
      if (count > 4) return 280;
      return 300;
    }
    if (isLargeScreen) {
      if (count > 6) return 280;
      if (count > 4) return 320;
      return 340;
    }

    if (isExtraLargeScreen) {
      if (count > 6) return 280;
      if (count > 4) return 300;
      return 320;
    }
    // Default for larger screens
    if (count > 6) return 340;
    if (count > 4) return 320;
    return 400;
  }, [
    nivoData.length,
    isExtraSmallScreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
  ]);

  const chartMargin = useMemo(
    () => ({
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    }),
    []
  );

  const arcLinkLabelConfig = useMemo(() => {
    const count = nivoData.length;
    if (isSmallScreen) {
      if (count > 2)
        return { diagonal: 0, straight: 0, offset: 0, show: false };
      if (count > 1)
        return { diagonal: 10, straight: 16, offset: 3, show: true };
      return { diagonal: 16, straight: 24, offset: 6, show: true };
    }
    if (isMediumScreen) {
      if (count > 8) return { diagonal: 12, straight: 18, offset: 3 };
      if (count > 4) return { diagonal: 18, straight: 26, offset: 6 };
      return { diagonal: 24, straight: 36, offset: 10 };
    }
    // Large screens
    if (count > 8) return { diagonal: 10, straight: 10, offset: 3 };
    if (count > 4) return { diagonal: 24, straight: 32, offset: 10 };
    return { diagonal: 32, straight: 44, offset: 14 };
  }, [nivoData.length, isSmallScreen, isMediumScreen]);

  const chartTheme = useMemo(
    () => ({
      labels: {
        text: {
          fontSize: isLargeScreen
            ? nivoData.length > 6
              ? 8
              : nivoData.length > 4
              ? 10
              : 14
            : isSmallScreen
            ? 10
            : 11,
          fontWeight: 700,
        },
      },
      tooltip: {
        container: {
          background: "#ffffff",
          fontSize: isLargeScreen
            ? nivoData.length > 6
              ? 10
              : nivoData.length > 4
              ? 12
              : 14
            : isSmallScreen
            ? 10
            : 12,
        },
      },
      arcLinkLabels: {
        text: {
          fontSize: isLargeScreen
            ? nivoData.length > 6
              ? 8
              : nivoData.length > 4
              ? 10
              : 12
            : isSmallScreen
            ? 7
            : 12,
          fontWeight: 600,
        },
      },
    }),
    [isSmallScreen, isLargeScreen, nivoData.length]
  );

  const handleSegmentHover = useCallback((id: string | null) => {
    setHoveredSegment(id);
  }, []);

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
    return Math.round(360 * 0.05);
  }, []);

  const arcLabelCallback = useCallback(
    (d: any) => {
      if (!d || typeof d.value !== "number") return "";
      const percentage = Math.round((d.value / total) * 100);
      return percentage >= 5 ? `${d.value}` : "";
    },
    [total]
  );

  const arcLinkLabelCallback = useCallback(
    (d: any) => {
      if (!d || typeof d.value !== "number") return "";
      const percentage = Math.round((d.value / total) * 100);
      if (percentage < 5) return "";
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

  if (isLoading) {
    return <LeadPicsPieChartSkeleton />;
  }
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
          marginBottom: "0.5rem",
          marginTop: "1rem",
          fontWeight: "bold",
          fontSize: isSmallScreen ? "12px" : "14px",
          color: "#333",
        }}
      >
        Total: <b>{total}</b>
      </div>
      <div
        style={{
          height: chartHeight,
          background: "#fff",
          position: "relative",
        }}
      >
        <ResponsivePie
          data={nivoData}
          colors={{ datum: "data.color" }}
          margin={chartMargin}
          innerRadius={isSmallScreen || isMediumScreen ? 0.5 : 0.6}
          padAngle={1.2}
          cornerRadius={isSmallScreen ? 4 : 12}
          activeOuterRadiusOffset={10}
          borderWidth={1}
          borderColor="#FFFFFF"
          arcLabelsSkipAngle={angleThreshold}
          arcLabelsTextColor="#333333"
          arcLabelsRadiusOffset={0.5}
          arcLabel={isSmallScreen ? () => "" : arcLabelCallback}
          enableArcLinkLabels={isSmallScreen ? arcLinkLabelConfig.show : true}
          arcLinkLabelsSkipAngle={angleThreshold}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: "color" }}
          arcLinkLabel={arcLinkLabelCallback}
          arcLinkLabelsDiagonalLength={arcLinkLabelConfig.diagonal}
          arcLinkLabelsStraightLength={arcLinkLabelConfig.straight}
          arcLinkLabelsTextOffset={arcLinkLabelConfig.offset}
          tooltip={CustomTooltip}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          animate={true}
          motionConfig="gentle"
          transitionMode="innerRadius"
          theme={chartTheme}
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
              borderRadius: "16px",
              backgroundColor:
                hoveredSegment === pic.id ? `${pic.color}30` : `${pic.color}10`,
              fontSize:
                isSmallScreen || isExtraSmallScreen
                  ? "8px"
                  : isMediumScreen || isLargeScreen
                  ? "10px"
                  : "12px",
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
