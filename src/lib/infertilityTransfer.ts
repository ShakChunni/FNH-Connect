export const GENERAL_TO_INFERTILITY_TRANSFER_MARKER =
  "[Transferred to HSI Center case";

export function hasTransferredToInfertilityMarker(
  value: string | null | undefined,
): boolean {
  return value?.includes(GENERAL_TO_INFERTILITY_TRANSFER_MARKER) ?? false;
}
