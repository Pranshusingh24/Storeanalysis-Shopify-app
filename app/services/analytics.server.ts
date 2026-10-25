/**
 * Store Analytics & Metric Aggregation Service
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Computes 100% real financial metrics, sales trends, and prior-period deltas.
 * Demo data fallbacks have been removed.
 */

import prisma from "./db.server";
import type { MetricSummary, DailyTrendPoint } from "~/types";
import { roundCurrency, calculateDeltaPercent } from "~/utils/money";
import { toISODateString } from "~/utils/dates";

export interface AnalyticsQueryOptions {
  shopDomain: string;
  startDate: Date;
  endDate: Date;
  priorStartDate: Date;
  priorEndDate: Date;
}

/**
 * Fetch and aggregate real metrics for a given date range and prior period.
 */
export async function getStoreAnalytics(
  options: AnalyticsQueryOptions
): Promise<{ summary: MetricSummary; trends: DailyTrendPoint[] }> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: options.shopDomain },
    include: {
      dailyMetrics: {
        where: {
          date: {
            gte: toISODateString(options.priorStartDate),
            lte: toISODateString(options.endDate),
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  const currency = shop?.currencyCode || "USD";
  const metrics = shop?.dailyMetrics || [];

  const startStr = toISODateString(options.startDate);
  const endStr = toISODateString(options.endDate);
  const priorStartStr = toISODateString(options.priorStartDate);
  const priorEndStr = toISODateString(options.priorEndDate);

  // If store has no recorded metrics yet in database, return real zero state
  if (metrics.length === 0) {
    const emptySummary: MetricSummary = {
      grossSales: 0,
      netSales: 0,
      orderCount: 0,
      averageOrderValue: 0,
      totalRefunds: 0,
      totalDiscounts: 0,
      totalTaxes: 0,
      totalShipping: 0,
      currency,
      grossSalesDelta: 0,
      netSalesDelta: 0,
      orderCountDelta: 0,
      aovDelta: 0,
    };

    return {
      summary: emptySummary,
      trends: [],
    };
  }

  // Filter current period metrics
  const currentMetrics = metrics.filter((m) => m.date >= startStr && m.date <= endStr);
  // Filter prior period metrics
  const priorMetrics = metrics.filter((m) => m.date >= priorStartStr && m.date <= priorEndStr);

  const currentSummary = aggregateMetricList(currentMetrics);
  const priorSummary = aggregateMetricList(priorMetrics);

  const summary: MetricSummary = {
    grossSales: roundCurrency(currentSummary.grossSales),
    netSales: roundCurrency(currentSummary.netSales),
    orderCount: currentSummary.orderCount,
    averageOrderValue: roundCurrency(
      currentSummary.orderCount > 0 ? currentSummary.netSales / currentSummary.orderCount : 0
    ),
    totalRefunds: roundCurrency(currentSummary.totalRefunds),
    totalDiscounts: roundCurrency(currentSummary.totalDiscounts),
    totalTaxes: roundCurrency(currentSummary.totalTaxes),
    totalShipping: roundCurrency(currentSummary.totalShipping),
    currency,
    grossSalesDelta: calculateDeltaPercent(currentSummary.grossSales, priorSummary.grossSales),
    netSalesDelta: calculateDeltaPercent(currentSummary.netSales, priorSummary.netSales),
    orderCountDelta: calculateDeltaPercent(currentSummary.orderCount, priorSummary.orderCount),
    aovDelta: calculateDeltaPercent(
      currentSummary.orderCount > 0 ? currentSummary.netSales / currentSummary.orderCount : 0,
      priorSummary.orderCount > 0 ? priorSummary.netSales / priorSummary.orderCount : 0
    ),
  };

  const trends: DailyTrendPoint[] = currentMetrics.map((m) => {
    const d = new Date(m.date);
    return {
      date: m.date,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      grossSales: roundCurrency(m.grossSales),
      netSales: roundCurrency(m.netSales),
      orderCount: m.orderCount,
    };
  });

  return { summary, trends };
}

function aggregateMetricList(
  list: Array<{
    grossSales: number;
    netSales: number;
    orderCount: number;
    totalRefunds: number;
    totalDiscounts: number;
    totalTaxes: number;
    totalShipping: number;
  }>
) {
  return list.reduce(
    (acc, item) => {
      acc.grossSales += item.grossSales;
      acc.netSales += item.netSales;
      acc.orderCount += item.orderCount;
      acc.totalRefunds += item.totalRefunds;
      acc.totalDiscounts += item.totalDiscounts;
      acc.totalTaxes += item.totalTaxes;
      acc.totalShipping += item.totalShipping;
      return acc;
    },
    {
      grossSales: 0,
      netSales: 0,
      orderCount: 0,
      totalRefunds: 0,
      totalDiscounts: 0,
      totalTaxes: 0,
      totalShipping: 0,
    }
  );
}

/**
 * Record or upsert daily metrics from normalized Shopify order records
 */
export async function recordDailyMetrics(
  shopId: string,
  dateStr: string,
  delta: {
    grossSales: number;
    netSales: number;
    orderCount: number;
    totalRefunds?: number;
    totalDiscounts?: number;
    totalTaxes?: number;
    totalShipping?: number;
    currency?: string;
  }
) {
  const existing = await prisma.dailyMetric.findUnique({
    where: {
      shopId_date: {
        shopId,
        date: dateStr,
      },
    },
  });

  if (existing) {
    const newGross = roundCurrency(existing.grossSales + delta.grossSales);
    const newNet = roundCurrency(existing.netSales + delta.netSales);
    const newOrders = existing.orderCount + delta.orderCount;
    const aov = newOrders > 0 ? roundCurrency(newNet / newOrders) : 0;

    return await prisma.dailyMetric.update({
      where: { id: existing.id },
      data: {
        grossSales: newGross,
        netSales: newNet,
        orderCount: newOrders,
        averageOrderValue: aov,
        totalRefunds: roundCurrency(existing.totalRefunds + (delta.totalRefunds || 0)),
        totalDiscounts: roundCurrency(existing.totalDiscounts + (delta.totalDiscounts || 0)),
        totalTaxes: roundCurrency(existing.totalTaxes + (delta.totalTaxes || 0)),
        totalShipping: roundCurrency(existing.totalShipping + (delta.totalShipping || 0)),
      },
    });
  } else {
    const aov = delta.orderCount > 0 ? roundCurrency(delta.netSales / delta.orderCount) : 0;
    return await prisma.dailyMetric.create({
      data: {
        shopId,
        date: dateStr,
        grossSales: roundCurrency(delta.grossSales),
        netSales: roundCurrency(delta.netSales),
        orderCount: delta.orderCount,
        averageOrderValue: aov,
        totalRefunds: roundCurrency(delta.totalRefunds || 0),
        totalDiscounts: roundCurrency(delta.totalDiscounts || 0),
        totalTaxes: roundCurrency(delta.totalTaxes || 0),
        totalShipping: roundCurrency(delta.totalShipping || 0),
        currency: delta.currency || "USD",
      },
    });
  }
}
