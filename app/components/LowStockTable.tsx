/**
 * Low Stock & Inventory Alert Table
 * Storeanalysis - Pranshu Singh Baghel
 */

import React from "react";
import {
  Card,
  IndexTable,
  Text,
  Badge,
  BlockStack,
  EmptyState,
} from "@shopify/polaris";
import type { LowStockItem } from "~/types";

interface LowStockTableProps {
  items: LowStockItem[];
}

export function LowStockTable({ items }: LowStockTableProps) {
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="Inventory is healthy"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>No inventory items are currently below the low-stock threshold.</p>
        </EmptyState>
      </Card>
    );
  }

  const headings = [
    { title: "Item / SKU" },
    { title: "Location" },
    { title: "Available Units" },
    { title: "Reorder Threshold" },
    { title: "Stock Status" },
  ];

  const rowMarkup = items.map((item, index) => {
    let badgeTone: "critical" | "warning" | "success" = "success";
    let badgeText = "Adequate";

    if (item.status === "OUT_OF_STOCK") {
      badgeTone = "critical";
      badgeText = "Out of Stock (0)";
    } else if (item.status === "CRITICAL") {
      badgeTone = "critical";
      badgeText = "Critical (≤ 5)";
    } else if (item.status === "LOW") {
      badgeTone = "warning";
      badgeText = "Low Stock";
    }

    return (
      <IndexTable.Row id={item.id} key={item.id} position={index}>
        <IndexTable.Cell>
          <BlockStack gap="050">
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              {item.title}
            </Text>
            {item.sku && (
              <Text as="span" variant="bodyXs" tone="subdued">
                SKU: {item.sku}
              </Text>
            )}
          </BlockStack>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {item.locationName || "Default Location"}
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text
            as="span"
            variant="bodyMd"
            fontWeight="bold"
            tone={item.availableQuantity <= 5 ? "critical" : undefined}
          >
            {item.availableQuantity} units
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" tone="subdued">
            {item.reorderThreshold} units
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Badge tone={badgeTone}>{badgeText}</Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Card padding="0">
      <IndexTable
        resourceName={{ singular: "inventory item", plural: "inventory items" }}
        itemCount={items.length}
        headings={headings as any}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}

export default LowStockTable;
