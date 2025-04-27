import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const wrapText = (text: string, maxWidth: number): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = currentLine.length + word.length + 1;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

const fetchAllData = async () => {
  try {
    const response = await fetch("/api/fetch/fetchTableDataInitial");
    const data = await response.json();
    console.log("Fetched data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};

const processLeadSourceData = (data: any[]) => {
  const leadSourceCount: { [key: string]: number } = {};

  data.forEach((item) => {
    const leadSource = item.lead_source;
    if (leadSource) {
      if (!leadSourceCount[leadSource]) {
        leadSourceCount[leadSource] = 0;
      }
      leadSourceCount[leadSource]++;
    }
  });

  return leadSourceCount;
};

const processPicData = (data: any[]) => {
  const picCount: { [key: string]: number } = {};

  data.forEach((item) => {
    const pic = item.PIC;
    if (pic) {
      if (!picCount[pic]) {
        picCount[pic] = 0;
      }
      picCount[pic]++;
    }
  });

  return picCount;
};

const calculateMetrics = (data: any[]) => {
  let meetingsConducted = 0;
  let proposalInProgress = 0;
  let proposalSentOut = 0;
  let quotationSigned = 0;

  data.forEach((item) => {
    if (item.meetings_conducted) meetingsConducted++;
    if (item.proposal_in_progress) proposalInProgress++;
    if (item.proposal_sent_out) proposalSentOut++;
    if (item.quotation_signed) quotationSigned++;
  });

  return [
    meetingsConducted,
    proposalInProgress,
    proposalSentOut,
    quotationSigned,
  ];
};

const barChartData = {
  labels: [
    "Total Meetings Conducted",
    "Total Proposal OR/AND Quotation In Progress",
    "Total Proposal OR/AND Quotation Sent Out",
    "Total Quotation Signed",
  ],
  datasets: [
    {
      label: "Metrics",
      data: [],
      backgroundColor: "rgba(75, 192, 192, 0.6)",
      borderColor: "rgb(75, 192, 192)",
      borderWidth: 1,
    },
  ],
};

export const barChartOptions = {
  indexAxis: "y" as const,
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    datalabels: {
      anchor: "center" as const,
      align: "center" as const,
      color: "white",
      font: {
        weight: "bold" as const,
        size: 24,
      },
      formatter: (value: number) => value,
    },
  },
  scales: {
    x: {
      beginAtZero: true,
    },
    y: {
      ticks: {
        callback: function (value: string | number): string[] {
          const maxWidth = 40;
          const label = barChartData.labels[value as number] as string;
          return wrapText(label, maxWidth);
        },
      },
    },
  },
};

export const leadSourcePieChartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "bottom",
    },
    datalabels: {
      anchor: "end" as const,
      align: "start" as const,
      color: "#fff",
      font: {
        weight: "bold" as const,
        size: 18,
      },
      formatter: (value: number, context: any) => {
        return value > 0 ? value : null;
      },
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
  layout: {
    padding: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
  },
};

export const picPieChartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "bottom",
    },
    datalabels: {
      anchor: "end" as const,
      align: "start" as const,
      color: "#fff",
      font: {
        weight: "bold" as const,
        size: 18,
      },
      formatter: (value: number, context: any) => {
        return value > 0 ? value : null;
      },
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
  layout: {
    padding: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
  },
};

const useInitialData = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tableData = [] } = useQuery({
    queryKey: ["allData"],
    queryFn: async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllData();
        return data;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        return [];
      } finally {
        setLoading(false);
      }
    },
    refetchInterval: 120000, // Refetch every 120 seconds
    staleTime: 120000, // Data is considered fresh for 120 seconds
  });

  const leadSourceData = useMemo(
    () => processLeadSourceData(tableData),
    [tableData]
  );
  const picData = useMemo(() => processPicData(tableData), [tableData]);

  const totalProposalValue = useMemo(
    () =>
      tableData.reduce(
        (sum: number, item: any) => sum + item.total_proposal_value,
        0
      ),
    [tableData]
  );

  const totalClosedSale = useMemo(
    () =>
      tableData.reduce(
        (sum: number, item: any) => sum + item.total_closed_sale,
        0
      ),
    [tableData]
  );

  const metrics = useMemo(() => calculateMetrics(tableData), [tableData]);

  const barChartData = useMemo(
    () => ({
      labels: [
        "Total Meetings Conducted",
        "Total Proposal OR/AND Quotation In Progress",
        "Total Proposal OR/AND Quotation Sent Out",
        "Total Quotation Signed",
      ],
      datasets: [
        {
          label: "Metrics",
          data: metrics,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgb(75, 192, 192)",
          borderWidth: 1,
        },
      ],
    }),
    [metrics]
  );

  const rawLeadSourcePieData = useMemo(() => {
    if (!leadSourceData)
      return {
        labels: [],
        datasets: [
          {
            label: "Lead Sources",
            data: [],
            backgroundColor: [],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      };

    return {
      labels: Object.keys(leadSourceData),
      datasets: [
        {
          label: "Lead Sources",
          data: Object.values(leadSourceData),
          backgroundColor: [
            "#36A2EB",
            "#FFCE56",
            "#32CD32",
            "#4BC0C0",
            "#FF6384",
            "#FF9F40",
            "#FFCD56",
          ],
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  }, [leadSourceData]);

  const filteredLeadSourcePieData = useMemo(() => {
    return {
      labels: rawLeadSourcePieData.labels.filter(
        (_, index) => rawLeadSourcePieData.datasets[0].data[index] !== 0
      ),
      datasets: [
        {
          ...rawLeadSourcePieData.datasets[0],
          data: rawLeadSourcePieData.datasets[0].data.filter(
            (value) => value !== 0
          ),
          backgroundColor:
            rawLeadSourcePieData.datasets[0].backgroundColor.filter(
              (_, index) => rawLeadSourcePieData.datasets[0].data[index] !== 0
            ),
        },
      ],
    };
  }, [rawLeadSourcePieData]);

  const rawPicPieData = useMemo(() => {
    if (!picData)
      return {
        labels: [],
        datasets: [
          {
            label: "PIC",
            data: [],
            backgroundColor: [],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      };

    return {
      labels: Object.keys(picData),
      datasets: [
        {
          label: "PIC",
          data: Object.values(picData),
          backgroundColor: [
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
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  }, [picData]);

  const filteredPicPieData = useMemo(() => {
    return {
      labels: rawPicPieData.labels.filter(
        (_, index) => rawPicPieData.datasets[0].data[index] !== 0
      ),
      datasets: [
        {
          ...rawPicPieData.datasets[0],
          data: rawPicPieData.datasets[0].data.filter((value) => value !== 0),
          backgroundColor: rawPicPieData.datasets[0].backgroundColor.filter(
            (_, index) => rawPicPieData.datasets[0].data[index] !== 0
          ),
        },
      ],
    };
  }, [rawPicPieData]);

  const refetchData = () => {
    queryClient.invalidateQueries({ queryKey: ["allData"] });
  };

  return {
    tableData,
    filteredLeadSourcePieData,
    filteredPicPieData,
    totalProposalValue,
    totalClosedSale,
    barChartData,
    barChartOptions,
    leadSourcePieChartOptions,
    picPieChartOptions,
    loading,
    error,
    refetchData,
  };
};

export default useInitialData;
