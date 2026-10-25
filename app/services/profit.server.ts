/**
 * Qualified Profit & Gross Margin Analysis Service
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Strict Compliance Note:
 * This calculates Qualified Profit Estimates using available variant unit costs (COGS).
 * It never labels estimates as "Net Profit" and explicitly disclaims omitted operational expenses.
 */

import { roundCurrency } from "~/utils/money";

export interface ProfitEstimateResult {
  totalRevenue: number;
  totalCostOfGoodsSold: number;
  qualifiedEstimatedGrossProfit: number;
  qualifiedGrossMarginPercent: number;
  hasReliableCostData: boolean;
  coveragePercent: number; // % of sold items with documented unit cost
  disclaimer: string;
  excludedExpenses: string[];
}

export function calculateQualifiedProfitEstimate(
  lineItems: Array<{
    quantity: number;
    salePrice: number;
    unitCost?: number | null;
  }>
): ProfitEstimateResult {
  let totalRevenue = 0;
  let totalCOGS = 0;
  let itemsWithCost = 0;
  let totalItemsCount = 0;

  for (const item of lineItems) {
    totalItemsCount += item.quantity;
    const itemRev = item.quantity * item.salePrice;
    totalRevenue += itemRev;

    if (item.unitCost != null && item.unitCost > 0) {
      totalCOGS += item.quantity * item.unitCost;
      itemsWithCost += item.quantity;
    }
  }

  const coveragePercent =
    totalItemsCount > 0 ? Math.round((itemsWithCost / totalItemsCount) * 100) : 0;
  const hasReliableCostData = coveragePercent >= 50; // At least 50% items have cost data
  const grossProfit = roundCurrency(totalRevenue - totalCOGS);
  const grossMargin =
    totalRevenue > 0 ? Math.round(((grossProfit / totalRevenue) * 100) * 10) / 10 : 0;

  return {
    totalRevenue: roundCurrency(totalRevenue),
    totalCostOfGoodsSold: roundCurrency(totalCOGS),
    qualifiedEstimatedGrossProfit: grossProfit,
    qualifiedGrossMarginPercent: grossMargin,
    hasReliableCostData,
    coveragePercent,
    disclaimer:
      "Qualified Gross Margin Estimate based solely on recorded Shopify variant unit costs. Does NOT represent Net Profit.",
    excludedExpenses: [
      "Digital advertising & marketing acquisition costs",
      "Shopify subscription & payment gateway processing fees",
      "Warehouse storage & packaging materials",
      "Carrier shipping surcharges & return logistics",
      "Salaries, taxes, and general operational overhead",
    ],
  };
}
