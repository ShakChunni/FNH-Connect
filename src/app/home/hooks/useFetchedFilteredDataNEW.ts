import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { DropdownsProps } from "../Dropdowns";

interface SearchParams {
  searchTerm: string;
}

const useFetchedFilteredData = (
  filters: DropdownsProps["filters"],
  shouldFetchData: boolean,
  searchParams?: SearchParams,
  page: number = 1,
  limit: number = 50
) => {
  const filtersDependency = JSON.stringify(filters);
  const searchParamsDependency = JSON.stringify(searchParams);

  // Charts Query - Cached longer, less frequent updates
  const {
    data: chartData,
    isLoading: chartLoading,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: ["dashboardCharts", filtersDependency, searchParamsDependency],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...filters,
          search: searchParams
            ? { searchTerm: searchParams.searchTerm }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    enabled: shouldFetchData,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Table Query - Shorter cache, more frequent updates
  const {
    data: tableData,
    isLoading: tableLoading,
    refetch: refetchTable,
  } = useQuery({
    queryKey: [
      "dashboardTable",
      filtersDependency,
      searchParamsDependency,
      page,
    ],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...filters,
          search: searchParams
            ? { searchTerm: searchParams.searchTerm }
            : undefined,
          page,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    enabled: shouldFetchData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Process chart data from backend aggregations
  const processedChartData = useMemo(() => {
    if (!chartData?.chartData) return null;

    const { picData, leadSourceData, industryData, stagesData } =
      chartData.chartData;

    // Process PIC data
    const picCounts = picData.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.PIC] = item._count.PIC;
        return acc;
      },
      {}
    );

    // Process Lead Source data - FIXED
    const leadSourceCounts = leadSourceData.reduce(
      (acc: Record<string, number>, item: any) => {
        const leadSource = item.lead_source; // Direct access since we processed it in backend
        if (leadSource) {
          acc[leadSource] = item._count.organizationId;
        }
        return acc;
      },
      {}
    );

    // Process Industry data - FIXED
    const industryCounts = industryData.reduce(
      (acc: Record<string, number>, item: any) => {
        const industry = item.industry; // Direct access since we processed it in backend
        if (industry) {
          acc[industry] = item._count.organizationId;
        }
        return acc;
      },
      {}
    );

    return {
      picData: picCounts,
      leadSourceData: leadSourceCounts,
      industryData: industryCounts,
      stagesData: {
        labels: [
          "Total Prospects",
          "Total Meetings Conducted",
          "Total Proposal In Progress",
          "Total Proposal Sent Out",
          "Total Quotation Signed",
          "Lost Leads",
        ],
        datasets: [
          {
            name: "Stages",
            data: [
              stagesData._count.prospect_date || 0,
              stagesData._count.meetings_conducted || 0,
              stagesData._count.proposal_in_progress || 0,
              stagesData._count.proposal_sent_out || 0,
              stagesData._count.quotation_signed || 0,
              stagesData._count.lost_lead || 0,
            ],
          },
        ],
      },
    };
  }, [chartData]);

  const chartColors = useMemo(
    () => ({
      industry: [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
        "#32CD32",
        "#FF6B6B",
        "#8A2BE2",
        "#FFA07A",
      ],
      leadSource: [
        "#36A2EB",
        "#FFCE56",
        "#32CD32",
        "#4BC0C0",
        "#FF6384",
        "#FF9F40",
        "#FFCD56",
      ],
      pic: [
        "#FF6384",
        "#ADD8E6",
        "#DDA0DD",
        "#E6E6FA",
        "#8A2BE2",
        "#5F9EA0",
        "#D2691E",
        "#FF7F50",
        "#6495ED",
        "#DC143C",
        "#00FFFF",
      ],
    }),
    []
  );

  const processChartData = useCallback(
    (
      sourceData: Record<string, number>,
      colorArray: string[],
      label: string
    ) => {
      const entries = Object.entries(sourceData).filter(
        ([_, value]) => value > 0
      );

      return {
        labels: entries.map(([key]) => key),
        datasets: [
          {
            label,
            data: entries.map(([_, value]) => value),
            backgroundColor: entries.map(
              (_, idx) => colorArray[idx % colorArray.length]
            ),
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      };
    },
    []
  );

  const filteredIndustryBarData = useMemo(() => {
    if (!processedChartData?.industryData) return { labels: [], datasets: [] };
    return processChartData(
      processedChartData.industryData,
      chartColors.industry,
      "Industries"
    );
  }, [
    processedChartData?.industryData,
    chartColors.industry,
    processChartData,
  ]);

  const filteredLeadSourcePieData = useMemo(() => {
    if (!processedChartData?.leadSourceData)
      return { labels: [], datasets: [] };
    return processChartData(
      processedChartData.leadSourceData,
      chartColors.leadSource,
      "Lead Sources"
    );
  }, [
    processedChartData?.leadSourceData,
    chartColors.leadSource,
    processChartData,
  ]);

  const filteredPicPieData = useMemo(() => {
    if (!processedChartData?.picData) return { labels: [], datasets: [] };
    return processChartData(processedChartData.picData, chartColors.pic, "PIC");
  }, [processedChartData?.picData, chartColors.pic, processChartData]);

  const chartOptions = useMemo(
    () => ({
      leadSourcePieChartOptions: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: true, position: "bottom" },
          datalabels: {
            anchor: "end",
            align: "start",
            color: "#fff",
            font: { weight: "bold", size: 18 },
            formatter: (value: number) => (value > 0 ? value : null),
          },
        },
        elements: {
          arc: {
            borderWidth: 2,
            borderColor: "#fff",
            hoverBorderColor: "#000",
            hoverBorderWidth: 3,
          },
        },
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
      },
      picPieChartOptions: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: true, position: "bottom" },
          datalabels: {
            anchor: "end",
            align: "start",
            color: "#fff",
            font: { weight: "bold", size: 18 },
            formatter: (value: number) => (value > 0 ? value : null),
          },
        },
        elements: {
          arc: {
            borderWidth: 2,
            borderColor: "#fff",
            hoverBorderColor: "#000",
            hoverBorderWidth: 3,
          },
        },
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
      },
    }),
    []
  );

  const refetch = useCallback(async () => {
    await Promise.all([refetchCharts(), refetchTable()]);
  }, [refetchCharts, refetchTable]);

  return {
    // Chart data - FROM CHARTS API (all data)
    filteredLeadSourcePieData,
    filteredPicPieData,
    filteredIndustryBarData,
    stagesData: processedChartData?.stagesData || { labels: [], datasets: [] },
    leadSourcePieChartOptions: chartOptions.leadSourcePieChartOptions,
    picPieChartOptions: chartOptions.picPieChartOptions,

    // Metrics - FROM CHARTS API (all data)
    totalProposalValue: chartData?.totalProposalValue || 0,
    totalClosedSale: chartData?.totalClosedSale || 0,
    totalPendingSales: chartData?.totalPendingSales || 0,
    previousData: chartData?.previousData || {},
    customOptions: chartData?.customOptions || [],

    // Table data - FROM TABLE API (paginated)
    data: tableData?.filteredData || [],
    totalCount: tableData?.totalCount || 0,
    currentPage: tableData?.currentPage || 1,
    totalPages: tableData?.totalPages || 0,

    // Loading states
    isLoading: chartLoading || tableLoading,
    chartLoading,
    tableLoading,

    // Refetch functions
    refetch,
    refetchCharts,
    refetchTable,
  };
};

export default useFetchedFilteredData;
