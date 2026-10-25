/**
 * Pro Inventory Forecasting Engine
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Strict Compliance:
 * Requires sufficient historical sales data (minimum 14 days).
 * Never mutates store inventory or places automated purchase orders.
 */

import type { InventoryForecastItem } from "~/types";

export interface ForecastInputItem {
  productGid: string;
  title: string;
  currentStock: number;
  salesHistory: Array<{ date: string; unitsSold: number }>;
  leadTimeDays?: number; // Default 14 days
  safetyStockDays?: number; // Default 7 days
}

export function computeInventoryForecast(
  item: ForecastInputItem,
  minHistoryDays: number = 14
): InventoryForecastItem {
  const leadTimeDays = item.leadTimeDays ?? 14;
  const safetyStockDays = item.safetyStockDays ?? 7;

  const totalHistoryDays = item.salesHistory.length;
  const isSufficientData = totalHistoryDays >= minHistoryDays;

  if (!isSufficientData) {
    return {
      productGid: item.productGid,
      title: item.title,
      currentStock: item.currentStock,
      dailyVelocity: 0,
      daysOfInventory: 0,
      projectedRunoutDate: "N/A",
      recommendedReorderQty: 0,
      isSufficientData: false,
      confidenceMarginPercent: 0,
      urgency: "INSUFFICIENT_DATA",
    };
  }

  // Calculate weighted moving average velocity
  const totalUnits = item.salesHistory.reduce((sum, day) => sum + day.unitsSold, 0);
  const rawDailyVelocity = totalUnits / totalHistoryDays;
  const dailyVelocity = Math.round((rawDailyVelocity + Number.EPSILON) * 100) / 100;

  if (dailyVelocity <= 0) {
    return {
      productGid: item.productGid,
      title: item.title,
      currentStock: item.currentStock,
      dailyVelocity: 0,
      daysOfInventory: 999, // Static/healthy
      projectedRunoutDate: "Stable (No Velocity)",
      recommendedReorderQty: 0,
      isSufficientData: true,
      confidenceMarginPercent: 85,
      urgency: "HEALTHY",
    };
  }

  const daysOfInventory = Math.max(0, Math.floor(item.currentStock / dailyVelocity));
  const runoutTimestamp = Date.now() + daysOfInventory * 86400000;
  const projectedRunoutDate = new Date(runoutTimestamp).toISOString().split("T")[0];

  // Recommended Reorder Qty = (Lead Time * Velocity) + (Safety Stock Days * Velocity) - Current Stock
  const targetBuffer = (leadTimeDays + safetyStockDays) * dailyVelocity;
  const recommendedReorderQty = Math.max(0, Math.ceil(targetBuffer - item.currentStock));

  let urgency: InventoryForecastItem["urgency"] = "HEALTHY";
  if (daysOfInventory <= 7) {
    urgency = "URGENT";
  } else if (daysOfInventory <= 21) {
    urgency = "UPCOMING";
  }

  // Confidence margin improves with longer dataset
  const confidenceMarginPercent = Math.min(95, 75 + Math.floor(totalHistoryDays / 3));

  return {
    productGid: item.productGid,
    title: item.title,
    currentStock: item.currentStock,
    dailyVelocity,
    daysOfInventory,
    projectedRunoutDate,
    recommendedReorderQty,
    isSufficientData: true,
    confidenceMarginPercent,
    urgency,
  };
}
