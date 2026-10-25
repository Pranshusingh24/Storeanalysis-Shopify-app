/**
 * Webhook: ORDERS_CREATE
 * Storeanalysis - Pranshu Singh Baghel
 */

import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/services/shopify.server";
import { processOrderWebhook } from "~/services/webhooks.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  if (shop && payload) {
    await processOrderWebhook(shop, topic, payload);
  }

  return new Response("OK", { status: 200 });
};
