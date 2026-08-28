/**
 * User Management Hooks - Barrel Export
 */

// Data fetching hooks
export { useFetchUsers } from "./useFetchUsers";
export { useFetchUserStats } from "./useFetchUserStats";
export { useFetchAvailableStaff } from "./useFetchAvailableStaff";
export { useFetchAllStaff } from "./useFetchAllStaff";
export { useFetchStandaloneStaff } from "./useFetchStandaloneStaff";

// Mutation hooks
export { useAddUserData } from "./useAddUserData";
export { useAddStaffData } from "./useAddStaffData";
export { useUpdateUserData } from "./useUpdateUserData";
export { useUpdateStaffData } from "./useUpdateStaffData";
export { useArchiveStaffData } from "./useArchiveStaffData";
export { useDeleteStaffData } from "./useDeleteStaffData";
export { useArchiveUserData } from "./useArchiveUserData";
export { useResetPasswordData } from "./useResetPasswordData";


