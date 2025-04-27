import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useMediaQuery } from "react-responsive";

interface TotalMetricsProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  };
}

const TotalMetrics: React.FC<TotalMetricsProps> = ({ data }) => {
  const isSmallScreen = useMediaQuery({ query: "(max-width: 600px)" });
  const isMediumScreen = useMediaQuery({
    query: "(min-width: 601px) and (max-width: 1280px)",
  });
  const isLargeScreen = useMediaQuery({ query: "(min-width: 1281px)" });

  if (!data?.labels?.length) {
    return <div>No data available</div>;
  }

  // Add a larger base value to make small values more visible
  const baseValue = 15; // Increase this to make bars more visible
  const adjustedData = data.datasets[0].data.map((value) => value + baseValue);
  const maxValue = Math.max(...data.datasets[0].data);

  const chartData: {
    series: ApexAxisChartSeries;
    options: ApexOptions;
  } = {
    series: [
      {
        name: "Count",
        data: adjustedData,
      },
    ],
    options: {
      chart: {
        type: "bar" as const,
        height: isSmallScreen ? 250 : isMediumScreen ? 300 : 250,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          dataLabels: {
            position: "center",
          },
          barHeight: isSmallScreen ? "60%" : isMediumScreen ? "60%" : "70%",
          rangeBarOverlap: true,
        },
      },
      states: {
        hover: {
          filter: {
            type: "none",
          },
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ["#fff"],
          fontSize: isSmallScreen ? "8px" : isMediumScreen ? "12px" : "14px",
          fontWeight: "bold",
        },
        formatter: function (val: number) {
          return (val - baseValue).toString(); // Subtract the base value to show actual value
        },
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return (val - baseValue).toString(); // Show actual value in tooltip
          },
        },
      },
      xaxis: {
        categories: data.labels,
        labels: {
          style: {
            fontSize: isSmallScreen ? "8px" : isMediumScreen ? "12px" : "14px",
          },
        },
        min: 0,
        max: maxValue + 25,
      },
      yaxis: {
        labels: {
          style: {
            fontSize: isSmallScreen ? "8px" : isMediumScreen ? "12px" : "14px",
          },
        },
      },
      colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
      legend: {
        show: false,
      },
    },
  };

  return (
    <div
      style={{
        width: "100%",
        height: isSmallScreen ? "100%" : isMediumScreen ? "100%" : "125%",
      }}
    >
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="bar"
        height="100%"
      />
    </div>
  );
};

export default TotalMetrics;
