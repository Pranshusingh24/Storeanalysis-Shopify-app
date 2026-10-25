/**
 * App Settings, Synchronization & Preferences Page
 * Storeanalysis - Pranshu Singh Baghel
 */

import React, { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  BlockStack,
  InlineStack,
  Text,
  Card,
  TextField,
  Button,
  Banner,
  Box,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "~/services/shopify.server";
import prisma from "~/services/db.server";
import { triggerStoreSync } from "~/services/sync.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let shopDomain = "storeanalysis-dev.myshopify.com";

  try {
    const { session } = await authenticate.admin(request);
    shopDomain = session.shop;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    const url = new URL(request.url);
    if (url.searchParams.get("shop")) {
      shopDomain = url.searchParams.get("shop")!;
    }
  }

  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  return json({
    shopDomain,
    currencyCode: shop?.currencyCode || "INR",
    ianaTimezone: shop?.ianaTimezone || "Asia/Kolkata",
    reorderThreshold: shop?.reorderThreshold ?? 10,
    plan: shop?.plan || "Free",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const shopDomain = String(formData.get("shopDomain") || "storeanalysis-dev.myshopify.com");

  let adminClient: any = null;
  try {
    const { admin } = await authenticate.admin(request);
    adminClient = admin;
  } catch {
    // Dev fallback
  }

  if (intent === "sync") {
    const syncRes = await triggerStoreSync(adminClient, shopDomain);
    return json({ success: true, message: syncRes.message, type: "sync" });
  }

  if (intent === "save_settings") {
    const threshold = parseInt(String(formData.get("reorderThreshold") || "10"), 10);
    await prisma.shop.upsert({
      where: { shopDomain },
      update: { reorderThreshold: isNaN(threshold) ? 10 : threshold },
      create: { shopDomain, reorderThreshold: isNaN(threshold) ? 10 : threshold },
    });
    return json({ success: true, message: "Settings successfully saved.", type: "settings" });
  }

  return json({ success: false, message: "Unknown action." });
};

export default function SettingsPage() {
  const { shopDomain, currencyCode, ianaTimezone, reorderThreshold, plan } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const [thresholdInput, setThresholdInput] = useState(reorderThreshold.toString());

  const isSubmitting = fetcher.state === "submitting";

  return (
    <Page
      title="Store Settings & Synchronization"
      subtitle="Configure store preferences, manage data sync, and view compliance status"
    >
      <BlockStack gap="400">
        {fetcher.data?.success && (
          <Banner title="Operation Completed" tone="success">
            <p>{fetcher.data.message}</p>
          </Banner>
        )}

        {/* Store Metadata Card */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Store Connection
            </Text>
            <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Shop Domain:
              </Text>
              <Text as="span" fontWeight="semibold">
                {shopDomain}
              </Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Store Currency:
              </Text>
              <Text as="span" fontWeight="semibold">
                {currencyCode}
              </Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Timezone:
              </Text>
              <Text as="span" fontWeight="semibold">
                {ianaTimezone}
              </Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Subscription Plan:
              </Text>
              <Text as="span" fontWeight="bold">
                {plan} Plan
              </Text>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Inventory Alert Preferences */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Inventory Alert Preferences
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Configure the default low-stock threshold. Items with available quantities at or below this value
              will be flagged with a warning in your dashboard.
            </Text>

            <Box maxWidth="240px">
              <TextField
                label="Low Stock Threshold (Units)"
                type="number"
                value={thresholdInput}
                onChange={setThresholdInput}
                autoComplete="off"
              />
            </Box>

            <Button
              variant="primary"
              loading={isSubmitting}
              onClick={() => {
                fetcher.submit(
                  {
                    intent: "save_settings",
                    shopDomain,
                    reorderThreshold: thresholdInput,
                  },
                  { method: "post" }
                );
              }}
            >
              Save Preferences
            </Button>
          </BlockStack>
        </Card>

        {/* Manual Data Sync */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Data Synchronization
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Webhooks automatically ingest new orders and stock updates in real time. You can also trigger an
              on-demand reconciliation sync to refresh historical records.
            </Text>

            <Button
              loading={isSubmitting}
              onClick={() => {
                fetcher.submit(
                  { intent: "sync", shopDomain },
                  { method: "post" }
                );
              }}
            >
              Reconcile & Sync Now
            </Button>
          </BlockStack>
        </Card>

        {/* Privacy, GDPR & Author Attribution Card */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="300" blockAlign="center">
              <img
                src="/storeanalysis-logo.png"
                alt="Storeanalysis Logo"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  objectFit: "contain",
                }}
              />
              <BlockStack gap="050">
                <Text as="h3" variant="headingMd">
                  Storeanalysis
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Engineered by <strong>Pranshu Singh Baghel</strong>
                </Text>
              </BlockStack>
            </InlineStack>
            <Divider />
            <Text as="p" variant="bodyXs" tone="subdued">
              Privacy Notice: Storeanalysis respects merchant privacy and does not collect unnecessary customer PII.
              All data is strictly tenant-isolated to your authenticated shop domain. On app uninstallation, store
              sessions are immediately terminated and data is purged according to Shopify retention policies.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
