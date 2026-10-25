/**
 * Orders & Fulfillment Overview Page
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Fetches and displays 100% real merchant store orders from Shopify Admin API.
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
  Card,
  IndexTable,
  Badge,
  TextField,
  Grid,
  Box,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "~/services/shopify.server";
import { fetchStoreOrders } from "~/services/orders.server";
import { formatMoney } from "~/utils/money";
import { formatDateTime } from "~/utils/dates";
import { MetricCard } from "~/components/MetricCard";

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

  const { orders } = await fetchStoreOrders(adminClient, 50);

  return json({
    shopDomain,
    orders,
  });
};

export default function OrdersPage() {
  const { orders } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fulfilledCount = orders.filter((o) => o.fulfillmentStatus === "FULFILLED").length;
  const unfulfilledCount = orders.filter((o) => o.fulfillmentStatus === "UNFULFILLED").length;
  const fulfillmentRate =
    orders.length > 0 ? Math.round((fulfilledCount / orders.length) * 100) : 100;

  const headings = [
    { title: "Order" },
    { title: "Date Placed" },
    { title: "Total Price" },
    { title: "Payment Status" },
    { title: "Fulfillment Status" },
    { title: "Items" },
  ];

  const rowMarkup = filteredOrders.map((order, index) => {
    let finTone: "success" | "critical" | "warning" | "info" = "info";
    if (order.financialStatus === "PAID") finTone = "success";
    else if (order.financialStatus === "REFUNDED") finTone = "critical";
    else if (order.financialStatus === "PENDING") finTone = "warning";

    let fulTone: "success" | "warning" | "info" = "info";
    if (order.fulfillmentStatus === "FULFILLED") fulTone = "success";
    else if (order.fulfillmentStatus === "UNFULFILLED") fulTone = "warning";

    return (
      <IndexTable.Row id={order.id} key={order.id} position={index}>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="bold">
            {order.orderNumber}
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {formatDateTime(order.processedAt)}
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {formatMoney(order.totalPrice, order.currency)}
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Badge tone={finTone}>{order.financialStatus}</Badge>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Badge tone={fulTone}>{order.fulfillmentStatus}</Badge>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {order.lineItemCount} {order.lineItemCount === 1 ? "item" : "items"}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page
      title="Orders & Fulfillment Overview"
      subtitle="Track real customer orders, fulfillment pipelines, and financial status"
    >
      <BlockStack gap="400">
        {/* Fulfillment Metrics */}
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <MetricCard
              title="Recent Orders"
              value={orders.length.toString()}
              helpText="Orders retrieved from Shopify"
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <MetricCard
              title="Fulfillment Rate"
              value={`${fulfillmentRate}%`}
              tone="success"
              helpText={`${fulfilledCount} of ${orders.length} fulfilled`}
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
            <MetricCard
              title="Pending Fulfillment"
              value={unfulfilledCount.toString()}
              tone={unfulfilledCount > 0 ? "warning" : "success"}
              helpText="Orders waiting to be shipped"
            />
          </Grid.Cell>
        </Grid>

        {/* Filter by Order Number */}
        {orders.length > 0 && (
          <Box minWidth="280px">
            <TextField
              label="Search orders"
              labelHidden
              placeholder="Search by order number (e.g. #1001)..."
              value={searchQuery}
              onChange={setSearchQuery}
              clearButton
              onClearButtonClick={() => setSearchQuery("")}
              autoComplete="off"
            />
          </Box>
        )}

        {/* Orders Table or Empty State */}
        <Card padding="0">
          {orders.length === 0 ? (
            <EmptyState
              heading="No orders found yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2764/files/emptystate-files.png"
            >
              <p>When customers place orders in your Shopify store, they will automatically appear here.</p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={{ singular: "order", plural: "orders" }}
              itemCount={filteredOrders.length}
              headings={headings as any}
              selectable={false}
            >
              {rowMarkup}
            </IndexTable>
          )}
        </Card>
      </BlockStack>
    </Page>
  );
}
