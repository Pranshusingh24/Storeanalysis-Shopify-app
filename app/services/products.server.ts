/**
 * Shopify Admin GraphQL Products & Performance Service
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Fetches real product performance and catalog rankings from Shopify Admin API.
 * Demo data fallbacks have been removed.
 */

import type { ProductPerformanceItem } from "~/types";
import prisma from "./db.server";

export const PRODUCTS_QUERY = `#graphql
  query getProductsWithVariants($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          vendor
          productType
          status
          totalInventory
          variants(first: 10) {
            edges {
              node {
                id
                price
                inventoryQuantity
                inventoryItem {
                  id
                  unitCost {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchStoreProducts(
  adminClient: any,
  shopDomain: string,
  limit: number = 50
): Promise<{ products: ProductPerformanceItem[] }> {
  // Check if we have product snapshots in database for this shop
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: {
      productSnapshots: {
        orderBy: [{ unitsSold: "desc" }, { salesAmount: "desc" }],
        take: limit,
      },
    },
  });

  if (shop && shop.productSnapshots.length > 0) {
    const products: ProductPerformanceItem[] = shop.productSnapshots.map((item, idx) => {
      let classification: ProductPerformanceItem["velocityClassification"] = "MODERATE";
      if (idx < 3 && item.unitsSold >= 5) {
        classification = "BEST_SELLER";
      } else if (item.unitsSold === 0 && item.inventoryQuantity > 10) {
        classification = "SLOW_MOVING";
      }

      return {
        id: item.id,
        productGid: item.productGid,
        title: item.title,
        handle: item.handle || undefined,
        vendor: item.vendor || undefined,
        productType: item.productType || undefined,
        unitsSold: item.unitsSold,
        revenue: item.salesAmount,
        stockLevel: item.inventoryQuantity,
        velocityClassification: classification,
      };
    });

    return { products };
  }

  // If live admin client is provided and no DB snapshots yet, query Shopify Admin GraphQL
  if (adminClient) {
    try {
      const response = await adminClient.graphql(PRODUCTS_QUERY, {
        variables: { first: limit },
      });
      const json = await response.json();
      const edges = json?.data?.products?.edges;

      if (edges && edges.length > 0) {
        const products: ProductPerformanceItem[] = edges.map((edge: any) => {
          const node = edge.node;
          const variants = node.variants?.edges || [];
          const firstVariant = variants[0]?.node;
          const unitCost = firstVariant?.inventoryItem?.unitCost?.amount
            ? parseFloat(firstVariant.inventoryItem.unitCost.amount)
            : undefined;
          const price = firstVariant?.price ? parseFloat(firstVariant.price) : 0;

          let estimatedGrossMargin: number | undefined;
          if (unitCost && price > 0) {
            estimatedGrossMargin = Math.round(((price - unitCost) / price) * 1000) / 10;
          }

          let classification: ProductPerformanceItem["velocityClassification"] = "MODERATE";
          if ((node.totalInventory || 0) > 10) {
            classification = "SLOW_MOVING";
          }

          return {
            id: node.id,
            productGid: node.id,
            title: node.title,
            handle: node.handle,
            vendor: node.vendor,
            productType: node.productType,
            unitsSold: 0,
            revenue: 0,
            stockLevel: node.totalInventory || 0,
            unitCost,
            estimatedGrossMargin,
            velocityClassification: classification,
          };
        });

        return { products };
      }
    } catch (e) {
      console.warn("[Products Service] Live GraphQL query failed:", e);
    }
  }

  // Empty real state - no fake demo products
  return { products: [] };
}
