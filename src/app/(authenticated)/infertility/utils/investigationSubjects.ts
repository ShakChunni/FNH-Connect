export type EditableInvestigationSubjectType = "PATIENT" | "SPOUSE";

export interface InvestigationSubjectCardData {
  type: EditableInvestigationSubjectType;
  title: string;
  relationLabel: string;
  displayName: string;
  detailLine: string;
  helperText: string;
  isAvailable: boolean;
}

function calculateAgeFromDateOfBirth(
  dateOfBirth: Date | string | null | undefined,
): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const parsedDate =
    dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - parsedDate.getFullYear();
  const monthDifference = now.getMonth() - parsedDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && now.getDate() < parsedDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function buildDetailLine(
  gender: string | null | undefined,
  age: number | null,
  phoneNumber?: string | null,
): string {
  const details = [
    gender?.trim() || null,
    age !== null ? `${age} yrs` : null,
    phoneNumber?.trim() || null,
  ].filter((value): value is string => Boolean(value));

  return details.length > 0 ? details.join(" • ") : "Details not available";
}

export function buildInvestigationSubjectCards(input: {
  patientName: string;
  patientGender?: string | null;
  patientAge?: number | null;
  patientDateOfBirth?: Date | string | null;
  patientPhone?: string | null;
  spouseName?: string | null;
  spouseGender?: string | null;
  spouseAge?: number | null;
  spouseDateOfBirth?: Date | string | null;
  spousePhone?: string | null;
}): {
  patient: InvestigationSubjectCardData;
  spouse: InvestigationSubjectCardData;
} {
  const resolvedPatientAge =
    input.patientAge ?? calculateAgeFromDateOfBirth(input.patientDateOfBirth);
  const resolvedSpouseAge =
    input.spouseAge ?? calculateAgeFromDateOfBirth(input.spouseDateOfBirth);

  const patientName = input.patientName.trim();
  const spouseName = input.spouseName?.trim() || "";

  return {
    patient: {
      type: "PATIENT",
      title: "Patient Investigations",
      relationLabel: "Patient",
      displayName: patientName || "Patient name not recorded",
      detailLine: buildDetailLine(
        input.patientGender,
        resolvedPatientAge,
        input.patientPhone,
      ),
      helperText: "Order tests for the registered infertility patient.",
      isAvailable: patientName.length > 0,
    },
    spouse: {
      type: "SPOUSE",
      title: "Spouse Investigations",
      relationLabel: "Spouse",
      displayName: spouseName || "Spouse name not recorded yet",
      detailLine: buildDetailLine(
        input.spouseGender,
        resolvedSpouseAge,
        input.spousePhone,
      ),
      helperText: spouseName
        ? "Order tests for the husband or partner under the same case."
        : "Enter spouse details first, then order spouse-specific tests.",
      isAvailable: spouseName.length > 0,
    },
  };
}
