import { describe, expect, it } from "vitest";
import { checkoutPlanSchema, parseCheckoutResult } from "@/lib/billing-schemas";

describe("checkoutPlanSchema", () => {
  it("accepts only monthly and yearly", () => {
    expect(checkoutPlanSchema.safeParse("monthly").success).toBe(true);
    expect(checkoutPlanSchema.safeParse("yearly").success).toBe(true);
    expect(checkoutPlanSchema.safeParse("weekly").success).toBe(false);
    expect(checkoutPlanSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("parseCheckoutResult", () => {
  it("accepts the two return states and ignores anything else", () => {
    expect(parseCheckoutResult("success")).toBe("success");
    expect(parseCheckoutResult("cancelled")).toBe("cancelled");
    expect(parseCheckoutResult("paid")).toBeUndefined();
    expect(parseCheckoutResult(null)).toBeUndefined();
    expect(parseCheckoutResult(undefined)).toBeUndefined();
  });
});
