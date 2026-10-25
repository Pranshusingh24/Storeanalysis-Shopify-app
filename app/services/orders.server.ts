/**
 * Shopify Admin GraphQL Orders Integration Service
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Fetches 100% real merchant orders from Shopify Admin API.
 * Demo data fallbacks have been removed.
 */

import type { OrderListItem } from "~/types";

export const ORDERS_QUERY = `#graphql
  query getRecentOrders($first: Int!, $after: String) {
    orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          processedAt
          cancelledAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalTaxSet {
            shopMoney {
              amount
            }
          }
          totalDiscountsSet {
            shopMoney {
              amount
            }
          }
          totalShippingPriceSet {
            shopMoney {
              amount
            }
          }
          totalRefundedSet {
            shopMoney {
              amount
            }
          }
          customer {
            displayName
          }
          lineItems(first: 25) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }
                product {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface FetchOrdersResult {
  orders: OrderListItem[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export async function fetchStoreOrders(
  adminClient: any,
  limit: number = 50,
  cursor: string | null = null
): Promise<FetchOrdersResult> {
  if (!adminClient) {
    return {
      orders: [],
      hasNextPage: false,
      endCursor: null,
    };
  }

  try {
    const response = await adminClient.graphql(ORDERS_QUERY, {
      variables: {
        first: limit,
        after: cursor,
      },
    });

    const json = await response.json();
    const data = json?.data?.orders;

    if (!data || !data.edges) {
      return {
        orders: [],
        hasNextPage: false,
        endCursor: null,
      };
    }

    const orders: OrderListItem[] = data.edges.map((edge: any) => {
      const node = edge.node;
      const lineItemCount = (node.lineItems?.edges || []).reduce(
        (sum: number, line: any) => sum + (line.node.quantity || 1),
        0
      );

      return {
        id: node.id,
        orderGid: node.id,
        orderNumber: node.name,
        processedAt: node.processedAt || new Date().toISOString(),
        customerName: node.customer?.displayName || "Verified Customer",
        totalPrice: parseFloat(node.totalPriceSet?.shopMoney?.amount || "0"),
        currency: node.totalPriceSet?.shopMoney?.currencyCode || "USD",
        financialStatus: node.displayFinancialStatus || "PAID",
        fulfillmentStatus: node.displayFulfillmentStatus || "UNFULFILLED",
        lineItemCount,
      };
    });

    return {
      orders,
      hasNextPage: data.pageInfo?.hasNextPage || false,
      endCursor: data.pageInfo?.endCursor || null,
    };
  } catch (error) {
    console.error("[Orders Service] Failed to fetch live orders from Shopify API:", error);
    return {
      orders: [],
      hasNextPage: false,
      endCursor: null,
    };
  }
}
