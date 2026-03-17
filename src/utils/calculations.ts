import { LineItem } from "../types/pr.types";

export const calculateItemTotal = (quantity: number, unitPrice: number, taxRate: number): number => {
  const subtotal = quantity * unitPrice;
  const taxAmount = subtotal * (taxRate / 100);
  return subtotal + taxAmount;
};

export const calculatePRSummary = (items: LineItem[]) => {
  return items.reduce(
    (acc, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const tax = subtotal * (item.taxRate / 100);
      return {
        subtotal: acc.subtotal + subtotal,
        tax: acc.tax + tax,
        total: acc.total + item.total,
      };
    },
    { subtotal: 0, tax: 0, total: 0 }
  );
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
