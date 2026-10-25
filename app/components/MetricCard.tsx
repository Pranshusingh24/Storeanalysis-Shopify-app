/**
 * Polaris Metric KPI Card with Delta Badges
 * Storeanalysis - Pranshu Singh Baghel
 */

import React from "react";
import { Card, Text, BlockStack, InlineStack, Badge, Box } from "@shopify/polaris";

interface MetricCardProps {
  title: string;
  value: string;
  deltaPercent?: number;
  deltaPeriodLabel?: string;
  helpText?: string;
  tone?: "success" | "critical" | "warning";
}

export function MetricCard({
  title,
  value,
  deltaPercent,
  deltaPeriodLabel = "vs prior period",
  helpText,
}: MetricCardProps) {
  const hasDelta = deltaPercent !== undefined;
  const isPositive = (deltaPercent ?? 0) >= 0;
  const badgeTone = isPositive ? "success" : "critical";
  const badgeText = `${isPositive ? "▲ +" : "▼ "}${Math.abs(deltaPercent ?? 0)}%`;

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingSm" tone="subdued">
            {title}
          </Text>
          {hasDelta && <Badge tone={badgeTone}>{badgeText}</Badge>}
        </InlineStack>

        <Text as="p" variant="headingXl" fontWeight="bold">
          {value}
        </Text>

        <InlineStack gap="100" blockAlign="center">
          {hasDelta && (
            <Text as="span" variant="bodyXs" tone="subdued">
              {badgeText} {deltaPeriodLabel}
            </Text>
          )}
          {helpText && (
            <Box>
              <Text as="span" variant="bodyXs" tone="subdued">
                {helpText}
              </Text>
            </Box>
          )}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

export default MetricCard;
