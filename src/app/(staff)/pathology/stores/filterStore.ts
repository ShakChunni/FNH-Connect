/**
 * Pathology Filter Store
 * Manages filter panel state, all filter values, and report generation
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// ═══════════════════════════════════════════════════════════════
// State Interfaces
// ═══════════════════════════════════════════════════════════════

export type PathologyStatus = "Completed" | "Pending" | "All";

export interface FilterValues {
  // Doctor filters
  orderedById: number | null;
  doneById: number | null;
  // Status
  status: PathologyStatus;
  // Test names (multi-select)
  testNames: string[];
  // Date range
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  // Search
  search: string;
  // Pagination
  page: number;
  limit: number;
}

interface FilterPanelState {
  isOpen: boolean;
}

interface ReportState {
  isGenerating: boolean;
  showReportBar: boolean; // Always visible option
  selectedReportType: "summary" | "detailed" | "financial" | null;
}

interface FilterState {
  panel: FilterPanelState;
  filters: FilterValues;
  report: ReportState;
}

interface FilterActions {
  // Panel actions
  openFilterPanel: () => void;
  closeFilterPanel: () => void;
  toggleFilterPanel: () => void;

  // Filter actions
  setOrderedById: (id: number | null) => void;
  setDoneById: (id: number | null) => void;
  setStatus: (status: PathologyStatus) => void;
  setTestNames: (names: string[]) => void;
  toggleTestName: (name: string) => void;
  setDateRange: (range: string) => void;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Bulk actions
  clearAllFilters: () => void;
  getActiveFilterCount: () => number;

  // Report actions
  setShowReportBar: (show: boolean) => void;
  setSelectedReportType: (
    type: "summary" | "detailed" | "financial" | null
  ) => void;
  setIsGenerating: (generating: boolean) => void;
}

type FilterStore = FilterState & FilterActions;

// ═══════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════

const initialFilterValues: FilterValues = {
  orderedById: null,
  doneById: null,
  status: "All",
  testNames: [],
  dateRange: "all",
  startDate: null,
  endDate: null,
  search: "",
  page: 1,
  limit: 15,
};

const initialPanelState: FilterPanelState = {
  isOpen: false,
};

const initialReportState: ReportState = {
  isGenerating: false,
  showReportBar: true, // Report bar visible by default
  selectedReportType: null,
};

// ═══════════════════════════════════════════════════════════════
// Date Range Helper
// ═══════════════════════════════════════════════════════════════

export const getDateRangeFromOption = (
  option: string
): { start: Date | null; end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (option) {
    case "today": {
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      return { start: today, end: endOfDay };
    }
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return { start: yesterday, end: endOfYesterday };
    }
    case "last7days": {
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      return { start: last7Days, end: now };
    }
    case "last30days": {
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);
      return { start: last30Days, end: now };
    }
    case "thisMonth": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth, end: now };
    }
    case "lastMonth": {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      return { start: lastMonthStart, end: lastMonthEnd };
    }
    default:
      return { start: null, end: null };
  }
};

// ═══════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════

export const usePathologyFilterStore = create<FilterStore>((set, get) => ({
  // Initial state
  panel: { ...initialPanelState },
  filters: { ...initialFilterValues },
  report: { ...initialReportState },

  // Panel actions
  openFilterPanel: () =>
    set((state) => ({
      panel: { ...state.panel, isOpen: true },
    })),

  closeFilterPanel: () =>
    set((state) => ({
      panel: { ...state.panel, isOpen: false },
    })),

  toggleFilterPanel: () =>
    set((state) => ({
      panel: { ...state.panel, isOpen: !state.panel.isOpen },
    })),

  // Filter actions
  setOrderedById: (id) =>
    set((state) => ({
      filters: { ...state.filters, orderedById: id, page: 1 },
    })),

  setDoneById: (id) =>
    set((state) => ({
      filters: { ...state.filters, doneById: id, page: 1 },
    })),

  setStatus: (status) =>
    set((state) => ({
      filters: { ...state.filters, status, page: 1 },
    })),

  setTestNames: (names) =>
    set((state) => ({
      filters: { ...state.filters, testNames: names, page: 1 },
    })),

  toggleTestName: (name) =>
    set((state) => {
      const current = state.filters.testNames;
      const updated = current.includes(name)
        ? current.filter((c) => c !== name)
        : [...current, name];
      return {
        filters: { ...state.filters, testNames: updated, page: 1 },
      };
    }),

  setDateRange: (range) => {
    const dateRange = getDateRangeFromOption(range);
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: range,
        startDate: dateRange.start,
        endDate: dateRange.end,
        page: 1,
      },
    }));
  },

  setCustomDateRange: (start, end) =>
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: "custom",
        startDate: start,
        endDate: end,
        page: 1,
      },
    })),

  setSearch: (search) =>
    set((state) => ({
      filters: { ...state.filters, search, page: 1 },
    })),

  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
    })),

  setLimit: (limit) =>
    set((state) => ({
      filters: { ...state.filters, limit, page: 1 },
    })),

  // Bulk actions
  clearAllFilters: () =>
    set({
      filters: { ...initialFilterValues },
    }),

  getActiveFilterCount: () => {
    const { filters } = get();
    let count = 0;
    if (filters.orderedById !== null) count++;
    if (filters.doneById !== null) count++;
    if (filters.status !== "All") count++;
    if (filters.testNames.length > 0) count++;
    if (filters.dateRange !== "all") count++;
    if (filters.search !== "") count++;
    return count;
  },

  // Report actions
  setShowReportBar: (show) =>
    set((state) => ({
      report: { ...state.report, showReportBar: show },
    })),

  setSelectedReportType: (type) =>
    set((state) => ({
      report: { ...state.report, selectedReportType: type },
    })),

  setIsGenerating: (generating) =>
    set((state) => ({
      report: { ...state.report, isGenerating: generating },
    })),
}));

// ═══════════════════════════════════════════════════════════════
// Selector Hooks
// ═══════════════════════════════════════════════════════════════

export const usePathologyFilterPanelState = () =>
  usePathologyFilterStore((state) => state.panel);

export const usePathologyFilterValues = () =>
  usePathologyFilterStore((state) => state.filters);

export const usePathologyReportState = () =>
  usePathologyFilterStore((state) => state.report);

export const usePathologyFilterActions = () =>
  usePathologyFilterStore(
    useShallow((state) => ({
      openFilterPanel: state.openFilterPanel,
      closeFilterPanel: state.closeFilterPanel,
      toggleFilterPanel: state.toggleFilterPanel,
      setOrderedById: state.setOrderedById,
      setDoneById: state.setDoneById,
      setStatus: state.setStatus,
      setTestNames: state.setTestNames,
      toggleTestName: state.toggleTestName,
      setDateRange: state.setDateRange,
      setCustomDateRange: state.setCustomDateRange,
      setSearch: state.setSearch,
      setPage: state.setPage,
      setLimit: state.setLimit,
      clearAllFilters: state.clearAllFilters,
      getActiveFilterCount: state.getActiveFilterCount,
    }))
  );

export const usePathologyReportActions = () =>
  usePathologyFilterStore(
    useShallow((state) => ({
      setShowReportBar: state.setShowReportBar,
      setSelectedReportType: state.setSelectedReportType,
      setIsGenerating: state.setIsGenerating,
    }))
  );
