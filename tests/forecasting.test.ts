import { describe, it, expect } from "vitest";
import { computeInventoryForecast } from "~/services/forecasting.server";

describe("Inventory Forecasting Engine", () => {
  it("rejects forecast if historical data is insufficient (less than min days)", () => {
    const forecast = computeInventoryForecast(
      {
        productGid: "gid://shopify/Product/1",
        title: "Test Item",
        currentStock: 50,
        salesHistory: [
          { date: "2026-10-01", unitsSold: 2 },
          { date: "2026-10-02", unitsSold: 3 },
        ],
      },
      14 // Min 14 days required
    );

    expect(forecast.isSufficientData).toBe(false);
    expect(forecast.urgency).toBe("INSUFFICIENT_DATA");
    expect(forecast.projectedRunoutDate).toBe("N/A");
  });

  it("calculates accurate velocity, days of inventory, and urgency when data is sufficient", () => {
    // 14 days with 2 units sold per day = 28 units sold = 2 units/day velocity
    const history = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      unitsSold: 2,
    }));

    const forecast = computeInventoryForecast(
      {
        productGid: "gid://shopify/Product/2",
        title: "Classic Cotton Tee",
        currentStock: 10, // 10 units at 2/day = 5 days of inventory
        salesHistory: history,
        leadTimeDays: 14,
        safetyStockDays: 7,
      },
      14
    );

    expect(forecast.isSufficientData).toBe(true);
    expect(forecast.dailyVelocity).toBe(2);
    expect(forecast.daysOfInventory).toBe(5);
    expect(forecast.urgency).toBe("URGENT"); // <= 7 days is URGENT
    // Target buffer = (14 + 7) * 2 = 42 units. Current stock = 10. Reorder = 32 units.
    expect(forecast.recommendedReorderQty).toBe(32);
  });
});
