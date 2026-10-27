/**
 * Subscription Billing & Entitlements Engine
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Follows Shopify App Pricing Guidelines:
 * https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing
 * Enforces server-side feature access and plan tier limits.
 * Exactly three plans: Free ($0/mo), Basic ($9.99/mo), Pro ($29.99/mo).
 */

import type { PlanTier, PlanFeatureLimits } from "~/types";
import prisma from "./db.server";
import { fetchActiveSubscription } from "./partner-api.server";

export const PLAN_CONFIGS: Record<PlanTier, PlanFeatureLimits> = {
  Free: {
    tier: "Free",
    priceUSD: 0,
    priceINR: 0,
    historyDays: 7,
    hasSalesReports: false,
    hasProductAnalytics: false,
    hasLowStockAlerts: false,
    hasAdvancedAnalytics: false,
    hasProfitEstimates: false,
    hasInventoryForecasting: false,
  },
  Basic: {
    tier: "Basic",
    priceUSD: 9.99,
    priceINR: 799,
    historyDays: 30,
    hasSalesReports: true,
    hasProductAnalytics: true,
    hasLowStockAlerts: true,
    hasAdvancedAnalytics: false,
    hasProfitEstimates: false,
    hasInventoryForecasting: false,
  },
  Pro: {
    tier: "Pro",
    priceUSD: 29.99,
    priceINR: 1999,
    historyDays: 365,
    hasSalesReports: true,
    hasProductAnalytics: true,
    hasLowStockAlerts: true,
    hasAdvancedAnalytics: true,
    hasProfitEstimates: true,
    hasInventoryForecasting: true,
  },
};

/**
 * Get active plan for a shop
 */
export async function getShopPlan(shopDomain: string): Promise<PlanTier> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { plan: true },
  });

  const plan = (shop?.plan as PlanTier) || "Free";
  return plan in PLAN_CONFIGS ? plan : "Free";
}

/**
 * Check if a shop is entitled to a specific feature server-side
 */
export async function requireFeatureEntitlement(
  shopDomain: string,
  feature: keyof Omit<PlanFeatureLimits, "tier" | "priceINR" | "historyDays">
): Promise<{ allowed: boolean; currentPlan: PlanTier; requiredPlan: PlanTier }> {
  const currentPlan = await getShopPlan(shopDomain);
  const limits = PLAN_CONFIGS[currentPlan];

  const allowed = !!limits[feature];
  const requiredPlan: PlanTier =
    feature === "hasProfitEstimates" ||
    feature === "hasInventoryForecasting" ||
    feature === "hasAdvancedAnalytics"
      ? "Pro"
      : "Basic";

  return { allowed, currentPlan, requiredPlan };
}

/**
 * Calculate max history days allowed for a shop
 */
export function getMaxHistoryDays(plan: PlanTier): number {
  return PLAN_CONFIGS[plan]?.historyDays ?? 7;
}

/**
 * Update shop subscription plan in database
 */
export async function updateShopPlan(
  shopDomain: string,
  newPlan: PlanTier,
  chargeId?: string
): Promise<void> {
  await prisma.shop.upsert({
    where: { shopDomain },
    update: { plan: newPlan },
    create: {
      shopDomain,
      plan: newPlan,
    },
  });

  if (chargeId) {
    const shop = await prisma.shop.findUnique({ where: { shopDomain } });
    if (shop) {
      await prisma.subscription.upsert({
        where: { chargeId },
        update: {
          planName: newPlan,
          status: "ACTIVE",
          priceAmount: PLAN_CONFIGS[newPlan].priceUSD,
          currency: "USD",
        },
        create: {
          shopId: shop.id,
          chargeId,
          planName: newPlan,
          priceAmount: PLAN_CONFIGS[newPlan].priceUSD,
          currency: "USD",
          status: "ACTIVE",
        },
      });
    }
  }
}

/**
 * Sync active subscription status with Shopify Partner API when available
 */
export async function syncSubscriptionFromPartnerAPI(
  shopDomain: string,
  shopGid: string
): Promise<PlanTier> {
  const activeSub = await fetchActiveSubscription(shopGid);
  if (!activeSub) {
    return await getShopPlan(shopDomain);
  }

  // Determine plan tier from subscription items
  let detectedPlan: PlanTier = "Free";
  if (activeSub.items && activeSub.items.length > 0) {
    const handle = activeSub.items[0].handle.toLowerCase();
    if (handle.includes("pro")) {
      detectedPlan = "Pro";
    } else if (handle.includes("basic")) {
      detectedPlan = "Basic";
    }
  }

  await updateShopPlan(shopDomain, detectedPlan);
  return detectedPlan;
}
