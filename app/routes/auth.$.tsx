/**
 * Shopify OAuth Catch-All Handler
 * Storeanalysis - Pranshu Singh Baghel
 */

import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/services/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};
