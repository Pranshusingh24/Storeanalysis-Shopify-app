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
});
