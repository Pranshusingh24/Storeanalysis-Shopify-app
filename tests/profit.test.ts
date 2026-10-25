import { describe, it, expect } from "vitest";
import { calculateQualifiedProfitEstimate } from "~/services/profit.server";

describe("Qualified Profit & COGS Estimation", () => {
  it("calculates qualified gross margin and discloses exclusions", () => {
    const items = [
      { quantity: 2, salePrice: 1000, unitCost: 400 }, // Rev: 2000, Cost: 800
      { quantity: 1, salePrice: 500, unitCost: 200 },  // Rev: 500, Cost: 200
    ];

    const result = calculateQualifiedProfitEstimate(items);

    expect(result.totalRevenue).toBe(2500);
    expect(result.totalCostOfGoodsSold).toBe(1000);
    expect(result.qualifiedEstimatedGrossProfit).toBe(1500);
    expect(result.qualifiedGrossMarginPercent).toBe(60); // 1500 / 2500 = 60%
    expect(result.hasReliableCostData).toBe(true);
    expect(result.disclaimer).toContain("Does NOT represent Net Profit");
    expect(result.excludedExpenses.length).toBeGreaterThan(0);
  });

  it("flags unreliable cost data when variant costs are absent", () => {
    const items = [
      { quantity: 5, salePrice: 1000, unitCost: null },
      { quantity: 1, salePrice: 1000, unitCost: 300 },
    ];

    const result = calculateQualifiedProfitEstimate(items);
    expect(result.hasReliableCostData).toBe(false);
    expect(result.coveragePercent).toBeLessThan(50);
  });
});
