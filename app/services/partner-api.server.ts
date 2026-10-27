/**
 * Shopify Partner API Integration for Shopify App Pricing
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * References:
 * - https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing
 * - https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing/redirect-plan-selection-page
 * - https://shopify.dev/docs/api/partner/active-subscription
 */

export interface ActiveSubscriptionResult {
  billingPeriod: string;
  cancelAtEndOfCycle?: boolean;
  trialEndsAt?: string | null;
  currentBillingCycle?: {
    startTime: string;
    endTime: string;
  };
  items?: Array<{
    handle: string;
    description?: string;
    price?: {
      active: boolean;
      currency: string;
      amount?: string;
    };
  }>;
}

/**
 * Fetch active subscription from Shopify Partner API
 * Returns null if the store has no active subscription or if credentials are not configured.
 */
export async function fetchActiveSubscription(
  shopId: string
): Promise<ActiveSubscriptionResult | null> {
  const orgId = process.env.SHOPIFY_PARTNER_ORG_ID;
  const partnerAccessToken = process.env.SHOPIFY_PARTNER_API_ACCESS_TOKEN;
  const appGid = process.env.SHOPIFY_APP_GID;

  // If Partner API is not configured (e.g., local dev or legacy mode), skip gracefully
  if (!orgId || !partnerAccessToken || !appGid) {
    return null;
  }

  try {
    const res = await fetch(
      `https://partners.shopify.com/${orgId}/api/2026-07/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": partnerAccessToken,
        },
        body: JSON.stringify({
          query: `query ActiveSubscription($appId: ID!, $shopId: ID!) {
            activeSubscription(appId: $appId, shopId: $shopId) {
              billingPeriod
              cancelAtEndOfCycle
              trialEndsAt
              currentBillingCycle {
                startTime
                endTime
              }
              items {
                handle
                description
                price {
                  __typename
                  active
                  currency
                  ... on FlatRatePrice {
                    amount
                  }
                }
              }
            }
          }`,
          variables: {
            appId: appGid,
            shopId,
          },
        }),
      }
    );

    if (!res.ok) {
      console.warn(`[Partner API] Request failed with HTTP ${res.status}`);
      return null;
    }

    const { data, errors } = await res.json();
    if (errors) {
      console.warn(`[Partner API] GraphQL errors:`, errors);
      return null;
    }

    return data?.activeSubscription ?? null;
  } catch (error) {
    console.warn(`[Partner API] Error checking active subscription:`, error);
    return null;
  }
}
