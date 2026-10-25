/**
 * Webhook: APP_UNINSTALLED
 * Storeanalysis - Pranshu Singh Baghel
 */

import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/services/shopify.server";
import { processAppUninstalledWebhook } from "~/services/webhooks.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`[Webhook] Received ${topic} for shop: ${shop}`);

  if (shop) {
    await processAppUninstalledWebhook(shop);
  }

  return new Response("OK", { status: 200 });
};
