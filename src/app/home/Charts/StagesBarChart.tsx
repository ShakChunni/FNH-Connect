import React, { useMemo, useRef, useEffect } from "react";
import { Chart, registerables } from "chart.js";
import { useMediaQuery } from "react-responsive";
import ChartDataLabels from "chartjs-plugin-datalabels";
import StagesBarChartSkeleton from "./Skeletons/StagesBarChartSkeleton";
// Register Chart.js components and plugins
Chart.register(...registerables, ChartDataLabels);

interface StagesBarChartProps {
  data: any;
  isLoading?: boolean;
}

// Add the color shade generator from IndustryBarChart
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
const colorPalette = generateShades(190, 60, 25, 95, 15);

const StagesBarChart: React.FC<StagesBarChartProps> = ({
  data,
  isLoading = false,
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const isSmallScreen = useMediaQuery({ query: "(max-width: 600px)" });
  const isMediumScreen = useMediaQuery({
    query: "(min-width: 601px) and (max-width: 1280px)",
  });

  const { labels, datasets } = data || { labels: [], datasets: [] };

  // Generate colors for the chart based on number of data points
  const barColors = useMemo(() => {
    if (!datasets[0]?.data?.length) return [];

    return datasets[0].data.map(
      (_: any, i: number) => colorPalette[i % colorPalette.length]
    );
  }, [datasets]);

  useEffect(() => {
    if (!chartRef.current || !datasets[0]?.data?.length) return;

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

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Define font size based on screen size
    const fontSize = isSmallScreen ? 8 : isMediumScreen ? 10 : 12;
    const barThickness = isSmallScreen ? 16 : 32; // Reduced bar thickness

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Metric",
            data: datasets[0].data,
            backgroundColor: barColors,
            borderColor: barColors,
            borderWidth: 1,
            borderRadius: {
              topRight: 8,
              bottomRight: 8,
            },
            borderSkipped: false,
            barThickness: barThickness,
            categoryPercentage: isSmallScreen ? 0.4 : 0.7, // Reduced to create more space between bars
            barPercentage: 0.9,
          },
        ],
      },
      options: {
        indexAxis: "y", // Horizontal bar chart
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true, // Enable tooltips
          },
          datalabels: {
            color: "white",
            anchor: "center",
            align: "center",
            font: {
              weight: "bold",
              size: isSmallScreen ? 10 : 12,
            },
            formatter: (value) => {
              return value;
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              display: true,
            },
            ticks: {
              color: "black",
              font: {
                size: isSmallScreen ? 12 : 14,
                weight: "bold",
              },
            },
          },
          y: {
            grid: {
              display: false,
            },
            position: "left",
            ticks: {
              color: "black",
              font: {
                size: isSmallScreen ? 8 : 12,
                weight: "bold",
              },
              // This is the key setting for wrapping text
              callback: function (value: any) {
                const label = this.getLabelForValue(value);

                // Get the context to measure text width
                const ctx = this.chart.ctx;
                const maxWidth = isSmallScreen ? 100 : 150; // Maximum width for the label

                if (!ctx) return label;

                // Set the font for measurement
                ctx.font = `${fontSize}px 600 "Inter", sans-serif`;

                // Measure the text width
                const textWidth = ctx.measureText(label).width;

                if (textWidth <= maxWidth) {
                  return label;
                }

                // Split into multiple lines if too long
                const words = label.split(" ");
                const lines = [];
                let currentLine = "";

                for (const word of words) {
                  const testLine = currentLine
                    ? `${currentLine} ${word}`
                    : word;
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
              // Auto-scales the available space for y-axis labels
              autoSkip: false,
              align: "center", // Change from 'start' to 'center'
              crossAlign: "near", // Add this to align with bars
              padding: 8, // Adjust padding as needed
            },
          },
        },
        layout: {
          padding: {
            left: 15, // Reduce left padding
            right: 40,
            top: 10,
            bottom: 10,
          },
        },
      },
    });

    // Clean up on component unmount
    return () => {
      window.removeEventListener("resize", resizeChart);
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [labels, datasets, isSmallScreen, isMediumScreen, barColors]);

  if (isLoading) {
    return <StagesBarChartSkeleton />;
  }

  if (!datasets[0]?.data?.length) {
    return <div>No stage data available</div>;
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

export default React.memo(StagesBarChart);
