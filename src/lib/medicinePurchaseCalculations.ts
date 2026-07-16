export interface MedicinePurchaseLineCalculation {
  quantity: number;
  unitPrice: number;
  vatTax: number;
  discountAmount: number;
}

export const roundMedicineCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateMedicinePurchaseGrossTotal = ({
  quantity,
  unitPrice,
  vatTax,
}: Omit<MedicinePurchaseLineCalculation, "discountAmount">): number =>
  roundMedicineCurrency((unitPrice + vatTax) * quantity);

export const calculateMedicinePurchaseLineTotal = ({
  quantity,
  unitPrice,
  vatTax,
  discountAmount,
}: MedicinePurchaseLineCalculation): number =>
  roundMedicineCurrency(
    Math.max(
      0,
      calculateMedicinePurchaseGrossTotal({ quantity, unitPrice, vatTax }) -
        discountAmount,
    ),
  );
