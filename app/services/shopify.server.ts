/**
 * Official Shopify App Configuration & Auth Client
 * Storeanalysis - Pranshu Singh Baghel
 */

import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  BillingInterval,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

export const MONTHLY_BASIC_PLAN = "Storeanalysis Basic Monthly";
export const MONTHLY_PRO_PLAN = "Storeanalysis Pro Monthly";

export const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "storeanalysis-key",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "storeanalysis-secret",
  scopes: (process.env.SCOPES || "read_orders,read_all_orders,read_products,read_inventory").split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "https://storeanalysis.local",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  apiVersion: ApiVersion.January25,
  billing: {
    [MONTHLY_BASIC_PLAN]: {
      lineItems: [
        {
          amount: 9.99,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
    [MONTHLY_PRO_PLAN]: {
      lineItems: [
        {
          amount: 29.99,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
