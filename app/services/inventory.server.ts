/**
 * Shopify Admin GraphQL Inventory Service
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Fetches real warehouse inventory quantities and low-stock alerts.
 * Demo data fallbacks have been removed.
 */

import type { LowStockItem } from "~/types";
import prisma from "./db.server";

export const INVENTORY_QUERY = `#graphql
  query getInventoryLevels($first: Int!, $after: String) {
    inventoryItems(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          sku
          tracked
          variant {
            id
            displayName
            product {
              id
              title
            }
          }
          inventoryLevels(first: 5) {
            edges {
              node {
                id
                location {
                  id
                  name
                }
                quantities(names: ["available"]) {
                  name
                  quantity
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchStoreInventory(
  adminClient: any,
  shopDomain: string,
  limit: number = 50
): Promise<{ inventory: LowStockItem[] }> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: {
      inventorySnapshots: {
        take: limit,
      },
    },
  });

  const threshold = shop?.reorderThreshold ?? 10;

  if (shop && shop.inventorySnapshots.length > 0) {
    const inventory: LowStockItem[] = shop.inventorySnapshots.map((item) => {
      let status: LowStockItem["status"] = "ADEQUATE";
      if (item.availableQuantity <= 0) status = "OUT_OF_STOCK";
      else if (item.availableQuantity <= 5) status = "CRITICAL";
      else if (item.availableQuantity <= threshold) status = "LOW";

      return {
        id: item.id,
        inventoryItemGid: item.inventoryItemGid,
        variantGid: item.variantGid || undefined,
        sku: item.sku || undefined,
        title: item.title,
        locationName: item.locationName || undefined,
        availableQuantity: item.availableQuantity,
        reorderThreshold: threshold,
        status,
      };
    });

    return { inventory };
  }

  if (adminClient) {
    try {
      const response = await adminClient.graphql(INVENTORY_QUERY, {
        variables: { first: limit },
      });
      const json = await response.json();
      const edges = json?.data?.inventoryItems?.edges;

      if (edges && edges.length > 0) {
        const inventory: LowStockItem[] = edges.map((edge: any) => {
          const node = edge.node;
          const levels = node.inventoryLevels?.edges || [];
          const firstLevel = levels[0]?.node;
          const locationName = firstLevel?.location?.name || "Main Warehouse";
          const availableQuantity = firstLevel?.quantities?.[0]?.quantity ?? 0;

          let status: LowStockItem["status"] = "ADEQUATE";
          if (availableQuantity <= 0) status = "OUT_OF_STOCK";
          else if (availableQuantity <= 5) status = "CRITICAL";
          else if (availableQuantity <= threshold) status = "LOW";

          const title =
            node.variant?.displayName ||
            node.variant?.product?.title ||
            node.sku ||
            `Item ${node.id.split("/").pop()}`;

          return {
            id: node.id,
            inventoryItemGid: node.id,
            sku: node.sku || "SKU-N/A",
            title,
            locationName,
            availableQuantity,
            reorderThreshold: threshold,
            status,
          };
        });

        return { inventory };
      }
    } catch (e) {
      console.warn("[Inventory Service] Live GraphQL query failed:", e);
    }
  }

  // Real empty inventory list
  return { inventory: [] };
}
