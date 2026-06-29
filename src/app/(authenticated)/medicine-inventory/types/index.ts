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

export const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

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
  brandName: z.string().min(1, "Medicine name is required").max(200),
  genericName: z.string().min(1, "Generic name is required").max(200),
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

export const updateMedicineSchema = z.object({
  brandName: z.string().min(1, "Medicine name is required").max(200),
  genericName: z.string().min(1, "Generic name is required").max(200),
  groupId: z.number().int().positive("Group is required"),
  strength: z.string().max(50).optional(),
  dosageForm: z.string().max(50).optional(),
  defaultSalePrice: z
    .number()
    .min(0, "Default sale price cannot be negative")
    .default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>;

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

export const createPurchaseItemSchema = z.object({
  medicineId: z.number().int().positive("Medicine is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Purchase price must be positive"),
  salePrice: z.number().positive("Sale price must be positive"),
  expiryDate: z.string().optional(),
  batchNumber: z.string().max(100).optional(),
});

export const createPurchaseSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required").max(100),
  companyId: z.number().int().positive("Company is required"),
  purchaseDate: z.string().optional(),
  items: z
    .array(createPurchaseItemSchema)
    .min(1, "At least one medicine is required")
    .max(100, "A single invoice can contain up to 100 medicines"),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type CreatePurchaseItemInput = z.infer<typeof createPurchaseItemSchema>;

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
  admissionId?: number | null;
  admission?: {
    id: number;
    admissionNumber: string;
  } | null;
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
// Multi-Item Batch Sale (new — pharmacist direct cart)
// ============================================

export const createSaleBatchItemSchema = z.object({
  medicineId: z.number().int().positive("Medicine is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

export const createSaleBatchSchema = z.object({
  patientId: z.number().int().positive("Patient ID is required"),
  saleDate: z.string().datetime({ offset: true }).optional(),
  items: z
    .array(createSaleBatchItemSchema)
    .min(1, "At least one medicine is required")
    .max(100, "A single cart can contain up to 100 medicines"),
});

export type CreateSaleBatchInput = z.infer<typeof createSaleBatchSchema>;
export type CreateSaleBatchItemInput = z.infer<typeof createSaleBatchItemSchema>;

export interface CreateSaleBatchResult {
  patientId: number;
  logicalItemCount: number;
  fifoSaleRowCount: number;
  totalQuantity: number;
  totalAmount: number;
  sales: MedicineSale[];
}

export interface SalePatientOption {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  gender: string;
  guardianName: string | null;
  address: string | null;
  email: string | null;
  matchedAdmissionNumber?: string | null;
}

export interface GyneAdmissionContext {
  admissionId: number;
  admissionNumber: string;
  status: string;
  dateAdmitted: string;
  departmentId: number;
  departmentName: string;
  hasLucsPackage: boolean;
}

// ============================================
// Stats Types
// ============================================

export interface MedicineInventoryStats {
  totalMedicines: number;
  lowStockCount: number;
  totalSalesAmount: number;
  totalSalesCount: number;
  totalPurchasesAmount: number;
  totalPurchasesCount: number;
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
// Report Types
// ============================================

export interface ReportMedicine {
  id: number;
  genericName: string;
  brandName?: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  defaultSalePrice: number;
  currentStock: number;
  lowStockThreshold: number;
  group: {
    id: number;
    name: string;
  };
}

export interface MedicineInventoryReport {
  stats: MedicineInventoryStats;
  availableMedicines: ReportMedicine[];
  lowStockMedicines: ReportMedicine[];
  purchases: MedicinePurchase[];
  sales: MedicineSale[];
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
  startDate?: string;
  endDate?: string;
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
  | "editGroup"
  | "addCompany"
  | "editCompany"
  | "addPurchase"
  | "addSale"
  | null;

export type TabType =
  | "activity"
  | "purchases"
  | "sales"
  | "medicines"
  | "groups"
  | "companies";
