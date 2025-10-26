# FNH Connect Cash Flow & Accountability System

## Overview

The FNH Connect cash flow system provides complete financial accountability and audit trails for healthcare service payments. It tracks every rupee collected, who collected it, when it was collected, and how it was allocated across different services.

**Key Principle**: Staff accountability without logout resets. Every transaction is immutable and linked to a specific person and shift.

---

## Core Models & Their Relationships

### 1. **Shift** - Staff Work Session & Cash Management
The foundation of cash tracking. Every staff member opens a shift when starting work and closes it when finishing.

```prisma
model Shift {
  id                 Int       @id
  staffId            Int       // Who owns this shift
  startTime          DateTime
  endTime            DateTime?
  isActive           Boolean   @default(true)
  
  // Cash reconciliation (THE HEART OF ACCOUNTABILITY)
  openingCash        Decimal   // Physical cash when shift started
  closingCash        Decimal   // Physical cash when shift ended
  systemCash         Decimal   // Sum of all payments collected in shift
  variance           Decimal   // closingCash - systemCash (should be 0)
  
  // Collection summary
  totalCollected     Decimal   // Total amount collected in shift
  totalRefunded      Decimal   // Total refunds given in shift
  
  // Reconciliation audit trail
  notes              String?
  reconciledAt       DateTime?
  reconciledBy       Int?      // Who approved the reconciliation
  reconciledNotes    String?
  varianceResolution String?   // How discrepancy was handled
  
  // Relations
  staff              Staff
  payments           Payment[]
  cashMovements      CashMovement[]
}
```

**Use Cases**:
- Staff opens shift with opening cash (e.g., 5000 rupees)
- System tracks all payments collected throughout shift
- At end of shift: staff counts physical cash, records closing amount
- System calculates: systemCash = sum of all payments
- Variance = closingCash - systemCash (should be ~0)
- Reconciliation manager reviews and approves/flags variance

---

### 2. **Payment** - Individual Payment Transaction
When a patient or relative pays money, a Payment record is created linking to the patient's account.

```prisma
model Payment {
  id               Int      @id
  patientAccountId Int      // Which patient's account this belongs to
  amount           Decimal
  paymentMethod    String   // "Cash", "Card", "Cheque", etc.
  paymentDate      DateTime @default(now())
  collectedById    Int      // Staff who collected the money
  shiftId          Int      // Which shift this payment belongs to
  
  receiptNumber    String   @unique  // For patient receipt
  notes            String?
  
  // Relations
  patientAccount      PatientAccount
  collector           Staff        // Who collected it
  shift               Shift        // Which shift
  paymentAllocations  PaymentAllocation[]  // How this payment is split
  cashMovements       CashMovement[]       // Audit trail of this payment
}
```

**Example Flow**:
```
Patient Rajesh pays 15,000 for hospital admission
→ Payment record created:
  - patientAccountId: 123
  - amount: 15000
  - collectedById: 5 (Nurse Sarah)
  - shiftId: 42 (Sarah's morning shift)
  - paymentDate: 2025-10-26 10:30
→ CashMovement created: "COLLECTION", 15000, timestamp: 2025-10-26 10:30
→ systemCash incremented in Shift 42
```

---

### 3. **CashMovement** - Granular Audit Trail
Every cash transaction creates a CashMovement record for complete transparency.

```prisma
model CashMovement {
  id            Int      @id
  shiftId       Int
  amount        Decimal
  movementType  String   // "COLLECTION", "REFUND", "TRANSFER", "RECONCILIATION", "CORRECTION"
  description   String?
  timestamp     DateTime @default(now())
  paymentId     Int?     // Link to payment if this is a collection
  notes         String?
  
  // Approval trail
  createdBy     Int      // Staff who recorded it
  approvedBy    Int?     // Staff who approved it
  approvedAt    DateTime?
  
  // Relations
  shift         Shift
  payment       Payment?
}
```

**Movement Types**:
- `COLLECTION`: Patient payment received
- `REFUND`: Money returned to patient
- `TRANSFER`: Cash moved between staff
- `RECONCILIATION`: End-of-shift settlement
- `CORRECTION`: Adjustment for discrepancies

**Example Trail for One Transaction**:
```
CashMovement 1: COLLECTION, 15000, Nurse Sarah, Shift 42, 10:30 AM
  → Patient Rajesh paid for admission

CashMovement 2: ALLOCATION, 10000 to ServiceCharge (admission fee)
  → Payment split across services

CashMovement 3: ALLOCATION, 5000 to ServiceCharge (procedure fee)
  → Remaining amount allocated
```

---

### 4. **ServiceCharge** - Itemized Hospital Services
Different departments/services have different charges. ServiceCharges track what was charged and to whom.

```prisma
model ServiceCharge {
  id               Int      @id
  patientAccountId Int
  serviceType      String   // "ADMISSION_FEE", "PATHOLOGY_TEST", "OPERATION", etc.
  serviceName      String   // "LUCS Operation", "Blood Test Panel A"
  departmentId     Int
  
  // Financial
  originalAmount   Decimal
  discountAmount   Decimal  @default(0)
  finalAmount      Decimal  // What patient owes
  
  serviceDate      DateTime @default(now())
  description      String?
  
  // Collection tracking (NEW - FOR ACCOUNTABILITY)
  collectedByStaffId Int?      // Who collected payment for this service
  collectionTime     DateTime? // When it was collected
  collectionNotes    String?   // Any notes about collection
  
  // Relations
  patientAccount      PatientAccount
  department          Department
  paymentAllocations  PaymentAllocation[]
}
```

**Example**:
```
Patient admitted:
→ ServiceCharge: ADMISSION_FEE, 5000, Gynecology Dept, not yet collected
→ ServiceCharge: SEATRENT, 2000/day, Gynecology Dept, not yet collected
→ ServiceCharge: PROCEDURE_FEE, 8000, Gynecology Dept, not yet collected

When payment received:
→ PaymentAllocation links Payment to ServiceCharges
→ collectionTime & collectedByStaffId updated
→ Now we know Nurse Sarah collected 5000 for admission at 10:30 AM
```

---

### 5. **PatientAccount** - Central Financial Summary
All charges and payments for a patient are aggregated here.

```prisma
model PatientAccount {
  id             Int     @id
  patientId      Int     @unique
  totalCharges   Decimal // Sum of all serviceCharges.finalAmount
  totalPaid      Decimal // Sum of all payments
  totalDue       Decimal // Calculated: totalCharges - totalPaid
  advanceBalance Decimal // If they overpaid
}
```

---

### 6. **PaymentAllocation** - Linking Payments to Services
This junction table shows how each payment is split across different service charges.

```prisma
model PaymentAllocation {
  id              Int     @id
  paymentId       Int
  serviceChargeId Int
  allocatedAmount Decimal
}
```

**Why This Matters**:
```
A patient makes one payment of 15,000 which covers:
→ Admission fee: 5,000
→ Procedure fee: 8,000
→ Medicine charge: 2,000

PaymentAllocation creates three records linking the payment to each service.
This allows you to answer: "Which patient owed for medicines and paid it on which date?"
```

---

## Query Patterns & Examples

### Query 1: Total Collected by Staff Today

```typescript
// Find all payments collected by a specific staff member today
const staffPayments = await prisma.payment.findMany({
  where: {
    collectedById: staffId,
    paymentDate: {
      gte: startOfToday,
      lte: endOfToday,
    },
  },
  include: {
    patientAccount: {
      include: {
        patient: { select: { fullName: true } },
      },
    },
  },
});

const totalCollected = staffPayments.reduce(
  (sum, payment) => sum + payment.amount,
  0
);

console.log(`Nurse Sarah collected: Rs. ${totalCollected} today`);
```

---

### Query 2: Audit Trail for a Single Patient

```typescript
// Complete financial history of a patient
const patientAuditTrail = await prisma.patientAccount.findUnique({
  where: { patientId },
  include: {
    serviceCharges: {
      include: {
        department: true,
        paymentAllocations: {
          include: {
            payment: {
              include: {
                collector: { select: { fullName: true } },
                cashMovements: {
                  orderBy: { timestamp: 'desc' },
                },
              },
            },
          },
        },
      },
      orderBy: { serviceDate: 'desc' },
    },
    payments: {
      include: {
        collector: { select: { fullName: true } },
        shift: true,
      },
      orderBy: { paymentDate: 'desc' },
    },
  },
});

// Result shows every charge, who collected it, when, and how much
```

---

### Query 3: Shift Reconciliation Report

```typescript
// Complete view of a staff member's shift for reconciliation
const shiftReconciliation = await prisma.shift.findUnique({
  where: { id: shiftId },
  include: {
    staff: { select: { fullName: true } },
    payments: {
      include: {
        patientAccount: {
          include: { patient: { select: { fullName: true } } },
        },
      },
    },
    cashMovements: {
      orderBy: { timestamp: 'asc' },
      include: {
        payment: true,
      },
    },
  },
});

// Calculate:
const systemCash = shiftReconciliation.payments.reduce(
  (sum, p) => sum + p.amount,
  0
);

const variance = shiftReconciliation.closingCash - systemCash;

console.log(`
  Staff: ${shiftReconciliation.staff.fullName}
  Shift: ${shiftReconciliation.startTime} - ${shiftReconciliation.endTime}
  
  Opening Cash: Rs. ${shiftReconciliation.openingCash}
  Closing Cash: Rs. ${shiftReconciliation.closingCash}
  System says should have: Rs. ${systemCash}
  Variance: Rs. ${variance} ${variance === 0 ? '✓ Perfect!' : '⚠️ REVIEW'}
`);
```

---

### Query 4: Flag Variance Issues

```typescript
// Find shifts with cash discrepancies for review
const problematicShifts = await prisma.shift.findMany({
  where: {
    reconciliedAt: null, // Not yet reconciled
    isActive: false, // Shift is closed
    // Check if variance is significant
  },
  include: {
    staff: { select: { fullName: true } },
    payments: true,
    cashMovements: true,
  },
});

problematicShifts.forEach((shift) => {
  const systemCash = shift.payments.reduce((sum, p) => sum + p.amount, 0);
  const variance = shift.closingCash - systemCash;
  
  if (Math.abs(variance) > 100) { // > 100 rupees
    console.log(`🚨 VARIANCE ALERT: ${shift.staff.fullName} - Rs. ${variance}`);
    // Queue for manager review
  }
});
```

---

### Query 5: Department Revenue Report

```typescript
// How much was collected per department in a date range
const departmentRevenue = await prisma.serviceCharge.findMany({
  where: {
    serviceDate: {
      gte: startDate,
      lte: endDate,
    },
    paymentAllocations: {
      some: {}, // Only charged items that were allocated payments
    },
  },
  include: {
    department: true,
    paymentAllocations: true,
  },
});

const revenueByDepartment = {};
departmentRevenue.forEach((charge) => {
  const dept = charge.department.name;
  const collected = charge.paymentAllocations.reduce(
    (sum, alloc) => sum + alloc.allocatedAmount,
    0
  );
  
  revenueByDepartment[dept] =
    (revenueByDepartment[dept] || 0) + collected;
});

console.log('Department Revenue Report:', revenueByDepartment);
```

---

### Query 6: Staff Accountability Report

```typescript
// Comprehensive report: who collected what, from whom, when
const staffReport = await prisma.staff.findUnique({
  where: { id: staffId },
  include: {
    collectedPayments: {
      include: {
        patientAccount: {
          include: {
            patient: { select: { fullName: true, phoneNumber: true } },
            serviceCharges: true,
          },
        },
        shift: true,
        paymentAllocations: {
          include: { serviceCharge: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    },
  },
});

// Generate: "Dr. Kumar collected Rs. 1,25,000 from 15 patients this week"
// Breakdown by payment type, service type, department, time of day, etc.
```

---

### Query 7: Patient Owing Analysis

```typescript
// Which patients still owe money and how much
const pendingPayments = await prisma.patientAccount.findMany({
  where: {
    totalDue: {
      gt: 0, // Still owes money
    },
  },
  include: {
    patient: { select: { fullName: true, phoneNumber: true, email: true } },
    serviceCharges: {
      where: {
        // Services not yet paid
        paymentAllocations: {
          none: {}, // No payment allocated
        },
      },
      include: {
        department: true,
      },
    },
  },
  orderBy: { totalDue: 'desc' },
});

// Generate: "Patient X owes Rs. Y for admission, procedure fee, etc. - due since date Z"
```

---

### Query 8: Cash Movement Timeline (Forensic)

```typescript
// Complete timeline of all cash movements in a shift (like a bank statement)
const cashTimeline = await prisma.cashMovement.findMany({
  where: {
    shiftId: shiftId,
  },
  include: {
    payment: {
      include: {
        patientAccount: {
          include: { patient: { select: { fullName: true } } },
        },
        collector: { select: { fullName: true } },
      },
    },
  },
  orderBy: { timestamp: 'asc' },
});

// Output:
// 08:00 AM - OPENING: Rs. 5000 (shift opened)
// 10:15 AM - COLLECTION: Rs. 15,000 (Patient Rajesh, Nurse Sarah) - CashMovement created
// 10:30 AM - ALLOCATION: Rs. 5000 to Admission Fee
// 10:30 AM - ALLOCATION: Rs. 10,000 to Procedure Fee
// 02:00 PM - REFUND: Rs. 500 (change given to Patient Kumar)
// ... etc
// 06:00 PM - CLOSING: Rs. 19,500
```

---

## Key Features & Design Principles

### 1. **Immutability**
Once created, CashMovement records cannot be deleted - only corrected via new CORRECTION movements. This creates permanent audit trail.

### 2. **Approval Chain**
- Staff: Records payment collected
- Collector: Approves at shift end (matches physical cash)
- Manager: Approves variance if discrepancy
- System tracks who approved what and when

### 3. **No Logout Reset**
Unlike old system where logout cleared everything:
- All transactions persist in database
- Variance can be reviewed later
- Historical data never lost
- Complete audit trail for any investigation

### 4. **Real-Time Visibility**
Managers can see live dashboard:
- Cash collected by each staff (today/this week/month)
- Outstanding balances by patient
- Shifts pending reconciliation
- Variance issues requiring review
- Department revenue

### 5. **Automatic Calculations**
System automatically maintains:
- `systemCash = SUM(all payments in shift)`
- `variance = closingCash - systemCash`
- `totalDue = totalCharges - totalPaid`
- `advanceBalance = totalPaid - totalCharges` (if overpaid)

---

## Database Queries for Common Reports

### Monthly Cash Report
```typescript
const monthStart = new Date(2025, 9, 1); // October 2025
const monthEnd = new Date(2025, 10, 0);

const monthlyReport = await prisma.payment.groupBy({
  by: ['collectedById'],
  where: {
    paymentDate: { gte: monthStart, lte: monthEnd },
  },
  _sum: { amount: true },
  _count: true,
  orderBy: { _sum: { amount: 'desc' } },
});

// Result: Each staff member's total collected that month
```

### Variance Analysis
```typescript
const varianceReport = await prisma.shift.findMany({
  where: {
    endTime: { not: null },
    reconciledAt: null, // Pending reconciliation
  },
  include: {
    staff: { select: { fullName: true } },
  },
});

varianceReport.forEach(async (shift) => {
  const payments = await prisma.payment.aggregate({
    where: { shiftId: shift.id },
    _sum: { amount: true },
  });
  
  const variance = shift.closingCash - (payments._sum.amount || 0);
  if (variance !== 0) {
    console.log(`Variance in ${shift.staff.fullName}'s shift: Rs. ${variance}`);
  }
});
```

---

## API Endpoints You Should Create

### 1. POST `/api/shift/open`
Staff opens a shift with opening cash

### 2. POST `/api/payment/collect`
Record payment received from patient

### 3. POST `/api/shift/close`
Staff closes shift, provides closing cash count

### 4. GET `/api/shift/:id/reconcile`
Manager reviews shift for reconciliation

### 5. POST `/api/shift/:id/approve-variance`
Manager approves or flags variance

### 6. GET `/api/reports/staff-daily`
Dashboard view: staff collected today

### 7. GET `/api/reports/patient/:id/audit-trail`
Patient financial history

### 8. GET `/api/reports/department-revenue`
Revenue by department in date range

---

## Example Workflow: Handling a Payment

```typescript
// Step 1: Patient makes payment
const shift = await prisma.shift.findFirst({
  where: { staffId: userId, isActive: true },
});

const payment = await prisma.payment.create({
  data: {
    patientAccountId: 123,
    amount: 15000,
    paymentMethod: "Cash",
    collectedById: userId,
    shiftId: shift.id,
    receiptNumber: `REC-${Date.now()}`,
  },
});

// Step 2: Create cash movement for audit trail
const cashMovement = await prisma.cashMovement.create({
  data: {
    shiftId: shift.id,
    amount: 15000,
    movementType: "COLLECTION",
    paymentId: payment.id,
    timestamp: new Date(),
    createdBy: userId,
    description: `Payment received from Patient #123 - Rs. 15,000`,
  },
});

// Step 3: Allocate payment to service charges
const serviceCharges = await prisma.serviceCharge.findMany({
  where: { patientAccountId: 123 },
});

let remaining = 15000;
for (const charge of serviceCharges) {
  if (remaining <= 0) break;
  
  const allocate = Math.min(charge.finalAmount, remaining);
  
  await prisma.paymentAllocation.create({
    data: {
      paymentId: payment.id,
      serviceChargeId: charge.id,
      allocatedAmount: allocate,
    },
  });
  
  // Mark collection
  await prisma.serviceCharge.update({
    where: { id: charge.id },
    data: {
      collectedByStaffId: userId,
      collectionTime: new Date(),
      collectionNotes: `Collected by ${staffName}`,
    },
  });
  
  remaining -= allocate;
}

// Step 4: Update shift system cash
await prisma.shift.update({
  where: { id: shift.id },
  data: {
    systemCash: {
      increment: 15000,
    },
    totalCollected: {
      increment: 15000,
    },
  },
});

// Step 5: Update patient account totals
await prisma.patientAccount.update({
  where: { id: 123 },
  data: {
    totalPaid: {
      increment: 15000,
    },
    totalDue: {
      decrement: 15000,
    },
  },
});
```

---

## Benefits of This System

✅ **Complete Accountability**: Every rupee tracked to specific person and time
✅ **Variance Detection**: Immediate flag when cash doesn't match system records
✅ **No Data Loss**: Historical records never deleted, only corrected
✅ **Flexible Queries**: Answer any financial question with raw data
✅ **Audit Ready**: Regulatory compliance and forensic analysis possible
✅ **Staff Trust**: Clear records mean staff can prove their collections
✅ **Patient Clarity**: Patients can see exact what they owe and what they paid
✅ **Management Visibility**: Real-time dashboards for operations team

---

## Migration Strategy

When implementing this system:

1. **Phase 1**: Create new Shift/CashMovement/Payment models
2. **Phase 2**: Migrate existing payment data to new structure
3. **Phase 3**: Start tracking new payments with new system
4. **Phase 4**: Implement staff mobile app for shift/payment recording
5. **Phase 5**: Create manager dashboard for reconciliation
6. **Phase 6**: Generate reports for analysis

---

## Summary

The cash flow system is built on **immutable transaction records** linked to **specific people, times, and shifts**. Every payment flows through:

**Patient pays → Payment record created → Cash movement recorded → Allocated to services → Shift cash updated → Patient account updated**

This creates a complete audit trail answerable to: "Who collected Rs. X from Patient Y at what time for which services?"

**Result**: Complete financial accountability without logout resets or data loss.
