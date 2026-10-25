/**
 * Public Root / Landing Route
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Automatically redirects Shopify Admin iframe requests from `/` to `/app`
 * preserving all query parameters (shop, host, embedded, hmac, id_token).
 */

import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  return redirect(search ? `/app?${search}` : "/app");
};

export default function Index() {
  return null;
}
