import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useMediaQuery } from "react-responsive";
import IndustryBarChartSkeleton from "./Skeletons/IndustryBarChartSkeleton";

// Register the required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface IndustryBarChartProps {
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

const generateShades = (
  hue: number,
  saturation: number,
  lightStart: number,
  lightEnd: number,
  steps: number
) => {
  const shades = [];
  for (let i = 0; i < steps; i++) {
    const lightness = lightStart + ((lightEnd - lightStart) * i) / (steps - 1);
    shades.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return shades;
};

// Example: teal-blue gradient, from dark (20%) to light (75%)
const colorPalette = generateShades(190, 55, 20, 75, 25);
interface ProcessedData {
  sortedLabels: string[];
  sortedData: number[];
  sortedColors: string[];
}

const IndustryBarChart: React.FC<IndustryBarChartProps> = ({
  data,
  isLoading = false,
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS<"bar", number[], string> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const isExtraSmallScreen = useMediaQuery({ query: "(max-width: 405px)" });
  const isSmallScreen = useMediaQuery({ query: "(max-width: 767px)" });
  const isMediumScreen = useMediaQuery({
    query: "(min-width: 768px) and (max-width: 1279px)",
  });
  const isLargeScreen = useMediaQuery({
    query: "(min-width: 1921px)",
  });

  const processData = (): ProcessedData => {
    if (!data?.labels?.length) {
      return {
        sortedLabels: [],
        sortedData: [],
        sortedColors: [],
      };
    }

    const dataPoints = data.labels.map((label: string, index: number) => ({
      label,
      value: data.datasets[0].data[index] || 0,
    }));

    dataPoints.sort((a, b) => b.value - a.value);
    const topDataPoints = dataPoints.slice(0, 10);

    return {
      sortedLabels: topDataPoints.map((dp) => dp.label),
      sortedData: topDataPoints.map((dp) => dp.value),
      sortedColors: topDataPoints.map(
        (_, i) => colorPalette[i % colorPalette.length]
      ),
    };
  };

  const { sortedLabels, sortedData, sortedColors } = processData();

  useEffect(() => {
    if (!chartRef.current || !sortedData.length) return;

    // Ensure consistent rendering dimensions
    const resizeChart = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.style.width = "100%";
        chartRef.current.style.height = "100%";
      }
    };

    // Resize initially and on window resize
    resizeChart();
    window.addEventListener("resize", resizeChart);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const fontSize = isSmallScreen ? 10 : isMediumScreen ? 12 : 14;
    const barThickness = isSmallScreen
      ? 16
      : isMediumScreen
      ? 22
      : isLargeScreen
      ? 22
      : 28;

    // Create chart data with proper typing
    const chartData: ChartData<"bar", number[], string> = {
      labels: sortedLabels,
      datasets: [
        {
          data: sortedData,
          backgroundColor: sortedColors,
          borderColor: sortedColors,
          borderWidth: 1,
          // Match StagesBarChart radius style (only right side rounded)
          borderRadius: {
            topRight: 8,
            bottomRight: 8,
          },
          borderSkipped: false,
          barThickness: barThickness,
          categoryPercentage: isSmallScreen ? 0.6 : 0.8,
          barPercentage: 0.9,
        },
      ],
    };

    // Create chart options with proper typing
    const chartOptions: ChartOptions<"bar"> = {
      indexAxis: "y",
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context: TooltipItem<"bar">) {
              return `${context.label}: ${context.parsed.x}`;
            },
          },
        },
        datalabels: {
          color: "white",
          anchor: "center",
          align: "center",
          font: {
            weight: "bold" as const,
            size: isSmallScreen ? 10 : 12,
          },
          formatter: function (value: number) {
            return value > 0 ? value : "";
          },
          display: function (context: {
            dataset: { data: number[] };
            dataIndex: number;
          }) {
            return context.dataset.data[context.dataIndex] > 0;
          },
        } as any,
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            display: true,
            color: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#333",
            font: {
              size: fontSize - 2,
              weight: "bold",
            },
          },
          border: {
            display: true,
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#333",
            font: {
              size: fontSize - 2,
              weight: "bold",
            },
            callback: function (value) {
              const label = this.getLabelForValue(value as number);
              const maxWidth = isSmallScreen ? 100 : 150;

              if (!this.chart.ctx) return label;

              const ctx = this.chart.ctx;
              ctx.font = `${fontSize - 2}px 600 "Inter", sans-serif`;

              const textWidth = ctx.measureText(label).width;

              if (textWidth <= maxWidth) {
                return label;
              }

              const words = label.split(" ");
              const lines: string[] = [];
              let currentLine = "";

              for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const testWidth = ctx.measureText(testLine).width;

                if (testWidth > maxWidth && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }

              if (currentLine) {
                lines.push(currentLine);
              }

              return lines;
            },
            autoSkip: false,
            padding: isSmallScreen ? 5 : 8,
          },
        },
      },
      layout: {
        padding: {
          left: 15,
          right: 15,
          top: 10,
          bottom: 10,
        },
      },
      animation: {
        duration: 300,
      },
      // Remove the onHover handler that was causing re-renders
    };

    chartInstance.current = new ChartJS(ctx, {
      type: "bar",
      data: chartData,
      options: chartOptions,
    });

    return () => {
      window.removeEventListener("resize", resizeChart);
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [
    sortedLabels,
    sortedData,
    sortedColors,
    isSmallScreen,
    isMediumScreen,
    isExtraSmallScreen,
  ]);

  if (isLoading) {
    return <IndustryBarChartSkeleton />;
  }

  if (!sortedData.length) {
    return <div>No industry data available</div>;
  }

  return (
    <div
      ref={chartContainerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas ref={chartRef} style={{ width: "100%", height: "100%" }}></canvas>
    </div>
  );
  
};

// Add React.memo to prevent unnecessary re-renders
export default React.memo(IndustryBarChart);
