import { strict as assert } from "node:assert";
import { isGynecologyDepartment } from "../src/lib/departmentRecognition";
import { MEDICINE_PACKAGE_TEMPLATES } from "../src/lib/medicinePackageTemplates";
import { useSaleFormStore } from "../src/app/(authenticated)/medicine-inventory/stores/saleFormStore";
import { useAdmissionFormStore } from "../src/app/(authenticated)/general-admission/stores/formStore";
import type { AdmissionMedicineChargeItem } from "../src/app/(authenticated)/general-admission/types";

function saleMedicine(id: number, name: string) {
  return {
    id,
    genericName: name,
    brandName: null,
    currentStock: 20,
    lowStockThreshold: 5,
    defaultSalePrice: 12,
    group: { id: 1, name: "Test Group" },
  };
}

function packageRow(medicineId: number, quantity: number) {
  return {
    medicineId,
    medicineName: `Medicine ${medicineId}`,
    genericName: `Medicine ${medicineId}`,
    groupName: "Test Group",
    companyName: "Test Company",
    currentStock: 20,
    lowStockThreshold: 5,
    quantity,
    unitPrice: 12,
    requestedMedicineName: null,
    operationName: "LUCS",
    packageCode: "LUCS_OT_MEDICINE",
    matchReason: "test",
  };
}

function admissionMedicine(): AdmissionMedicineChargeItem {
  return {
    clientId: "admission-test",
    medicineId: 1,
    packageCode: null,
    operationName: "Manual",
    requestedMedicineName: null,
    medicineName: "Test medicine",
    genericName: "Test medicine",
    groupName: "Test Group",
    companyName: "Test Company",
    quantity: 2,
    unitPrice: 50,
    totalAmount: 100,
    currentStock: 20,
    defaultSalePrice: 50,
    isMatched: true,
  };
}

function run(): void {
  assert.equal(isGynecologyDepartment("Gynecology"), true);
  assert.equal(isGynecologyDepartment("Obstetrics"), true);
  assert.equal(isGynecologyDepartment("Cardiology"), false);

  const lucs = MEDICINE_PACKAGE_TEMPLATES.find(
    (template) => template.code === "LUCS_OT_MEDICINE",
  );
  assert.ok(lucs);
  assert.ok(lucs.items.length > 0);

  const saleStore = useSaleFormStore.getState();
  saleStore.resetForm();
  saleStore.appendBlankRow();
  let rows = useSaleFormStore.getState().formData.items;
  const firstRowId = rows[0].clientId;
  useSaleFormStore
    .getState()
    .setMedicineForRow(firstRowId, saleMedicine(1, "First"));

  useSaleFormStore.getState().appendBlankRow();
  rows = useSaleFormStore.getState().formData.items;
  const secondRowId = rows.find((row) => row.medicineId === null)?.clientId;
  assert.ok(secondRowId);
  useSaleFormStore
    .getState()
    .setMedicineForRow(secondRowId, saleMedicine(1, "First"));

  rows = useSaleFormStore.getState().formData.items;
  assert.equal(rows.length, 1, "duplicate manual selection must merge");
  assert.equal(rows[0].quantity, 2, "merged manual quantity must be additive");

  useSaleFormStore.getState().applyPackage([
    packageRow(2, 1),
    packageRow(2, 2),
  ]);
  rows = useSaleFormStore.getState().formData.items;
  assert.equal(rows.length, 2, "duplicate package matches must merge");
  assert.equal(
    rows.find((row) => row.medicineId === 2)?.quantity,
    3,
    "package quantities must be additive",
  );
  assert.ok(
    rows.some((row) => row.medicineId === 1),
    "applying LUCS must preserve manual rows",
  );

  const admissionStore = useAdmissionFormStore.getState();
  admissionStore.resetForm();
  useAdmissionFormStore.getState().calculateTotals();
  const baseline = useAdmissionFormStore.getState().financialData.totalAmount;
  useAdmissionFormStore.getState().setMedicineChargeItems([
    admissionMedicine(),
  ]);
  assert.equal(
    useAdmissionFormStore.getState().financialData.medicineCharge,
    0,
    "inventory-only mode must keep medicineCharge at zero",
  );
  assert.equal(
    useAdmissionFormStore.getState().financialData.totalAmount,
    baseline,
    "inventory-only medicine rows must not change admission total",
  );

  useAdmissionFormStore.getState().setMedicineBillingEnabled(true);
  assert.equal(
    useAdmissionFormStore.getState().financialData.medicineCharge,
    100,
    "legacy mode must restore itemized medicine billing",
  );
  assert.equal(
    useAdmissionFormStore.getState().financialData.totalAmount,
    baseline + 100,
    "legacy medicine value must be included in admission total",
  );

  useSaleFormStore.getState().resetForm();
  useAdmissionFormStore.getState().resetForm();
  console.log("Medicine sale and admission billing validation passed.");
}

run();
