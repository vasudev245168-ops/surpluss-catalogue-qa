import { describe, expect, it } from "vitest";
import { discountPercent } from "./pricing";

describe("discountPercent", () => {
  it("should calculate the discount percentage from MRP and offer price", () => {
    const result = discountPercent({
      priceOnRequest: false,
      mrp: 1000,
      offerPrice: 800,
    });

    expect(result).toBe(20);
  });

  it("should return 0 when price is on request", () => {
    const result = discountPercent({
      priceOnRequest: true,
      mrp: 1000,
      offerPrice: 800,
    });

    expect(result).toBe(0);
  });

  it("should return 0 when MRP is missing", () => {
    const result = discountPercent({
      priceOnRequest: false,
      mrp: null,
      offerPrice: 800,
    });

    expect(result).toBe(0);
  });

  it("should return 0 when offer price is missing", () => {
    const result = discountPercent({
      priceOnRequest: false,
      mrp: 1000,
      offerPrice: null,
    });

    expect(result).toBe(0);
  });

  it("should round the discount percentage", () => {
    const result = discountPercent({
      priceOnRequest: false,
      mrp: 999,
      offerPrice: 799,
    });

    expect(result).toBe(20);
  });
});