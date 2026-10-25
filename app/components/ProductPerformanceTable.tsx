/**
 * Product Performance Table (Best-Selling & Slow-Moving)
 * Storeanalysis - Pranshu Singh Baghel
 */

import React from "react";
import {
  Card,
  IndexTable,
  Text,
  Badge,
  BlockStack,
  InlineStack,
  EmptyState,
} from "@shopify/polaris";
import type { ProductPerformanceItem } from "~/types";
import { formatMoney } from "~/utils/money";

interface ProductPerformanceTableProps {
  products: ProductPerformanceItem[];
  currency?: string;
  showMargin?: boolean;
}

export function ProductPerformanceTable({
  products,
  currency = "INR",
  showMargin = false,
}: ProductPerformanceTableProps) {
  if (products.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No products found"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Sync your Shopify store to populate product sales analytics.</p>
        </EmptyState>
      </Card>
    );
  }

  const headings: any[] = [
    { title: "Product" },
    { title: "Velocity Status" },
    { title: "Units Sold" },
    { title: "Total Revenue" },
    { title: "In Stock" },
  ];

  if (showMargin) {
    headings.push({ title: "Est. Gross Margin" });
  }

  const rowMarkup = products.map((item, index) => {
    let badgeTone: "success" | "warning" | "info" = "info";
    let badgeLabel = "Moderate Velocity";

    if (item.velocityClassification === "BEST_SELLER") {
      badgeTone = "success";
      badgeLabel = "Best Seller";
    } else if (item.velocityClassification === "SLOW_MOVING") {
      badgeTone = "warning";
      badgeLabel = "Slow Moving";
    }

    return (
      <IndexTable.Row id={item.id} key={item.id} position={index}>
        <IndexTable.Cell>
          <BlockStack gap="050">
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              {item.title}
            </Text>
            {item.vendor && (
              <Text as="span" variant="bodyXs" tone="subdued">
                Vendor: {item.vendor} {item.productType ? `• ${item.productType}` : ""}
              </Text>
            )}
          </BlockStack>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Badge tone={badgeTone}>{badgeLabel}</Badge>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="medium">
            {item.unitsSold} units
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="bold">
            {formatMoney(item.revenue, currency)}
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text
            as="span"
            variant="bodyMd"
            tone={item.stockLevel <= 10 ? "critical" : undefined}
          >
            {item.stockLevel} in stock
          </Text>
        </IndexTable.Cell>

        {showMargin && (
          <IndexTable.Cell>
            {item.estimatedGrossMargin !== undefined ? (
              <Text as="span" variant="bodyMd" fontWeight="medium">
                {item.estimatedGrossMargin}%
              </Text>
            ) : (
              <Text as="span" variant="bodyXs" tone="subdued">
                Cost N/A
              </Text>
            )}
          </IndexTable.Cell>
        )}
      </IndexTable.Row>
    );
  });

  return (
    <Card padding="0">
      <IndexTable
        resourceName={{ singular: "product", plural: "products" }}
        itemCount={products.length}
        headings={headings as any}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}

export default ProductPerformanceTable;
