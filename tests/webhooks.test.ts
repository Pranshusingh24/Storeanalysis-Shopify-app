import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyShopifyWebhookHmac } from "~/services/webhooks.server";

describe("Webhook Security & Verification", () => {
  const secret = "storeanalysis_test_secret_key_12345";
  const rawBody = JSON.stringify({ id: 1001, total_price: "2499.00" });

  it("verifies authentic Shopify webhook signature", () => {
    const validHmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    const isValid = verifyShopifyWebhookHmac(rawBody, validHmac, secret);
    expect(isValid).toBe(true);
  });

  it("rejects forged or tampered webhook payloads", () => {
    const forgedHmac = "invalid_base64_hmac_hash_value==";
    const isValid = verifyShopifyWebhookHmac(rawBody, forgedHmac, secret);
    expect(isValid).toBe(false);

    const tamperedBody = JSON.stringify({ id: 1001, total_price: "99999.00" });
    const validHmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    const isTamperedValid = verifyShopifyWebhookHmac(tamperedBody, validHmac, secret);
    expect(isTamperedValid).toBe(false);
  });
});
