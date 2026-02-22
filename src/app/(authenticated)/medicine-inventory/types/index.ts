import { z } from "zod";

// ============================================
// Medicine Group Types
// ============================================

export interface MedicineGroup {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    medicines: number;
  };
}

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// ============================================
// Medicine Company Types
// ============================================

export interface MedicineCompany {
  id: number;
  name: string;
  address?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    purchases: number;
  };
}

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  address: z.string().max(500).optional(),
  phoneNumber: z.string().max(50).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

// ============================================
// Medicine Types
// ============================================

export interface Medicine {
  id: number;
  genericName: string;
  brandName?: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  defaultSalePrice: number;
  currentStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  group: {
    id: number;
    name: string;
  };
}

export const createMedicineSchema = z.object({
  genericName: z.string().min(1, "Generic name is required").max(200),
  brandName: z.string().max(200).optional(),
  groupId: z.number().int().positive("Group is required"),
  strength: z.string().max(50).optional(),
  dosageForm: z.string().max(50).optional(),
  defaultSalePrice: z
    .number()
    .min(0, "Default sale price cannot be negative")
    .default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;

// ============================================
// Purchase Types
// ============================================

export interface MedicinePurchase {
  id: number;
  invoiceNumber: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  purchaseDate: string;
  expiryDate?: string | null;
  batchNumber?: string | null;
  remainingQty: number;
  createdAt: string;
  company: {
    id: number;
    name: string;
  };
  medicine: {
    id: number;
    genericName: string;
    brandName?: string | null;
    group: {
      id: number;
      name: string;
    };
  };
}

export const createPurchaseSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required").max(100),
  companyId: z.number().int().positive("Company is required"),
  medicineId: z.number().int().positive("Medicine is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  purchaseDate: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().max(100).optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

// ============================================
// Sale Types
// ============================================

export interface MedicineSale {
  id: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  createdAt: string;
  patient: {
    id: number;
    fullName: string;
    phoneNumber?: string | null;
  };
  medicine: {
    id: number;
    genericName: string;
    brandName?: string | null;
    group: {
      id: number;
      name: string;
    };
  };
  purchase: {
    id: number;
    invoiceNumber: string;
    batchNumber?: string | null;
    company: {
      id: number;
      name: string;
    };
  };
}

export const createSaleSchema = z.object({
  patientId: z.number().int().positive("Patient ID is required"),
  medicineId: z.number().int().positive("Medicine is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive").optional(),
  saleDate: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

// ============================================
// Stats Types
// ============================================

export interface MedicineInventoryStats {
  totalMedicines: number;
  lowStockCount: number;
  todaysSalesAmount: number;
  todaysSalesCount: number;
  todaysPurchasesAmount: number;
  todaysPurchasesCount: number;
  totalStockValue: number;
}

export interface LowStockItem {
  id: number;
  genericName: string;
  brandName?: string | null;
  currentStock: number;
  lowStockThreshold: number;
  group: {
    name: string;
  };
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Filter Types
// ============================================

export interface MedicineFilters {
  search?: string;
  groupId?: number | null;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PurchaseFilters {
  search?: string;
  companyId?: number | null;
  medicineId?: number | null;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SaleFilters {
  search?: string;
  patientId?: number | null;
  medicineId?: number | null;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================
// Modal Types
// ============================================

export type ModalType =
  | "addMedicine"
  | "editMedicine"
  | "addGroup"
  | "addCompany"
  | "addPurchase"
  | "addSale"
  | null;

export type TabType = "activity" | "medicines" | "purchases" | "sales";
