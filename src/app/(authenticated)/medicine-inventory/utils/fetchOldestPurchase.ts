import { api } from "@/lib/axios";

interface OldestPurchaseApiResponse {
  success: boolean;
  data: {
    id: number;
    company: { name: string };
  } | null;
  error?: string;
}

/**
 * Fetch the oldest purchase (FIFO) company for a medicine.
 * Used by the sale form to preview which company batch stock
 * will be consumed from. Failures are silent — the FIFO preview
 * is informational only; the server performs the actual deduction.
 */
export async function fetchOldestPurchase(
  medicineId: number,
): Promise<string | null> {
  try {
    const response = await api.get<OldestPurchaseApiResponse>(
      `/medicine-inventory/medicines/${medicineId}/oldest-purchase`,
    );
    if (response.data.success && response.data.data) {
      return response.data.data.company.name;
    }
  } catch {
    // best-effort
  }
  return null;
}
