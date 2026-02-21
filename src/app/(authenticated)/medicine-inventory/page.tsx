"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Pill,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  ShoppingCart,
  Plus,
  ClipboardList,
  Settings,
} from "lucide-react";
import { useFetchMedicineStats } from "./hooks";
import { useUIStore, useMedicineFilterStore } from "./stores";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import {
  AddPurchaseModal,
  AddSaleModal,
  AddMedicineModal,
  AddCompanyModal,
  AddGroupModal,
} from "./components/modals";
import {
  MedicineTable,
  PurchaseTable,
  SaleTable,
  ActivityTable,
} from "./components/shared";

// Manage Dropdown — clean way to access Add Medicine/Group/Company
const ManageDropdown: React.FC<{
  openModal: (
    type: "addMedicine" | "addGroup" | "addCompany",
    data?: Record<string, unknown>,
  ) => void;
}> = ({ openModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-colors cursor-pointer border border-gray-100"
      >
        <Settings className="w-3.5 h-3.5" />
        <span>Manage</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-50 py-1 overflow-hidden">
          <button
            onClick={() => {
              openModal("addMedicine");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            Add Medicine
          </button>
          <button
            onClick={() => {
              openModal("addGroup");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-purple-500" />
            Add Group
          </button>
          <button
            onClick={() => {
              openModal("addCompany");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            Add Company
          </button>
        </div>
      )}
    </div>
  );
};

const MedicineInventoryPage = () => {
  const {
    activeTab,
    setActiveTab,
    openModal,
    activeModal,
    closeModal,
    modalData,
  } = useUIStore();
  const { filters, setFilter, resetFilters } = useMedicineFilterStore();

  // Local search state for immediate input feedback
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Sync debounced search to store
  useEffect(() => {
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, setFilter]);

  const { data, isLoading } = useFetchMedicineStats();

  const stats = data?.stats;
  const lowStockItems = data?.lowStockItems || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="Medicine Inventory"
              subtitle="Track medicine purchases, sales, and stock levels."
              actions={
                <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center sm:w-auto">
                  <button
                    onClick={() => openModal("addPurchase")}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
                  >
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Add Purchase</span>
                  </button>
                  <button
                    onClick={() => openModal("addSale")}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Record Sale</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Low Stock Alert Banner */}
          {lowStockItems.length > 0 && (
            <div className="px-1 sm:px-2 lg:px-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-amber-900 mb-1">
                      Low Stock Alert
                    </h4>
                    <p className="text-xs text-amber-700 mb-2">
                      {lowStockItems.length} medicine(s) are running low on
                      stock and may need restocking.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lowStockItems.slice(0, 5).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-semibold text-amber-800 border border-amber-200"
                        >
                          <span>{item.genericName}</span>
                          <span className="text-amber-500">
                            ({item.currentStock} left)
                          </span>
                        </span>
                      ))}
                      {lowStockItems.length > 5 && (
                        <span className="px-2 py-1 text-xs font-semibold text-amber-600">
                          +{lowStockItems.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Stats Grid - Mobile First */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {/* Total Stock Value */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-sm shadow-emerald-100/20 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Package className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-900/60">
                      Stock Value
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-emerald-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-black text-emerald-950 wrap-break-word">
                      {formatCurrency(stats?.totalStockValue || 0)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs font-medium mt-1 text-emerald-700/80">
                    Total inventory value
                  </p>
                </div>
              </div>

              {/* Low Stock Items */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-rose-50/50 rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-sm shadow-rose-100/20 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-900/60">
                      Low Stock
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-rose-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-black text-rose-950">
                      {stats?.lowStockCount || 0}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs font-medium mt-1 text-rose-700/80">
                    Items need restocking
                  </p>
                </div>
              </div>

              {/* Today's Sales */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-sm shadow-blue-100/20 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <TrendingDown className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-900/60">
                      Today&apos;s Sales
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-blue-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-black text-blue-950 wrap-break-word">
                      {formatCurrency(stats?.todaysSalesAmount || 0)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs font-medium mt-1 text-blue-700/80">
                    {stats?.todaysSalesCount || 0} sale(s) today
                  </p>
                </div>
              </div>

              {/* Today's Purchases */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-violet-50/50 rounded-2xl p-4 sm:p-5 border border-violet-100 shadow-sm shadow-violet-100/20 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <TrendingUp className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-violet-900/60">
                      Today&apos;s Purchases
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-violet-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-black text-violet-950 wrap-break-word">
                      {formatCurrency(stats?.todaysPurchasesAmount || 0)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs font-medium mt-1 text-violet-700/80">
                    {stats?.todaysPurchasesCount || 0} purchase(s) today
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100 shadow-sm w-fit">
              {[
                {
                  id: "activity" as const,
                  label: "Activity",
                  icon: ClipboardList,
                },
                { id: "medicines" as const, label: "Medicines", icon: Pill },
                {
                  id: "purchases" as const,
                  label: "Purchases",
                  icon: TrendingUp,
                },
                { id: "sales" as const, label: "Sales", icon: ShoppingCart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "bg-fnh-navy text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
              {/* Search Input */}
              <div className="flex-1 min-w-[180px] sm:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "activity" ? "medicines" : activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-all"
                />
              </div>

              {/* Manage Dropdown */}
              <ManageDropdown openModal={openModal} />

              {(filters.search || filters.groupId || filters.lowStockOnly) && (
                <button
                  onClick={() => {
                    resetFilters();
                    setSearchTerm("");
                  }}
                  className="px-3 py-2 text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Content Area - Data Tables */}
          <div className="px-1 sm:px-2 lg:px-4 pb-10">
            {activeTab === "activity" && <ActivityTable />}
            {activeTab === "medicines" && <MedicineTable />}
            {activeTab === "purchases" && <PurchaseTable />}
            {activeTab === "sales" && <SaleTable />}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPurchaseModal
        isOpen={activeModal === "addPurchase"}
        onClose={closeModal}
      />
      <AddSaleModal isOpen={activeModal === "addSale"} onClose={closeModal} />
      <AddMedicineModal
        isOpen={activeModal === "addMedicine"}
        onClose={closeModal}
      />
      <AddCompanyModal
        isOpen={activeModal === "addCompany"}
        onClose={closeModal}
        initialName={(modalData?.name as string) || ""}
      />
      <AddGroupModal
        isOpen={activeModal === "addGroup"}
        onClose={closeModal}
        initialName={(modalData?.name as string) || ""}
      />
    </div>
  );
};

export default MedicineInventoryPage;
