export interface CashTrackingSummary {
  totalCollected: number;
  totalRefunded: number;
  activeShiftsCount: number;
}

export interface CashTrackingStaffOption {
  id: number;
  fullName: string;
  role: string;
}

export interface CashTrackingFilterOptions {
  staff: CashTrackingStaffOption[];
}

export interface CashTrackingShift {
  id: number;
  staffId: number;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
  openingCash: number;
  closingCash: number;
  systemCash: number;
  variance: number;
  totalCollected: number;
  totalRefunded: number;
  notes: string | null;
  staff: {
    id: number;
    fullName: string;
    role: string;
  };
  paymentsCount: number;
  cashMovementsCount: number;
}

export interface CashTrackingData {
  shifts: CashTrackingShift[];
  summary: CashTrackingSummary;
  filterOptions: CashTrackingFilterOptions;
}

export interface PaymentAllocationDetail {
  allocatedAmount: number;
  serviceCharge: {
    serviceName: string;
    serviceType: string;
  };
}

export interface PaymentDetail {
  id: number;
  amount: number;
  receiptNumber: string;
  paymentDate: string;
  patientAccount: {
    patient: {
      id: number;
      fullName: string;
      phoneNumber: string | null;
    };
  };
  paymentAllocations: PaymentAllocationDetail[];
}

export interface CashMovementDetail {
  id: number;
  amount: number;
  movementType: string;
  description: string | null;
  timestamp: string;
  payment: {
    id: number;
    amount: number;
    receiptNumber: string;
    patientAccount: {
      patient: {
        id: number;
        fullName: string;
        phoneNumber: string | null;
      };
    };
  } | null;
}

export interface DetailedShift {
  id: number;
  staffId: number;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
  openingCash: number;
  closingCash: number;
  systemCash: number;
  variance: number;
  totalCollected: number;
  totalRefunded: number;
  notes: string | null;
  staff: {
    id: number;
    fullName: string;
    role: string;
    phoneNumber: string | null;
  };
  cashMovements: CashMovementDetail[];
  payments: PaymentDetail[];
}
