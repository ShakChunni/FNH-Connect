/**
 * General Admission Components - Barrel Export
 */

// Add/Edit modals
export { default as AddNewDataAdmission } from "./AddNewData/AddNewDataAdmission";
export { default as EditDataAdmission } from "./EditData/EditDataAdmission";

// Table
export { AdmissionTable, AdmissionOverview } from "./PatientTable";

// Search
export { default as AdmissionSearch } from "./AdmissionSearch";

// Filter module
export { Filters, FilterTriggerButton } from "./filter";

// Form sections
export * from "./form-section";
