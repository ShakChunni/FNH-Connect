import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DropdownsProps } from "../Dropdowns";

interface StagesCount {
  "Total Prospects": number;
  "Total Meetings Conducted": number;
  "Total Proposal In Progress": number;
  "Total Proposal Sent Out": number;
  "Total Quotation Signed": number;
  "Lost Leads": number;
}

interface SearchParams {
  searchTerm: string;
  searchField: string;
}

const useFetchedFilteredData = (
  filters: DropdownsProps["filters"],
  shouldFetchData: boolean,
  searchParams?: SearchParams
) => {
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ["dashboardData", filters, searchParams],
    [
      filters.pic.join(","),
      filters.dateSelector.start,
      filters.dateSelector.end,
      filters.dateSelector.option.join(","),
      filters.tableSelector,
      filters.leadsFilter,
      filters.location.join(","),
      searchParams?.searchTerm,
      searchParams?.searchField,
    ]
  );

  const {
    data: dashboardData,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await fetch("/api/fetch/dashboard-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...filters,
            search: searchParams ?? { searchTerm: "", searchField: "" },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    enabled: shouldFetchData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const data = useMemo(() => {
    return dashboardData?.filteredData || [];
  }, [dashboardData?.filteredData]);

  const previousData = useMemo(() => {
    return dashboardData?.previousData || {};
  }, [dashboardData?.previousData]);

  const customOptions = useMemo(() => {
    return dashboardData?.customOptions || [];
  }, [dashboardData?.customOptions]);

  const filterActiveData = useCallback((data: any[]) => {
    return data.filter((item: any) => !item.isInactive);
  }, []);

  const activeData = useMemo(() => {
    if (!data || !data.length) return [];
    return filterActiveData(data);
  }, [data, filterActiveData]);

  const leadSourceData = useMemo(() => {
    if (!activeData?.length) return {};

    return activeData.reduce((acc: Record<string, number>, item: any) => {
      const leadSource = item.lead_source;
      if (leadSource) {
        acc[leadSource] = (acc[leadSource] || 0) + 1;
      }
      return acc;
    }, {});
  }, [activeData]);

  const picData = useMemo(() => {
    if (!activeData?.length) return {};

    return activeData.reduce((acc: Record<string, number>, item: any) => {
      const pic = item.PIC;
      if (pic) {
        acc[pic] = (acc[pic] || 0) + 1;
      }
      return acc;
    }, {});
  }, [activeData]);

  const totalProposalValue = useMemo(() => {
    if (!activeData?.length) return 0;

    return activeData.reduce(
      (sum: number, item: any) =>
        sum + (Number(item.total_proposal_value) || 0),
      0
    );
  }, [activeData]);

  const totalClosedSale = useMemo(() => {
    if (!activeData?.length) return 0;

    return activeData.reduce(
      (sum: number, item: any) => sum + (Number(item.total_closed_sale) || 0),
      0
    );
  }, [activeData]);

  const stagesData = useMemo(() => {
    if (!activeData?.length) {
      return {
        labels: [],
        datasets: [{ name: "Stages", data: [] }],
      };
    }

    const stagesCount: StagesCount = {
      "Total Prospects": 0,
      "Total Meetings Conducted": 0,
      "Total Proposal In Progress": 0,
      "Total Proposal Sent Out": 0,
      "Total Quotation Signed": 0,
      "Lost Leads": 0,
    };

    for (let i = 0; i < activeData.length; i++) {
      const item = activeData[i];
      if (item.prospect_date) stagesCount["Total Prospects"]++;
      if (item.meetings_conducted === true)
        stagesCount["Total Meetings Conducted"]++;
      if (item.proposal_in_progress === true)
        stagesCount["Total Proposal In Progress"]++;
      if (item.proposal_sent_out === true)
        stagesCount["Total Proposal Sent Out"]++;
      if (item.quotation_signed === true)
        stagesCount["Total Quotation Signed"]++;
      if (item.lost_lead === true) stagesCount["Lost Leads"]++;
    }

    const nonZeroLabels: string[] = [];
    const nonZeroData: number[] = [];

    Object.entries(stagesCount).forEach(([key, value]) => {
      if (value > 0) {
        nonZeroLabels.push(key);
        nonZeroData.push(value);
      }
    });

    return {
      labels: nonZeroLabels,
      datasets: [{ name: "Stages", data: nonZeroData }],
    };
  }, [activeData]);

  const industryData = useMemo(() => {
    if (!activeData?.length) return {};

    return activeData.reduce((acc: Record<string, number>, item: any) => {
      const industry = item.industry_name;
      if (industry) {
        acc[industry] = (acc[industry] || 0) + 1;
      }
      return acc;
    }, {});
  }, [activeData]);

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
      const labels = Object.keys(sourceData);
      const data = Object.values(sourceData);
      const nonZeroIndexes: number[] = [];

      for (let i = 0; i < data.length; i++) {
        if (data[i] > 0) nonZeroIndexes.push(i);
      }

      return {
        labels: nonZeroIndexes.map((idx) => labels[idx]),
        datasets: [
          {
            label,
            data: nonZeroIndexes.map((idx) => data[idx]),
            backgroundColor: nonZeroIndexes.map(
              (idx) => colorArray[idx % colorArray.length]
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
    return processChartData(industryData, chartColors.industry, "Industries");
  }, [industryData, chartColors.industry, processChartData]);

  const filteredLeadSourcePieData = useMemo(() => {
    return processChartData(
      leadSourceData,
      chartColors.leadSource,
      "Lead Sources"
    );
  }, [leadSourceData, chartColors.leadSource, processChartData]);

  const filteredPicPieData = useMemo(() => {
    return processChartData(picData, chartColors.pic, "PIC");
  }, [picData, chartColors.pic, processChartData]);

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
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
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
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
      },
    }),
    []
  );

  const refetch = useCallback(async () => {
    return refetchQuery();
  }, [refetchQuery]);

  const refetchPreviousData = useCallback(async () => {
    return refetchQuery();
  }, [refetchQuery]);

  const refetchCustomOptions = useCallback(async () => {
    return refetchQuery();
  }, [refetchQuery]);

  return {
    data,
    activeData,
    previousData,
    filteredLeadSourcePieData,
    filteredPicPieData,
    filteredIndustryBarData,
    totalProposalValue,
    totalClosedSale,
    stagesData,
    leadSourcePieChartOptions: chartOptions.leadSourcePieChartOptions,
    picPieChartOptions: chartOptions.picPieChartOptions,
    isLoading,
    customOptions,
    refetch,
    refetchPreviousData,
    refetchCustomOptions,
  };
};

export default useFetchedFilteredData;
