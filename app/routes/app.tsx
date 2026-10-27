/**
 * Embedded App Shell Layout with Polaris & App Bridge Navigation
 * Storeanalysis - Pranshu Singh Baghel
 */

import React, { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { Badge, InlineStack, Text, Box, Button } from "@shopify/polaris";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { authenticate } from "~/services/shopify.server";
import { getShopPlan } from "~/services/billing.server";
import { PricingModal } from "~/components/PricingModal";
import type { PlanTier } from "~/types";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let shopDomain = "storeanalysis-dev.myshopify.com";
  let plan: PlanTier = "Free";

  try {
    const { session } = await authenticate.admin(request);
    shopDomain = session.shop;
    plan = await getShopPlan(shopDomain);
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw OAuth redirects so App Bridge completes authentication!
    }
    const url = new URL(request.url);
    if (url.searchParams.get("shop")) {
      shopDomain = url.searchParams.get("shop")!;
    }
  }

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "75d14d5d475920324080eb0fcb850342",
    shopDomain,
    plan,
  });
};

export default function AppLayout() {
  const { apiKey, shopDomain, plan } = useLoaderData<typeof loader>();
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  const planBadgeTone: "success" | "info" | undefined =
    plan === "Pro" ? "success" : plan === "Basic" ? "info" : undefined;

  return (
    <ShopifyAppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Overview
        </Link>
        <Link to="/app/analytics">Analytics & Trends</Link>
        <Link to="/app/products">Product Performance</Link>
        <Link to="/app/inventory">Inventory Status</Link>
        <Link to="/app/orders">Orders Overview</Link>
        <Link to="/app/forecasting">Forecasting</Link>
        <Link to="/app/pricing">Plans & Billing</Link>
        <Link to="/app/settings">Settings & Sync</Link>
      </NavMenu>

      <Box minHeight="100vh" background="bg-surface-secondary">
        {/* App Top Utility Bar with Logo */}
        <Box
          padding="300"
          background="bg-surface"
          borderBlockEndWidth="025"
          borderColor="border"
        >
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="300" blockAlign="center">
              <img
                src="/storeanalysis-logo.png"
                alt="Storeanalysis"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  objectFit: "contain",
                }}
              />
              <InlineStack gap="200" blockAlign="center">
                <Text as="h1" variant="headingMd" fontWeight="bold">
                  Storeanalysis
                </Text>
                <Text as="span" variant="bodyXs" tone="subdued">
                  by Pranshu Singh Baghel
                </Text>
              </InlineStack>
            </InlineStack>

            <InlineStack gap="300" blockAlign="center">
              <Text as="span" variant="bodySm" tone="subdued">
                Store: <strong>{shopDomain}</strong>
              </Text>
              <Badge tone={planBadgeTone}>{`${plan} Plan`}</Badge>
              <Button
                size="micro"
                variant={plan === "Pro" ? "plain" : "primary"}
                onClick={() => setPricingModalOpen(true)}
              >
                {plan === "Pro" ? "Manage Plan" : "Upgrade"}
              </Button>
            </InlineStack>
          </InlineStack>
        </Box>

        {/* Embedded Page Content */}
        <Box padding="400">
          <Outlet />
        </Box>

        {/* Global Pricing Modal accessible anywhere */}
        <PricingModal
          open={pricingModalOpen}
          onClose={() => setPricingModalOpen(false)}
          currentPlan={plan}
          shopDomain={shopDomain}
        />
      </Box>
    </ShopifyAppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
