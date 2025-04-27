import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import LeadSourcePieChart from "./LeadSourcePieChart";
import LeadPicsPieChart from "./LeadPicsPieChart"; // Updated import name
import TotalMetrics from "./TotalMetrics";
import IndustryBarChart from "./IndustryBarChart";
import StagesBarChart from "./StagesBarChart";

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
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  options,
  type,
}) => {
  return (
    <div className="bg-[#F4F8FC] p-4 rounded-2xl shadow-md h-full flex flex-col">
      <h3 className="text-sm sm:text-base xl:text-lg font-bold mb-1 text-blue-950">
        {title}
      </h3>
      <div
        className={`w-full flex-grow ${
          type === "stagesBar"
            ? "h-[300px]" // Fixed height for stages bar
            : type === "industryBar"
            ? "h-[400px]" // Fixed height for industry bar
            : "min-h-[12rem] sm:min-h-[16rem] md:min-h-[20rem]"
        }`}
      >
        {" "}
        {type === "doughnut" ? (
          <Doughnut data={data} options={options} />
        ) : type === "leadsourcePie" ? (
          <LeadSourcePieChart data={data} />
        ) : type === "picPie" ? (
          <LeadPicsPieChart data={data} />
        ) : type === "totalMetrics" ? (
          <TotalMetrics data={data} />
        ) : type === "industryBar" ? (
          <IndustryBarChart data={data} />
        ) : type === "stagesBar" ? (
          <StagesBarChart data={data} />
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>
    </div>
  );
};

export default ChartCard;
