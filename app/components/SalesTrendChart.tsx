/**
 * Interactive SVG Sales Trend Chart
 * Storeanalysis - Pranshu Singh Baghel
 */

import React, { useState } from "react";
import { Card, Text, BlockStack, InlineStack, Box } from "@shopify/polaris";
import type { DailyTrendPoint } from "~/types";
import { formatMoney } from "~/utils/money";

interface SalesTrendChartProps {
  data: DailyTrendPoint[];
  currency?: string;
  title?: string;
}

export function SalesTrendChart({
  data,
  currency = "INR",
  title = "Revenue & Sales Performance Trend",
}: SalesTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrendPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            {title}
          </Text>
          <Box padding="400">
            <Text as="p" tone="subdued">
              No trend data available for the selected timeframe.
            </Text>
          </Box>
        </BlockStack>
      </Card>
    );
  }

  const height = 260;
  const width = 800;
  const paddingX = 50;
  const paddingY = 40;

  const maxVal = Math.max(...data.map((d) => d.grossSales), 100);
  const minVal = 0;

  const getX = (index: number) => {
    if (data.length <= 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
  };

  // Generate SVG Path for Gross Sales Line
  const grossPoints = data.map((d, i) => `${getX(i)},${getY(d.grossSales)}`).join(" ");
  const netPoints = data.map((d, i) => `${getX(i)},${getY(d.netSales)}`).join(" ");

  // Generate Area Fill Path
  const areaPath = `M ${getX(0)},${getY(data[0].grossSales)} ${data
    .slice(1)
    .map((d, i) => `L ${getX(i + 1)},${getY(d.grossSales)}`)
    .join(" ")} L ${getX(data.length - 1)},${height - paddingY} L ${getX(0)},${
    height - paddingY
  } Z`;

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="h3" variant="headingMd">
              {title}
            </Text>
            <Text as="span" variant="bodyXs" tone="subdued">
              Comparing Gross vs Net Sales over time
            </Text>
          </BlockStack>

          <InlineStack gap="300" blockAlign="center">
            <InlineStack gap="100" blockAlign="center">
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  backgroundColor: "#2c6ecb",
                }}
              />
              <Text as="span" variant="bodyXs">
                Gross Sales
              </Text>
            </InlineStack>
            <InlineStack gap="100" blockAlign="center">
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  backgroundColor: "#008060",
                }}
              />
              <Text as="span" variant="bodyXs">
                Net Sales
              </Text>
            </InlineStack>
          </InlineStack>
        </InlineStack>

        {hoveredPoint && (
          <Box
            background="bg-surface-secondary"
            padding="200"
            borderRadius="200"
          >
            <InlineStack gap="400" align="center">
              <Text as="span" variant="bodySm" fontWeight="bold">
                {hoveredPoint.label} ({hoveredPoint.date})
              </Text>
              <Text as="span" variant="bodySm">
                Gross: <strong>{formatMoney(hoveredPoint.grossSales, currency)}</strong>
              </Text>
              <Text as="span" variant="bodySm">
                Net: <strong>{formatMoney(hoveredPoint.netSales, currency)}</strong>
              </Text>
              <Text as="span" variant="bodySm">
                Orders: <strong>{hoveredPoint.orderCount}</strong>
              </Text>
            </InlineStack>
          </Box>
        )}

        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2c6ecb" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2c6ecb" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = height - paddingY - ratio * (height - 2 * paddingY);
              const val = Math.round(minVal + ratio * (maxVal - minVal));
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e1e3e5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#6d7175"
                  >
                    {val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#salesGradient)" />

            {/* Gross Sales Polyline */}
            <polyline
              fill="none"
              stroke="#2c6ecb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={grossPoints}
            />

            {/* Net Sales Polyline */}
            <polyline
              fill="none"
              stroke="#008060"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 3"
              points={netPoints}
            />

            {/* Interactive Circles */}
            {data.map((d, i) => (
              <g
                key={i}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={getX(i)}
                  cy={getY(d.grossSales)}
                  r={hoveredPoint?.date === d.date ? 6 : 3.5}
                  fill="#ffffff"
                  stroke="#2c6ecb"
                  strokeWidth="2"
                />
                {/* Invisible larger target for easy hovering */}
                <circle
                  cx={getX(i)}
                  cy={getY(d.grossSales)}
                  r="12"
                  fill="transparent"
                />
              </g>
            ))}

            {/* X-Axis Labels */}
            {data
              .filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1)
              .map((d, i, arr) => {
                const originalIndex = data.findIndex((item) => item.date === d.date);
                const x = getX(originalIndex);
                const anchor = i === 0 ? "start" : i === arr.length - 1 ? "end" : "middle";
                return (
                  <text
                    key={d.date}
                    x={x}
                    y={height - 15}
                    textAnchor={anchor}
                    fontSize="11"
                    fill="#6d7175"
                  >
                    {d.label}
                  </text>
                );
              })}
          </svg>
        </div>
      </BlockStack>
    </Card>
  );
}

export default SalesTrendChart;
