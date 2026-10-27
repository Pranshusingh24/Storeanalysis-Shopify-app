/**
 * Subscription Pricing Modal Component
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Complies with official Shopify App Pricing Guidelines:
 * - https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing
 * - Recurring charges billed every 30 days in USD
 * - 7-day risk-free trials for paid plans
 * - Transparent tier comparison and feature entitlements
 * - Strict badge handling: ONLY 'CURRENT PLAN' shown when active (no overlapping badges)
 * - Safe redirect and billing submission handling
 */

import React from "react";
import {
  Modal,
  BlockStack,
  InlineStack,
  Text,
  Card,
  Grid,
  Button,
  Badge,
  List,
  Box,
  Divider,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import type { PlanTier } from "~/types";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: PlanTier;
  shopDomain?: string;
  initialSelectedPlan?: PlanTier;
}

export function PricingModal({
  open,
  onClose,
  currentPlan,
  shopDomain = "storeanalysis-dev.myshopify.com",
}: PricingModalProps) {
  const fetcher = useFetcher<{ success?: boolean; newPlan?: PlanTier }>();
  const isSubmitting = fetcher.state === "submitting";

  const plans: Array<{
    name: PlanTier;
    priceUSD: string;
    description: string;
    trialInfo?: string;
    popular?: boolean;
    features: string[];
  }> = [
    {
      name: "Free",
      priceUSD: "$0",
      description: "Essential store monitoring for new and early-stage stores.",
      trialInfo: "Free forever",
      features: [
        "Core store dashboard",
        "Recent orders list & fulfillment status",
        "Current stock inventory count",
        "7-day historical reporting window",
        "Community email support",
      ],
    },
    {
      name: "Basic",
      priceUSD: "$9.99",
      description: "Full sales reporting and automated inventory turnover alerts.",
      trialInfo: "7-day free trial included",
      popular: true,
      features: [
        "Everything in Free, plus:",
        "Complete sales & revenue trends",
        "Best-selling & slow-moving rankings",
        "Automated low-stock threshold alerts",
        "30-day historical window",
        "Standard priority email support",
      ],
    },
    {
      name: "Pro",
      priceUSD: "$29.99",
      description: "Advanced intelligence, replenishment forecasting & gross margins.",
      trialInfo: "7-day free trial included",
      features: [
        "Everything in Basic, plus:",
        "Inventory depletion forecasting & run-out dates",
        "Recommended reorder quantities with safety stock",
        "Qualified gross margin & COGS estimates",
        "Unlimited 365-day historical data retention",
        "Priority VIP merchant support",
      ],
    },
  ];

  const handleSelectPlan = (plan: PlanTier) => {
    fetcher.submit(
      { plan, shopDomain },
      { method: "post", action: "/app/pricing" }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Storeanalysis Subscription Plans"
      size="large"
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd" tone="subdued">
            Choose a plan that fits your store's scale. All paid subscriptions include a{" "}
            <strong>7-day free trial</strong> and are billed in USD every 30 days directly on your Shopify invoice.
          </Text>

          {/* Pricing Tier Grid */}
          <Grid>
            {plans.map((p) => {
              const isCurrent = currentPlan === p.name;

              return (
                <Grid.Cell key={p.name} columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                  <Card>
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingMd" fontWeight="bold">
                          {p.name}
                        </Text>
                        {/* Guideline requirement: Show ONLY 'CURRENT PLAN' when active, not both */}
                        {isCurrent ? (
                          <Badge tone="success">CURRENT PLAN</Badge>
                        ) : p.popular ? (
                          <Badge tone="attention">MOST POPULAR</Badge>
                        ) : null}
                      </InlineStack>

                      <BlockStack gap="050">
                        <InlineStack gap="100" blockAlign="baseline">
                          <Text as="span" variant="headingXl" fontWeight="bold">
                            {p.priceUSD}
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            / month
                          </Text>
                        </InlineStack>
                        {p.trialInfo && (
                          <Text as="span" variant="bodyXs" tone="success">
                            {p.trialInfo}
                          </Text>
                        )}
                      </BlockStack>

                      <Text as="p" variant="bodyXs" tone="subdued">
                        {p.description}
                      </Text>

                      <Box
                        paddingBlock="200"
                        borderBlockStartWidth="025"
                        borderBlockEndWidth="025"
                        borderColor="border"
                      >
                        <List type="bullet">
                          {p.features.map((f, idx) => (
                            <List.Item key={idx}>
                              <Text as="span" variant="bodyXs">
                                {f}
                              </Text>
                            </List.Item>
                          ))}
                        </List>
                      </Box>

                      <Button
                        variant={isCurrent ? "secondary" : p.popular ? "primary" : "secondary"}
                        disabled={isCurrent || isSubmitting}
                        onClick={() => handleSelectPlan(p.name)}
                        fullWidth
                      >
                        {isCurrent
                          ? "Active Plan"
                          : isSubmitting
                          ? "Processing..."
                          : `Choose ${p.name}`}
                      </Button>
                    </BlockStack>
                  </Card>
                </Grid.Cell>
              );
            })}
          </Grid>

          {/* Shopify App Pricing Compliance Policies */}
          <Box
            background="bg-surface-secondary"
            padding="300"
            borderRadius="200"
          >
            <BlockStack gap="150">
              <Text as="h4" variant="headingXs" fontWeight="semibold">
                Shopify Billing Transparency & Policies
              </Text>
              <Divider />
              <Text as="p" variant="bodyXs" tone="subdued">
                • <strong>Currency:</strong> Rates are billed in USD every 30 days. Shopify converts to your local billing currency at checkout.
              </Text>
              <Text as="p" variant="bodyXs" tone="subdued">
                • <strong>Free Trial:</strong> Paid plans include a 7-day free trial. Downgrade or cancel anytime before the trial ends without being charged.
              </Text>
              <Text as="p" variant="bodyXs" tone="subdued">
                • <strong>Manage Anytime:</strong> Cancel or change your subscription directly in Shopify Admin under Settings → Apps and sales channels.
              </Text>
            </BlockStack>
          </Box>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

export default PricingModal;
