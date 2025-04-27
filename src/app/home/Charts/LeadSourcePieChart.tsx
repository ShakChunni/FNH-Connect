import React, { useState, useMemo, useCallback } from "react";
import { ResponsivePie } from "@nivo/pie";
import { useMediaQuery } from "react-responsive";
import { displayName } from "react-world-flags";

interface LeadSourcePieChartProps {
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

interface LeadSource {
  id: string;
  label: string;
  value: number;
  color: string;
}

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const generateColorPalette = (count: number): string[] => {
  const baseColors = [
    "#00876c",
    "#3d9a70",
    "#64ad73",
    "#89bf77",
    "#afd17c",
    "#fbb862",
    "#f59b56",
    "#ee7d4f",
    "#e35e4e",
    "#d43d51",
    "#c32b4d",
    "#b11f48",
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(baseColors[i % baseColors.length]);
  }
  return result;
};

// Fix for truncating strings in labels
const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
};

const LeadSourcePieChart: React.FC<LeadSourcePieChartProps> = ({ data }) => {
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

  // Calculate chart height only when screen size changes
  const chartHeight = useMemo(() => {
    if (isExtraSmallScreen) return 200;
    if (isSmallScreen) return 280;
    if (isMediumScreen) return 250;
    if (isLargeScreen) return 380;
    return 440;
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

  // Convert data to Nivo format - memoize to prevent recalculations
  const { nivoData, leadSourcesForDisplay, total } = useMemo(() => {
    // Add null checks for data
    if (
      !data ||
      !data.labels ||
      !data.datasets ||
      !data.datasets[0] ||
      !data.datasets[0].data
    ) {
      return {
        nivoData: [],
        leadSourcesForDisplay: [],
        total: 0,
      };
    }

    const labels = data.labels || [];
    const customColors = generateColorPalette(labels.length);

    const nivoData: LeadSource[] = labels
      .map((label, index) => ({
        id: label,
        label: capitalizeFirstLetter(label),
        value: data.datasets[0].data[index] || 0,
        color: customColors[index],
      }))
      .sort((a, b) => b.value - a.value);

    const total = nivoData.reduce((sum, source) => sum + source.value, 0);

    const leadSourcesForDisplay = nivoData.map((source) => ({
      name: source.label,
      points: source.value,
      color: source.color,
      id: source.id,
    }));

    return { nivoData, leadSourcesForDisplay, total };
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

  // Handle hovering on arc or legend item with useCallback
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

  // Memoize the arc label callback - showing VALUE inside the slices
  const arcLabelCallback = useCallback(
    (d: any) => {
      if (!d || typeof d.value !== "number") return "";

      const percentage = Math.round((d.value / total) * 100);
      // Only show values for larger segments (>= 5%)
      return percentage >= 5 ? `${d.value}` : "";
    },
    [total]
  );

  // Calculate the angle threshold equivalent to 5% for arcLinkLabelsSkipAngle
  const angleThreshold = useMemo(() => {
    return Math.max(10, Math.round(360 * 0.05));
  }, []);

  // Memoize the arc link label callback - showing labels with percentages
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

    TooltipComponent.displayName = "LeadSourceTooltip";
    return TooltipComponent;
  }, [total, isSmallScreen]);

  // Fixed enhancedArcLayer with proper null/undefined checks
  const enhancedArcLayer = useCallback(
    (props: any) => {
      // Safety check if arcs or arcGenerator are missing
      if (!props || !props.arcs || !props.arcGenerator) {
        return <g></g>;
      }

      const { arcs, arcGenerator } = props;

      return (
        <g>
          {arcs.map((arc: any) => {
            // Safety check for arc data
            if (!arc || !arc.data) {
              return null;
            }

            // Safe access to id with fallback
            const arcId = arc.data.id ? String(arc.data.id) : "";
            const isActive = hoveredSegment === arcId;
            const opacity = hoveredSegment !== null && !isActive ? 0.3 : 1;

            return (
              <path
                key={arc.id || Math.random().toString()}
                d={arcGenerator(arc)}
                fill={arc.color}
                fillOpacity={opacity}
                stroke={arc.borderColor}
                strokeWidth={arc.borderWidth}
                onClick={(e) => {
                  if (props.onClick) props.onClick(arc, e);
                }}
                onMouseEnter={(e) => {
                  if (props.onMouseEnter) props.onMouseEnter(arc, e);
                }}
                onMouseLeave={(e) => {
                  if (props.onMouseLeave) props.onMouseLeave(e);
                }}
                style={{
                  transition: "fill-opacity 250ms",
                }}
              />
            );
          })}
        </g>
      );
    },
    [hoveredSegment]
  );

  // Early return if no valid data
  if (!nivoData.length) {
    return (
      <div
        style={{
          height: chartHeight,
          background: "#F4F8FC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontStyle: "italic",
        }}
      >
        No lead source data available
      </div>
    );
  }

  return (
    <div className="pie-chart-container" style={{ position: "relative" }}>
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
          innerRadius={0.5}
          padAngle={0.5}
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
          // Custom layers for highlighting - use standard layers as fallback
          layers={["arcs", "arcLabels", "arcLinkLabels", "legends"]}
          // Animations
          animate={true}
          motionConfig="gentle"
          transitionMode="innerRadius"
          // Custom colors to match
          theme={chartTheme}
          // Handle active elements highlight
          activeId={hoveredSegment}
          defs={[
            {
              id: "lines",
              type: "patternLines",
              background: "transparent",
              color: "rgba(0, 0, 0, 0.1)",
              rotation: -45,
              lineWidth: 4,
              spacing: 8,
            },
          ]}
        />
      </div>
      <div className="flex flex-wrap justify-center mt-2 gap-1">
        {leadSourcesForDisplay.map((source) => (
          <div
            key={source.id}
            style={{
              padding: isSmallScreen ? "2px 4px" : "3px 6px",
              border: `1px solid ${source.color}`,
              borderLeft: `3px solid ${source.color}`,
              borderRadius: "4px",
              backgroundColor:
                hoveredSegment === source.id
                  ? `${source.color}30`
                  : `${source.color}10`,
              fontSize: isSmallScreen ? "8px" : "12px",
              boxShadow:
                hoveredSegment === source.id
                  ? "0 2px 4px rgba(0,0,0,0.15)"
                  : "0 1px 1px rgba(0,0,0,0.05)",
              margin: "2px",
              transition: "all 0.2s ease",
              cursor: "pointer",
              transform:
                hoveredSegment === source.id ? "translateY(-1px)" : "none",
              opacity:
                hoveredSegment !== null && hoveredSegment !== source.id
                  ? 0.6
                  : 1,
            }}
            onMouseEnter={() => handleSegmentHover(source.id)}
            onMouseLeave={() => handleSegmentHover(null)}
          >
            <strong>{source.name}</strong>: {source.points}
          </div>
        ))}
      </div>
    </div>
  );
};

LeadSourcePieChart.displayName = "LeadSourcePieChart";

export default React.memo(LeadSourcePieChart);
