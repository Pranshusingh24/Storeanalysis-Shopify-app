/**
 * Real Store Synchronization Service
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Ingests 100% real merchant data from Shopify Admin GraphQL API:
 * - Shop metadata (currency, timezone, email, name)
 * - Orders & daily metric aggregations (gross sales, refunds, taxes, discounts, shipping)
 * - Real product performance & line-item velocity
 * - Real warehouse inventory levels and location quantities
 */

import prisma from "./db.server";
import { ORDERS_QUERY } from "./orders.server";
import { PRODUCTS_QUERY } from "./products.server";
import { INVENTORY_QUERY } from "./inventory.server";
import { toISODateString } from "~/utils/dates";

export const SHOP_METADATA_QUERY = `#graphql
  query getShopMetadata {
    shop {
      id
      name
      email
      currencyCode
      ianaTimezone
      myshopifyDomain
    }
  }
`;

export async function triggerStoreSync(
  adminClient: any,
  shopDomain: string
): Promise<{ success: boolean; message: string; timestamp: string }> {
  const now = new Date();
  const timestamp = now.toISOString();
  const todayStr = toISODateString(now);

  // Upsert base shop record
  let shop = await prisma.shop.upsert({
    where: { shopDomain },
    update: { updatedAt: now },
    create: {
      shopDomain,
      plan: "Free",
      currencyCode: "USD",
    },
  });

  if (!adminClient) {
    return {
      success: false,
      message: "Shopify Admin API client not available for sync.",
      timestamp,
    };
  }

  try {
    // 1. Mark sync status in progress
    await prisma.syncState.upsert({
      where: { shopId_resourceType: { shopId: shop.id, resourceType: "all" } },
      update: { status: "IN_PROGRESS", errorMessage: null },
      create: { shopId: shop.id, resourceType: "all", status: "IN_PROGRESS" },
    });

    // 2. Fetch and store real shop configuration
    try {
      const shopRes = await adminClient.graphql(SHOP_METADATA_QUERY);
      const shopJson = await shopRes.json();
      const shopData = shopJson?.data?.shop;

      if (shopData) {
        shop = await prisma.shop.update({
          where: { id: shop.id },
          data: {
            name: shopData.name || shop.name,
            email: shopData.email || shop.email,
            currencyCode: shopData.currencyCode || shop.currencyCode,
            ianaTimezone: shopData.ianaTimezone || shop.ianaTimezone,
          },
        });
      }
    } catch (e) {
      console.warn("[Sync] Could not update shop metadata:", e);
    }

    // 3. Query Real Orders
    let syncedOrdersCount = 0;
    const productSalesMap = new Map<string, { unitsSold: number; salesAmount: number }>();
    const dateMap = new Map<
      string,
      {
        gross: number;
        net: number;
        count: number;
        refunds: number;
        discounts: number;
        taxes: number;
        shipping: number;
      }
    >();

    const orderRes = await adminClient.graphql(ORDERS_QUERY, { variables: { first: 50 } });
    const orderJson = await orderRes.json();
    const orderEdges = orderJson?.data?.orders?.edges || [];
    syncedOrdersCount = orderEdges.length;

    for (const edge of orderEdges) {
      const node = edge.node;
      const dStr = node.processedAt ? toISODateString(new Date(node.processedAt)) : todayStr;

      const gross = parseFloat(node.totalPriceSet?.shopMoney?.amount || "0");
      const refunds = parseFloat(node.totalRefundedSet?.shopMoney?.amount || "0");
      const taxes = parseFloat(node.totalTaxSet?.shopMoney?.amount || "0");
      const discounts = parseFloat(node.totalDiscountsSet?.shopMoney?.amount || "0");
      const shipping = parseFloat(node.totalShippingPriceSet?.shopMoney?.amount || "0");
      const net = Math.max(0, gross - refunds);

      const existing = dateMap.get(dStr) || {
        gross: 0,
        net: 0,
        count: 0,
        refunds: 0,
        discounts: 0,
        taxes: 0,
        shipping: 0,
      };

      existing.gross += gross;
      existing.net += net;
      existing.count += 1;
      existing.refunds += refunds;
      existing.discounts += discounts;
      existing.taxes += taxes;
      existing.shipping += shipping;
      dateMap.set(dStr, existing);

      // Extract line items to calculate real product velocity
      const lineItemEdges = node.lineItems?.edges || [];
      for (const lineEdge of lineItemEdges) {
        const line = lineEdge.node;
        const productGid = line.product?.id;
        if (productGid) {
          const qty = line.quantity || 1;
          const unitPrice = parseFloat(line.originalUnitPriceSet?.shopMoney?.amount || "0");
          const cur = productSalesMap.get(productGid) || { unitsSold: 0, salesAmount: 0 };
          cur.unitsSold += qty;
          cur.salesAmount += qty * unitPrice;
          productSalesMap.set(productGid, cur);
        }
      }
    }

    // Upsert real daily metrics into database
    for (const [date, values] of dateMap.entries()) {
      await prisma.dailyMetric.upsert({
        where: { shopId_date: { shopId: shop.id, date } },
        update: {
          grossSales: values.gross,
          netSales: values.net,
          orderCount: values.count,
          averageOrderValue: values.count > 0 ? values.net / values.count : 0,
          totalRefunds: values.refunds,
          totalDiscounts: values.discounts,
          totalTaxes: values.taxes,
          totalShipping: values.shipping,
        },
        create: {
          shopId: shop.id,
          date,
          grossSales: values.gross,
          netSales: values.net,
          orderCount: values.count,
          averageOrderValue: values.count > 0 ? values.net / values.count : 0,
          totalRefunds: values.refunds,
          totalDiscounts: values.discounts,
          totalTaxes: values.taxes,
          totalShipping: values.shipping,
          currency: shop.currencyCode,
        },
      });
    }

    // 4. Query Real Products
    let syncedProductsCount = 0;
    const prodRes = await adminClient.graphql(PRODUCTS_QUERY, { variables: { first: 50 } });
    const prodJson = await prodRes.json();
    const prodEdges = prodJson?.data?.products?.edges || [];
    syncedProductsCount = prodEdges.length;

    for (const edge of prodEdges) {
      const node = edge.node;
      const sales = productSalesMap.get(node.id) || { unitsSold: 0, salesAmount: 0 };

      let classification: "BEST_SELLER" | "MODERATE" | "SLOW_MOVING" = "MODERATE";
      if (sales.unitsSold >= 5) {
        classification = "BEST_SELLER";
      } else if (sales.unitsSold === 0 && (node.totalInventory || 0) > 10) {
        classification = "SLOW_MOVING";
      }

      await prisma.productSnapshot.upsert({
        where: {
          shopId_productGid_snapshotDate: {
            shopId: shop.id,
            productGid: node.id,
            snapshotDate: todayStr,
          },
        },
        update: {
          title: node.title,
          handle: node.handle,
          vendor: node.vendor,
          productType: node.productType,
          status: node.status || "ACTIVE",
          inventoryQuantity: node.totalInventory || 0,
          unitsSold: sales.unitsSold,
          salesAmount: sales.salesAmount,
        },
        create: {
          shopId: shop.id,
          productGid: node.id,
          title: node.title,
          handle: node.handle,
          vendor: node.vendor,
          productType: node.productType,
          status: node.status || "ACTIVE",
          inventoryQuantity: node.totalInventory || 0,
          unitsSold: sales.unitsSold,
          salesAmount: sales.salesAmount,
          snapshotDate: todayStr,
        },
      });
    }

    // 5. Query Real Inventory Items & Locations
    let syncedInventoryCount = 0;
    try {
      const invRes = await adminClient.graphql(INVENTORY_QUERY, { variables: { first: 50 } });
      const invJson = await invRes.json();
      const invEdges = invJson?.data?.inventoryItems?.edges || [];
      syncedInventoryCount = invEdges.length;

      const threshold = shop.reorderThreshold || 10;

      for (const edge of invEdges) {
        const node = edge.node;
        const levels = node.inventoryLevels?.edges || [];
        const firstLevel = levels[0]?.node;
        const locationName = firstLevel?.location?.name || "Main Warehouse";
        const locationGid = firstLevel?.location?.id || null;
        const availableQty = firstLevel?.quantities?.[0]?.quantity ?? 0;

        let status = "IN_STOCK";
        if (availableQty <= 0) status = "OUT_OF_STOCK";
        else if (availableQty <= threshold) status = "LOW_STOCK";

        const itemTitle =
          node.variant?.displayName ||
          node.variant?.product?.title ||
          node.sku ||
          `Item ${node.id.split("/").pop()}`;

        // Delete existing snapshots for this item for today to avoid stale entries
        await prisma.inventorySnapshot.deleteMany({
          where: {
            shopId: shop.id,
            inventoryItemGid: node.id,
          },
        });

        await prisma.inventorySnapshot.create({
          data: {
            shopId: shop.id,
            inventoryItemGid: node.id,
            variantGid: node.variant?.id || null,
            sku: node.sku || null,
            title: itemTitle,
            locationGid,
            locationName,
            availableQuantity: availableQty,
            reorderThreshold: threshold,
            status,
          },
        });
      }
    } catch (invErr) {
      console.warn("[Sync] Inventory levels query error:", invErr);
    }

    // 6. Update sync state to SUCCESS
    await prisma.syncState.upsert({
      where: { shopId_resourceType: { shopId: shop.id, resourceType: "all" } },
      update: {
        status: "SUCCESS",
        lastSyncedAt: now,
      },
      create: {
        shopId: shop.id,
        resourceType: "all",
        status: "SUCCESS",
        lastSyncedAt: now,
      },
    });

    return {
      success: true,
      message: `Store synchronized: ${syncedOrdersCount} orders, ${syncedProductsCount} products, ${syncedInventoryCount} inventory items updated from Shopify Admin.`,
      timestamp,
    };
  } catch (err: any) {
    console.error("[Sync] Error running live store synchronization:", err);

    await prisma.syncState.upsert({
      where: { shopId_resourceType: { shopId: shop.id, resourceType: "all" } },
      update: {
        status: "FAILED",
        errorMessage: err.message,
      },
      create: {
        shopId: shop.id,
        resourceType: "all",
        status: "FAILED",
        errorMessage: err.message,
      },
    });

    return {
      success: false,
      message: `Synchronization failed: ${err.message}`,
      timestamp,
    };
  }
}
