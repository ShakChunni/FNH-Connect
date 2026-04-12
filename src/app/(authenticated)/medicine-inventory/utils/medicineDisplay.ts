interface MedicineNameFields {
  genericName: string;
  brandName?: string | null;
}

const normalize = (value?: string | null) => value?.trim() || "";

export function getMedicineDisplayName(medicine: MedicineNameFields): string {
  const medicineName = normalize(medicine.brandName);
  return medicineName || medicine.genericName;
}

export function getMedicineGenericSubtitle(
  medicine: MedicineNameFields,
): string | null {
  const medicineName = normalize(medicine.brandName);
  const genericName = medicine.genericName.trim();

  if (!medicineName) {
    return null;
  }

  return medicineName.toLowerCase() === genericName.toLowerCase()
    ? null
    : genericName;
}
