import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface FilterState {
  dateSelector: {
    start: string | null;
    end: string | null;
  };
}

interface SearchParams {
  searchTerm: string;
  searchField: string;
}

interface InfertilityPatientData {
  id: number;
  hospitalName: string | null;
  patientFirstName: string;
  patientLastName: string | null;
  patientFullName: string;
  patientAge: number | null;
  patientDOB: Date | null;
  husbandName: string | null;
  husbandAge: number | null;
  husbandDOB: Date | null;
  mobileNumber: string | null;
  address: string | null;
  yearsMarried: number | null;
  yearsTrying: number | null;
  para: string | null;
  alc: string | null;
  weight: number | null;
  bp: string | null;
  infertilityType: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FetchDataResponse {
  data: InfertilityPatientData[];
  customOptions: {
    infertilityTypes: string[];
    hospitals: string[];
    totalCount: number;
  };
}

const useFetchInfertilityData = (
  filters: FilterState,
  shouldFetch: boolean,
  searchParams?: SearchParams
) => {
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ["infertilityPatients", filters, searchParams, shouldFetch],
    [filters, searchParams, shouldFetch]
  );

  const fetchInfertilityPatients =
    useCallback(async (): Promise<FetchDataResponse> => {
      const response = await fetch("/api/infertility/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters,
          searchParams,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch infertility patients: ${response.statusText}`
        );
      }

      return response.json();
    }, [filters, searchParams]);

  const {
    data: queryData,
    isLoading,
    error,
    refetch: queryRefetch,
    isFetching,
    isStale,
  } = useQuery({
    queryKey,
    queryFn: fetchInfertilityPatients,
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const data = useMemo(() => queryData?.data || [], [queryData]);
  const customOptions = useMemo(
    () =>
      queryData?.customOptions || {
        infertilityTypes: [],
        hospitals: [],
        totalCount: 0,
      },
    [queryData]
  );

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["infertilityPatients"],
      exact: false,
    });
    return queryRefetch();
  }, [queryClient, queryRefetch]);

  const invalidateAndRefetch = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["infertilityPatients"],
    });
    return queryRefetch();
  }, [queryClient, queryRefetch]);

  const prefetchWithNewFilters = useCallback(
    async (newFilters: FilterState) => {
      await queryClient.prefetchQuery({
        queryKey: ["infertilityPatients", newFilters, searchParams, true],
        queryFn: () =>
          fetch("/api/infertility/fetch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filters: newFilters,
              searchParams,
            }),
          }).then((res) => res.json()),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient, searchParams]
  );

  const mutateOptimistically = useCallback(
    (
      updatedData: InfertilityPatientData[],
      newCustomOptions?: Partial<FetchDataResponse["customOptions"]>
    ) => {
      queryClient.setQueryData(
        queryKey,
        (oldData: FetchDataResponse | undefined) => ({
          data: updatedData,
          customOptions: {
            ...oldData?.customOptions,
            ...newCustomOptions,
          } as FetchDataResponse["customOptions"],
        })
      );
    },
    [queryClient, queryKey]
  );

  return {
    data,
    isLoading,
    isFetching,
    isStale,
    error,
    customOptions,
    refetch,
    invalidateAndRefetch,
    prefetchWithNewFilters,
    mutateOptimistically,
  };
};

export default useFetchInfertilityData;
