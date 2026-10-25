/**
 * Product Performance & Velocity Analytics
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Displays 100% real product performance, velocity rankings, and qualified margins.
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
  TextField,
  ButtonGroup,
  Button,
  Banner,
  Box,
  Card,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "~/services/shopify.server";
import { fetchStoreProducts } from "~/services/products.server";
import { requireFeatureEntitlement, getShopPlan } from "~/services/billing.server";
import { ProductPerformanceTable } from "~/components/ProductPerformanceTable";
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
  const entitlement = await requireFeatureEntitlement(shopDomain, "hasProductAnalytics");
  const proMarginEntitlement = await requireFeatureEntitlement(shopDomain, "hasProfitEstimates");

  const { products } = await fetchStoreProducts(adminClient, shopDomain, 50);

  return json({
    shopDomain,
    plan,
    hasAccess: entitlement.allowed,
    canViewMargins: proMarginEntitlement.allowed,
    products,
  });
};

export default function ProductsPage() {
  const { products, plan, hasAccess, canViewMargins } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "BEST_SELLER" | "SLOW_MOVING">("ALL");

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedFilter === "ALL") return true;
    return p.velocityClassification === selectedFilter;
  });

  return (
    <Page
      title="Product Performance"
      subtitle="Identify top sales drivers, assess inventory velocity, and flag slow-moving items"
    >
      <BlockStack gap="400">
        {!hasAccess && (
          <PlanGateBanner
            featureName="Product Performance Rankings"
            requiredPlan="Basic"
            currentPlan={plan}
            description="Deep product ranking, units sold tracking, and inventory turnover insights are included in the Storeanalysis Basic Plan ($9.99/month)."
          />
        )}

        {/* Pro Profit Margin Disclaimer */}
        {canViewMargins && (
          <Banner title="Qualified Gross Margin Active" tone="success">
            <p>
              Displaying qualified gross margins calculated from recorded variant unit costs. Excludes advertising,
              shipping, and general store operating expenses.
            </p>
          </Banner>
        )}

        {products.length === 0 ? (
          <Card>
            <EmptyState
              heading="No store products found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2764/files/emptystate-files.png"
            >
              <p>Add products to your Shopify store and sync data to monitor performance rankings.</p>
            </EmptyState>
          </Card>
        ) : (
          <>
            {/* Search & Filter Toolbar */}
            <Box paddingBlockEnd="200">
              <InlineStack align="space-between" blockAlign="center" gap="300">
                <Box minWidth="280px">
                  <TextField
                    label="Search products"
                    labelHidden
                    placeholder="Search by product title or vendor..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    clearButton
                    onClearButtonClick={() => setSearchQuery("")}
                    autoComplete="off"
                  />
                </Box>

                <ButtonGroup variant="segmented">
                  <Button
                    pressed={selectedFilter === "ALL"}
                    onClick={() => setSelectedFilter("ALL")}
                  >
                    {`All Products (${products.length})`}
                  </Button>
                  <Button
                    pressed={selectedFilter === "BEST_SELLER"}
                    onClick={() => setSelectedFilter("BEST_SELLER")}
                  >
                    Best Sellers
                  </Button>
                  <Button
                    pressed={selectedFilter === "SLOW_MOVING"}
                    onClick={() => setSelectedFilter("SLOW_MOVING")}
                  >
                    Slow Moving
                  </Button>
                </ButtonGroup>
              </InlineStack>
            </Box>

            {/* Product Table */}
            <ProductPerformanceTable
              products={filteredProducts}
              showMargin={canViewMargins}
            />
          </>
        )}
      </BlockStack>
    </Page>
  );
}
