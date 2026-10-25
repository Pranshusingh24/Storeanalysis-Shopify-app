/**
 * Pro Inventory Depletion & Forecast Visualization
 * Storeanalysis - Pranshu Singh Baghel
 */

import React from "react";
import { Card, Text, BlockStack, InlineStack, Box } from "@shopify/polaris";
import type { InventoryForecastItem } from "~/types";

interface ForecastChartProps {
  item: InventoryForecastItem;
}

export function ForecastChart({ item }: ForecastChartProps) {
  if (!item.isSufficientData || item.dailyVelocity <= 0) {
    return (
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Stockout Horizon: {item.title}
          </Text>
          <Box padding="300">
            <Text as="p" tone="subdued">
              Insufficient historical velocity to project a depletion trajectory.
            </Text>
          </Box>
        </BlockStack>
      </Card>
    );
  }

  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 30;

  const daysToProject = Math.min(30, Math.max(7, item.daysOfInventory + 5));
  const points: Array<{ day: number; stock: number }> = [];

  for (let day = 0; day <= daysToProject; day++) {
    const projected = Math.max(0, Math.round(item.currentStock - day * item.dailyVelocity));
    points.push({ day, stock: projected });
  }

  const maxStock = Math.max(item.currentStock, 10);

  const getX = (day: number) => paddingX + (day / daysToProject) * (width - 2 * paddingX);
  const getY = (stock: number) =>
    height - paddingY - (stock / maxStock) * (height - 2 * paddingY);

  const polyPoints = points.map((p) => `${getX(p.day)},${getY(p.stock)}`).join(" ");
  const runoutX = item.daysOfInventory <= daysToProject ? getX(item.daysOfInventory) : null;

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingSm">
            Inventory Depletion Curve: {item.title}
          </Text>
          <Text as="span" variant="bodyXs" tone="subdued">
            Current Stock: <strong>{item.currentStock}</strong> | Velocity:{" "}
            <strong>{item.dailyVelocity}/day</strong>
          </Text>
        </InlineStack>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
            {/* Grid baseline */}
            <line
              x1={paddingX}
              y1={height - paddingY}
              x2={width - paddingX}
              y2={height - paddingY}
              stroke="#8c9196"
              strokeWidth="1"
            />

            {/* Runout Date Marker */}
            {runoutX !== null && (
              <g>
                <line
                  x1={runoutX}
                  y1={paddingY}
                  x2={runoutX}
                  y2={height - paddingY}
                  stroke="#d72c0d"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <text
                  x={runoutX}
                  y={paddingY - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#d72c0d"
                  fontWeight="bold"
                >
                  Stockout: Day {item.daysOfInventory}
                </text>
              </g>
            )}

            {/* Stock Curve */}
            <polyline
              fill="none"
              stroke="#2c6ecb"
              strokeWidth="2.5"
              strokeLinecap="round"
              points={polyPoints}
            />

            {/* Start Node */}
            <circle
              cx={getX(0)}
              cy={getY(item.currentStock)}
              r="4"
              fill="#2c6ecb"
            />

            {/* Axis labels */}
            <text x={paddingX} y={height - 8} fontSize="10" fill="#6d7175">
              Today (Day 0)
            </text>
            <text x={width - paddingX} y={height - 8} fontSize="10" fill="#6d7175" textAnchor="end">
              Day {daysToProject}
            </text>
          </svg>
        </div>
      </BlockStack>
    </Card>
  );
}

export default ForecastChart;
