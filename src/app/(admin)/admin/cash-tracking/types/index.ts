export interface AdminShift {
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
  _count: {
    payments: number;
    cashMovements: number;
  };
}

export interface CashTrackingSummary {
  totalCollected: number;
  totalRefunded: number;
  activeShiftsCount: number;
}

export interface CashTrackingData {
  shifts: AdminShift[];
  summary: CashTrackingSummary;
}

export interface CashMovementDetail {
  id: number;
  shiftId: number;
  amount: number;
  movementType: string;
  description: string | null;
  timestamp: string;
  paymentId: number | null;
  payment?: {
    receiptNumber: string;
    patientAccount: {
      patient: {
        id: number;
        fullName: string;
        phoneNumber: string;
      };
    };
    paymentAllocations?: Array<{
      allocatedAmount: number;
      serviceCharge: {
        serviceName: string;
        serviceType: string;
        department: {
          id: number;
          name: string;
        };
        admission?: {
          doctor?: {
            id: number;
            fullName: string;
          };
        } | null;
        pathologyTest?: {
          doctor?: {
            id: number;
            fullName: string;
          };
        } | null;
      };
    }>;
  };
}

export interface DetailedShift extends AdminShift {
  cashMovements: CashMovementDetail[];
}
