/**
 * Inventory Status & Low-Stock Alerts Page
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Displays 100% real inventory stock levels and replenishment alerts from Shopify Admin API.
 * Demo data fallbacks have been removed.
 */

import React, { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  BlockStack,
  InlineStack,
  Text,
  Grid,
  ButtonGroup,
  Button,
  Card,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "~/services/shopify.server";
import { fetchStoreInventory } from "~/services/inventory.server";
import { requireFeatureEntitlement, getShopPlan } from "~/services/billing.server";
import { LowStockTable } from "~/components/LowStockTable";
import { MetricCard } from "~/components/MetricCard";
import { PlanGateBanner } from "~/components/PlanGateBanner";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let shopDomain = "storeanalysis-dev.myshopify.com";
  let adminClient: any = null;

  try {
    const { session, admin } = await authenticate.admin(request);
    shopDomain = session.shop;
    adminClient = admin;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    const url = new URL(request.url);
    if (url.searchParams.get("shop")) {
      shopDomain = url.searchParams.get("shop")!;
    }
  }

  const plan = await getShopPlan(shopDomain);
  const entitlement = await requireFeatureEntitlement(shopDomain, "hasLowStockAlerts");
  const { inventory } = await fetchStoreInventory(adminClient, shopDomain, 50);

  return json({
    shopDomain,
    plan,
    hasAccess: entitlement.allowed,
    inventory,
  });
};

export default function InventoryPage() {
  const { inventory, plan, hasAccess } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState<"ALL" | "LOW_OR_CRITICAL" | "OUT_OF_STOCK">("ALL");

  const outOfStockCount = inventory.filter((i) => i.status === "OUT_OF_STOCK").length;
  const lowStockCount = inventory.filter((i) => i.status === "LOW" || i.status === "CRITICAL").length;

  const filteredItems = inventory.filter((item) => {
    if (filter === "OUT_OF_STOCK") return item.status === "OUT_OF_STOCK";
    if (filter === "LOW_OR_CRITICAL") return item.status === "LOW" || item.status === "CRITICAL";
    return true;
  });

  return (
    <Page
      title="Inventory Status & Low-Stock Alerts"
      subtitle="Monitor stock quantities across warehouse locations and detect replenishment needs"
    >
      <BlockStack gap="400">
        {!hasAccess && (
          <PlanGateBanner
            featureName="Automated Low-Stock Indicators"
            requiredPlan="Basic"
            currentPlan={plan}
            description="Threshold-based stock warnings and reorder alerts are available on the Storeanalysis Basic Plan ($9.99/month)."
          />
        )}

        {/* Inventory Summary KPIs */}
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <MetricCard
              title="Items Monitored"
              value={inventory.length.toString()}
              helpText="Tracked inventory items"
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <MetricCard
              title="Low Stock Items"
              value={lowStockCount.toString()}
              tone="warning"
              helpText="Items below reorder threshold"
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <MetricCard
              title="Out of Stock"
              value={outOfStockCount.toString()}
              tone="critical"
              helpText="Items with 0 available units"
            />
          </Grid.Cell>
        </Grid>

        {inventory.length === 0 ? (
          <Card>
            <EmptyState
              heading="No tracked inventory items found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2764/files/emptystate-files.png"
            >
              <p>Ensure inventory tracking is enabled for your products in Shopify Admin, then sync data.</p>
            </EmptyState>
          </Card>
        ) : (
          <>
            {/* Status Filters */}
            <InlineStack align="start">
              <ButtonGroup variant="segmented">
                <Button pressed={filter === "ALL"} onClick={() => setFilter("ALL")}>
                  {`All Items (${inventory.length})`}
                </Button>
                <Button
                  pressed={filter === "LOW_OR_CRITICAL"}
                  onClick={() => setFilter("LOW_OR_CRITICAL")}
                >
                  {`Needs Reorder (${lowStockCount})`}
                </Button>
                <Button
                  pressed={filter === "OUT_OF_STOCK"}
                  onClick={() => setFilter("OUT_OF_STOCK")}
                >
                  {`Out of Stock (${outOfStockCount})`}
                </Button>
              </ButtonGroup>
            </InlineStack>

            {/* Inventory Table */}
            <LowStockTable items={filteredItems} />
          </>
        )}
      </BlockStack>
    </Page>
  );
}
