/**
 * Currency and Decimal-Safe Money Formatting Utilities
 * Storeanalysis - Pranshu Singh Baghel
 */

/**
 * Format a numeric amount into a standardized currency string with locale awareness.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency: string = "INR",
  locale: string = "en-IN"
): string {
  if (amount == null || isNaN(amount)) {
    return currency === "INR" ? "₹0.00" : "$0.00";
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Safe round to 2 decimal places to avoid floating point drift.
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate percentage delta with safe zero handling.
 * Returns percentage (e.g., +15.5 or -8.2).
 */
export function calculateDeltaPercent(current: number, prior: number): number {
  if (prior === 0) {
    return current > 0 ? 100 : 0;
  }
  const delta = ((current - prior) / prior) * 100;
  return Math.round((delta + Number.EPSILON) * 10) / 10;
}
