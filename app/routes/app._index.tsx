/**
 * Main Store Overview Dashboard
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Fetches and displays 100% real merchant store metrics, sales trends,
 * best sellers, and stock alerts. Demo data fallbacks have been removed.
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
  InlineStack,
  Text,
  Banner,
  Card,
  Grid,
  Button,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "~/services/shopify.server";
import { getStoreAnalytics } from "~/services/analytics.server";
import { fetchStoreProducts } from "~/services/products.server";
import { fetchStoreInventory } from "~/services/inventory.server";
import { triggerStoreSync } from "~/services/sync.server";
import { getDateRangeBoundaries, formatDateTime } from "~/utils/dates";
import { formatMoney } from "~/utils/money";
import { MetricCard } from "~/components/MetricCard";
import { SalesTrendChart } from "~/components/SalesTrendChart";
import { DateRangePicker } from "~/components/DateRangePicker";
import { ProductPerformanceTable } from "~/components/ProductPerformanceTable";
import { LowStockTable } from "~/components/LowStockTable";
import prisma from "~/services/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "30d";

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
    if (url.searchParams.get("shop")) {
      shopDomain = url.searchParams.get("shop")!;
    }
  }

  // Auto-sync store data on first visit if no daily metrics exist yet
  const existingMetricsCount = await prisma.dailyMetric.count({
    where: { shop: { shopDomain } },
  });

  if (existingMetricsCount === 0 && adminClient) {
    try {
      await triggerStoreSync(adminClient, shopDomain);
    } catch (e) {
      console.warn("[Overview] Auto-sync initial run:", e);
    }
  }

  const { startDate, endDate, priorStartDate, priorEndDate } = getDateRangeBoundaries(range);

  // Parallel data fetching of real merchant data
  const [analyticsResult, productsResult, inventoryResult] = await Promise.all([
    getStoreAnalytics({
      shopDomain,
      startDate,
      endDate,
      priorStartDate,
      priorEndDate,
    }),
    fetchStoreProducts(adminClient, shopDomain, 6),
    fetchStoreInventory(adminClient, shopDomain, 5),
  ]);

  return json({
    shopDomain,
    range,
    summary: analyticsResult.summary,
    trends: analyticsResult.trends,
    products: productsResult.products,
    inventory: inventoryResult.inventory,
    lastSyncedAt: formatDateTime(new Date()),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  let shopDomain = "storeanalysis-dev.myshopify.com";
  let adminClient: any = null;

  try {
    const { session, admin } = await authenticate.admin(request);
    shopDomain = session.shop;
    adminClient = admin;
  } catch {
    const formData = await request.formData();
    const s = formData.get("shopDomain");
    if (s) shopDomain = String(s);
  }

  const result = await triggerStoreSync(adminClient, shopDomain);
  return json(result);
};

export default function OverviewPage() {
  const { summary, trends, products, inventory, shopDomain, lastSyncedAt } =
    useLoaderData<typeof loader>();
  const syncFetcher = useFetcher<typeof action>();

  const isSyncing = syncFetcher.state === "submitting";

  const bestSellers = products.filter((p) => p.velocityClassification === "BEST_SELLER");
  const slowMovers = products.filter((p) => p.velocityClassification === "SLOW_MOVING");
  const lowStockAlerts = inventory.filter((i) => i.status !== "ADEQUATE");

  return (
    <Page
      title="Store Overview"
      subtitle={`Live sales, inventory, and performance monitoring for ${shopDomain}`}
      primaryAction={
        <Button
          variant="primary"
          loading={isSyncing}
          onClick={() => {
            syncFetcher.submit({ shopDomain }, { method: "post" });
          }}
        >
          {isSyncing ? "Syncing Store..." : "Sync Store Data"}
        </Button>
      }
    >
      <BlockStack gap="400">
        {/* Sync Success Feedback */}
        {syncFetcher.data?.success && (
          <Banner title="Sync Complete" tone="success">
            <p>{syncFetcher.data.message}</p>
          </Banner>
        )}

        {/* Date Range Picker */}
        <InlineStack align="space-between" blockAlign="center">
          <DateRangePicker />
          <Text as="span" variant="bodyXs" tone="subdued">
            Last synced: {lastSyncedAt}
          </Text>
        </InlineStack>

        {/* Top KPI Cards Grid */}
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <MetricCard
              title="Gross Sales"
              value={formatMoney(summary.grossSales, summary.currency)}
              deltaPercent={summary.grossSalesDelta}
              helpText="Before discounts & refunds"
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <MetricCard
              title="Net Sales"
              value={formatMoney(summary.netSales, summary.currency)}
              deltaPercent={summary.netSalesDelta}
              helpText="Gross sales minus refunds"
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <MetricCard
              title="Orders Placed"
              value={summary.orderCount.toString()}
              deltaPercent={summary.orderCountDelta}
              helpText="Completed order volume"
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <MetricCard
              title="Average Order Value"
              value={formatMoney(summary.averageOrderValue, summary.currency)}
              deltaPercent={summary.aovDelta}
              helpText="Net sales per order"
            />
          </Grid.Cell>
        </Grid>

        {/* Sales Trend Chart */}
        <SalesTrendChart data={trends} currency={summary.currency} />

        {/* Low Stock Attention Section */}
        {lowStockAlerts.length > 0 && (
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Low Stock Alerts ({lowStockAlerts.length} items)
              </Text>
            </InlineStack>
            <LowStockTable items={lowStockAlerts} />
          </BlockStack>
        )}

        {/* Best-Selling & Slow-Moving Products */}
        <Layout>
          <Layout.Section>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Top Performing Products
              </Text>
              {products.length === 0 ? (
                <Card>
                  <EmptyState
                    heading="No products found"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2764/files/emptystate-files.png"
                  >
                    <p>Add products in Shopify Admin and click 'Sync Store Data' to view performance.</p>
                  </EmptyState>
                </Card>
              ) : (
                <ProductPerformanceTable
                  products={bestSellers.length > 0 ? bestSellers : products.slice(0, 3)}
                  currency={summary.currency}
                />
              )}
            </BlockStack>
          </Layout.Section>

          {slowMovers.length > 0 && (
            <Layout.Section>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Slow-Moving Inventory (Needs Attention)
                </Text>
                <ProductPerformanceTable
                  products={slowMovers}
                  currency={summary.currency}
                />
              </BlockStack>
            </Layout.Section>
          )}
        </Layout>
      </BlockStack>
    </Page>
  );
}
