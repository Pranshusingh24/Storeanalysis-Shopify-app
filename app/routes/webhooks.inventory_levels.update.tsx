/**
 * Webhook: INVENTORY_LEVELS_UPDATE
 * Storeanalysis - Pranshu Singh Baghel
 */

import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/services/shopify.server";
import prisma from "~/services/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);

  if (shop && payload) {
    const shopRecord = await prisma.shop.findUnique({ where: { shopDomain: shop } });
    if (shopRecord && payload.inventory_item_id) {
      const inventoryItemGid = `gid://shopify/InventoryItem/${payload.inventory_item_id}`;
      const available = payload.available ?? 0;
      const threshold = shopRecord.reorderThreshold;

      let status = "IN_STOCK";
      if (available <= 0) status = "OUT_OF_STOCK";
      else if (available <= 5) status = "CRITICAL";
      else if (available <= threshold) status = "LOW_STOCK";

      await prisma.inventorySnapshot.create({
        data: {
          shopId: shopRecord.id,
          inventoryItemGid,
          title: `Item #${payload.inventory_item_id}`,
          availableQuantity: available,
          reorderThreshold: threshold,
          status,
        },
      });
    }
  }

  return new Response("OK", { status: 200 });
};
