/**
 * Storeanalysis Shared TypeScript Types
 * Created by Pranshu Singh Baghel
 */

export type PlanTier = "Free" | "Basic" | "Pro";

export interface PlanFeatureLimits {
  tier: PlanTier;
  priceUSD: number;
  priceINR: number;
  historyDays: number;
  hasSalesReports: boolean;
  hasProductAnalytics: boolean;
  hasLowStockAlerts: boolean;
  hasAdvancedAnalytics: boolean;
  hasProfitEstimates: boolean;
  hasInventoryForecasting: boolean;
}

export interface MetricSummary {
  grossSales: number;
  netSales: number;
  orderCount: number;
  averageOrderValue: number;
  totalRefunds: number;
  totalDiscounts: number;
  totalTaxes: number;
  totalShipping: number;
  currency: string;
  // Prior period comparisons (% change)
  grossSalesDelta: number;
  netSalesDelta: number;
  orderCountDelta: number;
  aovDelta: number;
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  grossSales: number;
  netSales: number;
  orderCount: number;
}

export interface ProductPerformanceItem {
  id: string;
  productGid: string;
  title: string;
  handle?: string;
  vendor?: string;
  productType?: string;
  unitsSold: number;
  revenue: number;
  stockLevel: number;
  unitCost?: number;
  estimatedGrossMargin?: number; // Pro qualified estimate
  velocityClassification: "BEST_SELLER" | "MODERATE" | "SLOW_MOVING";
}

export interface LowStockItem {
  id: string;
  inventoryItemGid: string;
  variantGid?: string;
  sku?: string;
  title: string;
  locationName?: string;
  availableQuantity: number;
  reorderThreshold: number;
  status: "CRITICAL" | "LOW" | "ADEQUATE" | "OUT_OF_STOCK";
}

export interface OrderListItem {
  id: string;
  orderGid: string;
  orderNumber: string;
  processedAt: string;
  customerName: string; // Anonymized or basic display
  totalPrice: number;
  currency: string;
  financialStatus: "PAID" | "PENDING" | "REFUNDED" | "PARTIALLY_REFUNDED" | "VOIDED";
  fulfillmentStatus: "FULFILLED" | "UNFULFILLED" | "PARTIALLY_FULFILLED";
  lineItemCount: number;
}

export interface InventoryForecastItem {
  productGid: string;
  title: string;
  currentStock: number;
  dailyVelocity: number;
  daysOfInventory: number;
  projectedRunoutDate: string;
  recommendedReorderQty: number;
  isSufficientData: boolean;
  confidenceMarginPercent: number;
  urgency: "URGENT" | "UPCOMING" | "HEALTHY" | "INSUFFICIENT_DATA";
}

export interface DateRangeOption {
  key: "today" | "7d" | "30d" | "90d" | "this_month" | "last_month";
  label: string;
  days: number;
}
