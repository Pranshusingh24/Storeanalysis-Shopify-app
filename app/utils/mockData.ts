/**
 * Demo and Development Fallback Data
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Used for development preview and onboarding empty development stores.
 * Explicitly marked as demo data to comply with Shopify App Store audit rules.
 */

import type {
  MetricSummary,
  DailyTrendPoint,
  ProductPerformanceItem,
  LowStockItem,
  OrderListItem,
  InventoryForecastItem,
} from "~/types";

export const DEMO_METRIC_SUMMARY: MetricSummary = {
  grossSales: 487500.0,
  netSales: 441200.0,
  orderCount: 312,
  averageOrderValue: 1414.1,
  totalRefunds: 28500.0,
  totalDiscounts: 17800.0,
  totalTaxes: 42100.0,
  totalShipping: 18500.0,
  currency: "INR",
  grossSalesDelta: 14.8,
  netSalesDelta: 12.3,
  orderCountDelta: 8.5,
  aovDelta: 3.5,
};

export function generateDemoTrendPoints(days: number = 30): DailyTrendPoint[] {
  const points: DailyTrendPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();
    // Simulate realistic weekend spikes
    const multiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.35 : 1.0;
    const baseOrders = Math.floor((8 + Math.sin(i) * 3) * multiplier);
    const gross = Math.round(baseOrders * (1350 + Math.cos(i) * 200));
    const net = Math.round(gross * 0.91);

    points.push({
      date: dateStr,
      label: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      grossSales: gross,
      netSales: net,
      orderCount: baseOrders,
    });
  }

  return points;
}

export const DEMO_PRODUCTS: ProductPerformanceItem[] = [
  {
    id: "prod-1",
    productGid: "gid://shopify/Product/1001",
    title: "Organic Cotton Henley Tee - Navy",
    handle: "organic-cotton-henley-navy",
    vendor: "Baghel Essentials",
    productType: "Apparel",
    unitsSold: 94,
    revenue: 139500,
    stockLevel: 14,
    unitCost: 550,
    estimatedGrossMargin: 62.9,
    velocityClassification: "BEST_SELLER",
  },
  {
    id: "prod-2",
    productGid: "gid://shopify/Product/1002",
    title: "Minimalist Slim Leather Wallet",
    handle: "minimalist-slim-leather-wallet",
    vendor: "Storeanalysis Craft",
    productType: "Accessories",
    unitsSold: 78,
    revenue: 97500,
    stockLevel: 8,
    unitCost: 450,
    estimatedGrossMargin: 64.0,
    velocityClassification: "BEST_SELLER",
  },
  {
    id: "prod-3",
    productGid: "gid://shopify/Product/1003",
    title: "Ceramic Matte Coffee Dripper V60",
    handle: "ceramic-matte-coffee-dripper",
    vendor: "Storeanalysis Home",
    productType: "Kitchenware",
    unitsSold: 65,
    revenue: 78000,
    stockLevel: 32,
    unitCost: 400,
    estimatedGrossMargin: 66.7,
    velocityClassification: "BEST_SELLER",
  },
  {
    id: "prod-4",
    productGid: "gid://shopify/Product/1004",
    title: "Stainless Steel Insulated Tumbler 500ml",
    handle: "insulated-tumbler-500ml",
    vendor: "Storeanalysis Home",
    productType: "Drinkware",
    unitsSold: 48,
    revenue: 57600,
    stockLevel: 5,
    unitCost: 500,
    estimatedGrossMargin: 58.3,
    velocityClassification: "MODERATE",
  },
  {
    id: "prod-5",
    productGid: "gid://shopify/Product/1005",
    title: "Vintage Botanical Canvas Tote Bag",
    handle: "vintage-canvas-tote",
    vendor: "Baghel Essentials",
    productType: "Bags",
    unitsSold: 6,
    revenue: 5400,
    stockLevel: 42,
    unitCost: 350,
    estimatedGrossMargin: 61.1,
    velocityClassification: "SLOW_MOVING",
  },
  {
    id: "prod-6",
    productGid: "gid://shopify/Product/1006",
    title: "Copper Plated Measuring Spoons Set",
    handle: "copper-measuring-spoons",
    vendor: "Storeanalysis Home",
    productType: "Kitchenware",
    unitsSold: 3,
    revenue: 3300,
    stockLevel: 68,
    unitCost: 420,
    estimatedGrossMargin: 61.8,
    velocityClassification: "SLOW_MOVING",
  },
];

export const DEMO_LOW_STOCK: LowStockItem[] = [
  {
    id: "inv-1",
    inventoryItemGid: "gid://shopify/InventoryItem/5001",
    variantGid: "gid://shopify/ProductVariant/6001",
    sku: "TUMBLER-BLK-500",
    title: "Stainless Steel Insulated Tumbler 500ml - Matte Black",
    locationName: "Main Warehouse Mumbai",
    availableQuantity: 5,
    reorderThreshold: 15,
    status: "CRITICAL",
  },
  {
    id: "inv-2",
    inventoryItemGid: "gid://shopify/InventoryItem/5002",
    variantGid: "gid://shopify/ProductVariant/6002",
    sku: "WALLET-BRN-01",
    title: "Minimalist Slim Leather Wallet - Vintage Brown",
    locationName: "Main Warehouse Mumbai",
    availableQuantity: 8,
    reorderThreshold: 20,
    status: "LOW",
  },
  {
    id: "inv-3",
    inventoryItemGid: "gid://shopify/InventoryItem/5003",
    variantGid: "gid://shopify/ProductVariant/6003",
    sku: "HENLEY-NVY-M",
    title: "Organic Cotton Henley Tee - Navy / Medium",
    locationName: "Regional Hub Bengaluru",
    availableQuantity: 0,
    reorderThreshold: 25,
    status: "OUT_OF_STOCK",
  },
];

export const DEMO_ORDERS: OrderListItem[] = [
  {
    id: "ord-1",
    orderGid: "gid://shopify/Order/8001",
    orderNumber: "#1084",
    processedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    customerName: "Rahul S. (Delhi)",
    totalPrice: 2450.0,
    currency: "INR",
    financialStatus: "PAID",
    fulfillmentStatus: "UNFULFILLED",
    lineItemCount: 2,
  },
  {
    id: "ord-2",
    orderGid: "gid://shopify/Order/8002",
    orderNumber: "#1083",
    processedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    customerName: "Ananya M. (Bengaluru)",
    totalPrice: 1750.0,
    currency: "INR",
    financialStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    lineItemCount: 1,
  },
  {
    id: "ord-3",
    orderGid: "gid://shopify/Order/8003",
    orderNumber: "#1082",
    processedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    customerName: "Vikram P. (Mumbai)",
    totalPrice: 3890.0,
    currency: "INR",
    financialStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    lineItemCount: 3,
  },
  {
    id: "ord-4",
    orderGid: "gid://shopify/Order/8004",
    orderNumber: "#1081",
    processedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    customerName: "Pooja K. (Pune)",
    totalPrice: 1200.0,
    currency: "INR",
    financialStatus: "REFUNDED",
    fulfillmentStatus: "FULFILLED",
    lineItemCount: 1,
  },
];

export const DEMO_FORECASTS: InventoryForecastItem[] = [
  {
    productGid: "gid://shopify/Product/1001",
    title: "Organic Cotton Henley Tee - Navy",
    currentStock: 14,
    dailyVelocity: 3.13, // 94 units / 30 days
    daysOfInventory: 4,
    projectedRunoutDate: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
    recommendedReorderQty: 85,
    isSufficientData: true,
    confidenceMarginPercent: 91.5,
    urgency: "URGENT",
  },
  {
    productGid: "gid://shopify/Product/1002",
    title: "Minimalist Slim Leather Wallet",
    currentStock: 8,
    dailyVelocity: 2.6, // 78 units / 30 days
    daysOfInventory: 3,
    projectedRunoutDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    recommendedReorderQty: 60,
    isSufficientData: true,
    confidenceMarginPercent: 88.0,
    urgency: "URGENT",
  },
  {
    productGid: "gid://shopify/Product/1003",
    title: "Ceramic Matte Coffee Dripper V60",
    currentStock: 32,
    dailyVelocity: 2.16, // 65 units / 30 days
    daysOfInventory: 15,
    projectedRunoutDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    recommendedReorderQty: 45,
    isSufficientData: true,
    confidenceMarginPercent: 86.4,
    urgency: "UPCOMING",
  },
  {
    productGid: "gid://shopify/Product/1005",
    title: "Vintage Botanical Canvas Tote Bag",
    currentStock: 42,
    dailyVelocity: 0.2, // 6 units / 30 days
    daysOfInventory: 210,
    projectedRunoutDate: new Date(Date.now() + 210 * 86400000).toISOString().split("T")[0],
    recommendedReorderQty: 0,
    isSufficientData: true,
    confidenceMarginPercent: 78.0,
    urgency: "HEALTHY",
  },
];
