import { describe, it, expect } from "vitest";
import { calculateDeltaPercent, roundCurrency, formatMoney } from "~/utils/money";

describe("Analytics & Money Calculations", () => {
  it("correctly calculates positive percentage delta", () => {
    const delta = calculateDeltaPercent(120, 100);
    expect(delta).toBe(20);
  });

  it("correctly calculates negative percentage delta", () => {
    const delta = calculateDeltaPercent(80, 100);
    expect(delta).toBe(-20);
  });

  it("handles prior period of 0 safely without Infinity", () => {
    const delta = calculateDeltaPercent(500, 0);
    expect(delta).toBe(100);

    const zeroDelta = calculateDeltaPercent(0, 0);
    expect(zeroDelta).toBe(0);
  });

  it("rounds money amounts to 2 decimal places", () => {
    expect(roundCurrency(123.456)).toBe(123.46);
    expect(roundCurrency(100.1)).toBe(100.1);
  });

  it("formats INR currency correctly", () => {
    const formatted = formatMoney(1500, "INR");
    expect(formatted).toContain("1,500");
  });
});
