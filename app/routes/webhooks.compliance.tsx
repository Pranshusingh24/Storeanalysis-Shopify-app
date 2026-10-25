/**
 * Mandatory Shopify GDPR Compliance Webhooks
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Handles:
 * 1. customers/data_request
 * 2. customers/redact
 * 3. shop/redact
 */

import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/services/shopify.server";
import prisma from "~/services/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`[GDPR Webhook] Topic: ${topic} for shop: ${shop}`);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // Storeanalysis does not store customer PII.
      // Return 200 indicating no customer personal data retained.
      return new Response(JSON.stringify({ message: "No customer personal data retained." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    case "CUSTOMERS_REDACT":
      // Storeanalysis does not store customer PII.
      return new Response(JSON.stringify({ message: "Customer data redact acknowledged." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    case "SHOP_REDACT":
      // 48 hours after uninstall, Shopify requests all shop data deletion
      if (shop) {
        const shopRecord = await prisma.shop.findUnique({ where: { shopDomain: shop } });
        if (shopRecord) {
          await prisma.shop.delete({ where: { id: shopRecord.id } });
        }
      }
      return new Response(JSON.stringify({ message: "Shop records successfully erased." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    default:
      return new Response("Topic not recognized", { status: 400 });
  }
};
