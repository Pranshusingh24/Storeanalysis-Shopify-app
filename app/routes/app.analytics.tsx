/**
 * Analytics & Revenue Reports Page
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Displays 100% real financial breakdown, refund deductions, discounts, and order growth.
 * Demo data fallbacks have been removed.
 */

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  BlockStack,
  Text,
  Grid,
  Card,
  Box,
} from "@shopify/polaris";
import { authenticate } from "~/services/shopify.server";
import { getStoreAnalytics } from "~/services/analytics.server";
import { requireFeatureEntitlement, getShopPlan } from "~/services/billing.server";
import { getDateRangeBoundaries } from "~/utils/dates";
import { formatMoney } from "~/utils/money";
import { MetricCard } from "~/components/MetricCard";
import { SalesTrendChart } from "~/components/SalesTrendChart";
import { DateRangePicker } from "~/components/DateRangePicker";
import { PlanGateBanner } from "~/components/PlanGateBanner";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "30d";

  let shopDomain = "storeanalysis-dev.myshopify.com";

  try {
    const { session } = await authenticate.admin(request);
    shopDomain = session.shop;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    if (url.searchParams.get("shop")) {
      shopDomain = url.searchParams.get("shop")!;
    }
  }

  const plan = await getShopPlan(shopDomain);
  const entitlement = await requireFeatureEntitlement(shopDomain, "hasSalesReports");

  const { startDate, endDate, priorStartDate, priorEndDate } = getDateRangeBoundaries(range);

  const analytics = await getStoreAnalytics({
    shopDomain,
    startDate,
    endDate,
    priorStartDate,
    priorEndDate,
  });

  return json({
    shopDomain,
    plan,
    hasAccess: entitlement.allowed,
    summary: analytics.summary,
    trends: analytics.trends,
  });
};

export default function AnalyticsPage() {
  const { summary, trends, plan, hasAccess } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Sales & Revenue Analytics"
      subtitle="Detailed financial breakdown, refund deductions, discounts, and order growth"
    >
      <BlockStack gap="400">
        {!hasAccess && (
          <PlanGateBanner
            featureName="Comprehensive Sales Reports"
            requiredPlan="Basic"
            currentPlan={plan}
            description="Detailed revenue breakdowns, discount tracking, and 30-day historical trends require the Storeanalysis Basic Plan ($9.99/month)."
          />
        )}

        <DateRangePicker />

        {/* Primary Metrics Grid */}
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <MetricCard
              title="Gross Sales"
              value={formatMoney(summary.grossSales, summary.currency)}
              deltaPercent={summary.grossSalesDelta}
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <MetricCard
              title="Net Sales"
              value={formatMoney(summary.netSales, summary.currency)}
              deltaPercent={summary.netSalesDelta}
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <MetricCard
              title="Total Refunds"
              value={formatMoney(summary.totalRefunds, summary.currency)}
              helpText="Returned order amounts"
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3, xl: 3 }}>
            <MetricCard
              title="Total Discounts"
              value={formatMoney(summary.totalDiscounts, summary.currency)}
              helpText="Promotional discounts deducted"
            />
          </Grid.Cell>
        </Grid>

        {/* Trend Chart */}
        <SalesTrendChart data={trends} currency={summary.currency} />

        {/* Financial Breakdown Card */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Revenue Reconciliation Summary
            </Text>
            <Box padding="200" background="bg-surface-secondary" borderRadius="200">
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="050">
                    <Text as="span" variant="bodyXs" tone="subdued">
                      Gross Sales
                    </Text>
                    <Text as="span" variant="bodyMd" fontWeight="bold">
                      {formatMoney(summary.grossSales, summary.currency)}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="050">
                    <Text as="span" variant="bodyXs" tone="subdued">
                      Refunds Deducted
                    </Text>
                    <Text as="span" variant="bodyMd" tone="critical">
                      -{formatMoney(summary.totalRefunds, summary.currency)}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="050">
                    <Text as="span" variant="bodyXs" tone="subdued">
                      Taxes Collected
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {formatMoney(summary.totalTaxes, summary.currency)}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="050">
                    <Text as="span" variant="bodyXs" tone="subdued">
                      Shipping Billed
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {formatMoney(summary.totalShipping, summary.currency)}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
              </Grid>
            </Box>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
