/**
 * Webhook Verification, Deduplication & Event Processing
 * Storeanalysis - Pranshu Singh Baghel
 */

import crypto from "crypto";
import prisma from "./db.server";
import { recordDailyMetrics } from "./analytics.server";
import { toISODateString } from "~/utils/dates";

/**
 * Verify Shopify Webhook HMAC-SHA256 signature
 */
export function verifyShopifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string
): boolean {
  if (!hmacHeader || !secret) return false;

  try {
    const generatedHmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    const generatedBuffer = Buffer.from(generatedHmac, "utf8");
    const headerBuffer = Buffer.from(hmacHeader, "utf8");

    if (generatedBuffer.length !== headerBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(generatedBuffer, headerBuffer);
  } catch (err) {
    console.error("[Webhook] HMAC verification failed with error:", err);
    return false;
  }
}

/**
 * Deduplicate webhook event. Returns true if already processed.
 */
export async function isDuplicateWebhook(
  shopId: string,
  topic: string,
  payloadHash: string
): Promise<boolean> {
  const existing = await prisma.webhookEvent.findFirst({
    where: {
      shopId,
      topic,
      payloadHash,
    },
  });

  return !!existing;
}

/**
 * Record a webhook event in the audit deduplication table
 */
export async function logWebhookEvent(
  shopId: string,
  topic: string,
  payloadHash: string,
  eventId?: string
) {
  return await prisma.webhookEvent.create({
    data: {
      shopId,
      topic,
      payloadHash,
      eventId: eventId || null,
      status: "PROCESSED",
    },
  });
}

/**
 * Handle incoming order creation/update webhooks idempotently
 */
export async function processOrderWebhook(
  shopDomain: string,
  topic: string,
  orderData: any
): Promise<{ success: boolean; duplicate?: boolean }> {
  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) return { success: false };

  const payloadString = JSON.stringify({ id: orderData.id, updated_at: orderData.updated_at });
  const payloadHash = crypto.createHash("sha256").update(payloadString).digest("hex");

  const isDup = await isDuplicateWebhook(shop.id, topic, payloadHash);
  if (isDup) {
    return { success: true, duplicate: true };
  }

  // Record metrics
  const orderDate = orderData.processed_at
    ? toISODateString(new Date(orderData.processed_at))
    : toISODateString(new Date());

  const totalPrice = parseFloat(orderData.total_price || "0");
  const totalTax = parseFloat(orderData.total_tax || "0");
  const totalDiscounts = parseFloat(orderData.total_discounts || "0");
  const netSales = Math.max(0, totalPrice - totalTax);

  await recordDailyMetrics(shop.id, orderDate, {
    grossSales: totalPrice,
    netSales,
    orderCount: topic === "orders/create" ? 1 : 0,
    totalDiscounts,
    totalTaxes: totalTax,
    currency: orderData.currency || shop.currencyCode,
  });

  await logWebhookEvent(shop.id, topic, payloadHash, String(orderData.id));
  return { success: true };
}

/**
 * Handle App Uninstalled Webhook
 */
export async function processAppUninstalledWebhook(shopDomain: string): Promise<void> {
  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) return;

  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + 90); // 90 days retention

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      uninstalledAt: new Date(),
      dataRetentionUntil: retentionDate,
      plan: "Free",
    },
  });

  // Clean up active session tokens
  await prisma.session.deleteMany({
    where: { shop: shopDomain },
  });
}
