/**
 * General Admission Hooks Index
 * Central export point for all admission-related hooks
 */

// Data fetching hooks
export { useFetchAdmissions } from "./useFetchAdmissions";
export { useFetchDepartments } from "./useFetchDepartments";
export { useFetchDoctors } from "./useFetchDoctors";
export { useFetchHospitalInformation } from "./useFetchHospitalInformation";
export { useFetchPatients } from "./useFetchPatients";

// Mutation hooks
export { useAddAdmissionData } from "./useAddAdmissionData";
export { useEditAdmissionData } from "./useEditAdmissionData";

// UI/Utility hooks
export { useAdmissionScrollSpy } from "./useAdmissionScrollSpy";
