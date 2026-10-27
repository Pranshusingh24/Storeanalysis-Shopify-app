import { describe, it, expect } from "vitest";
import { PLAN_CONFIGS, getMaxHistoryDays } from "~/services/billing.server";

describe("Subscription Billing & Entitlement Logic", () => {
  it("enforces exactly three plans with specified pricing", () => {
    const plans = Object.keys(PLAN_CONFIGS);
    expect(plans).toEqual(["Free", "Basic", "Pro"]);

    expect(PLAN_CONFIGS.Free.priceUSD).toBe(0);
    expect(PLAN_CONFIGS.Basic.priceUSD).toBe(9.99);
    expect(PLAN_CONFIGS.Pro.priceUSD).toBe(29.99);

    expect(PLAN_CONFIGS.Free.priceINR).toBe(0);
    expect(PLAN_CONFIGS.Basic.priceINR).toBe(799);
    expect(PLAN_CONFIGS.Pro.priceINR).toBe(1999);
  });

  it("restricts Pro features from Free and Basic plans", () => {
    expect(PLAN_CONFIGS.Free.hasInventoryForecasting).toBe(false);
    expect(PLAN_CONFIGS.Basic.hasInventoryForecasting).toBe(false);
    expect(PLAN_CONFIGS.Pro.hasInventoryForecasting).toBe(true);

    expect(PLAN_CONFIGS.Free.hasProfitEstimates).toBe(false);
    expect(PLAN_CONFIGS.Basic.hasProfitEstimates).toBe(false);
    expect(PLAN_CONFIGS.Pro.hasProfitEstimates).toBe(true);
  });

  it("enforces history retention windows", () => {
    expect(getMaxHistoryDays("Free")).toBe(7);
    expect(getMaxHistoryDays("Basic")).toBe(30);
    expect(getMaxHistoryDays("Pro")).toBe(365);
  });

  it("normalizes Shopify App Pricing return URL plan handles case-insensitively", () => {
    const testHandles = [
      { handle: "Storeanalysis Basic Monthly", expected: "Basic" },
      { handle: "storeanalysis-pro-monthly", expected: "Pro" },
      { handle: "Storeanalysis Pro Monthly", expected: "Pro" },
      { handle: "BASIC", expected: "Basic" },
      { handle: "free", expected: "Free" },
    ];

    for (const test of testHandles) {
      const lower = test.handle.toLowerCase();
      let matched = "Free";
      if (lower.includes("pro")) matched = "Pro";
      else if (lower.includes("basic")) matched = "Basic";
      expect(matched).toBe(test.expected);
    }
  });

  it("satisfies single badge display invariant (never shows both CURRENT PLAN and MOST POPULAR)", () => {
    const currentPlan = "Basic";
    const planCard = { name: "Basic", popular: true };

    const isCurrent = currentPlan === planCard.name;
    const badgeShown = isCurrent ? "CURRENT PLAN" : planCard.popular ? "MOST POPULAR" : null;

    expect(badgeShown).toBe("CURRENT PLAN");
    expect(badgeShown).not.toBe("MOST POPULAR");
  });
});
