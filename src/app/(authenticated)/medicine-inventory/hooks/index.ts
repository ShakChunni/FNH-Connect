/**
 * Medicine Inventory Hooks Index
 * Central export point for all medicine inventory-related hooks
 */

// Data fetching hooks
export { useFetchMedicineStats } from "./useFetchMedicineStats";
export { useFetchMedicines } from "./useFetchMedicines";
export { useFetchPurchases } from "./useFetchPurchases";
export { useFetchSales } from "./useFetchSales";
export { useFetchMedicineGroups } from "./useFetchMedicineGroups";
export { useFetchMedicineCompanies } from "./useFetchMedicineCompanies";

// Mutation hooks
export { useAddMedicineData } from "./useAddMedicineData";
export { useAddPurchaseData } from "./useAddPurchaseData";
export { useAddSaleData } from "./useAddSaleData";
export { useAddCompanyData } from "./useAddCompanyData";
export { useAddGroupData } from "./useAddGroupData";
