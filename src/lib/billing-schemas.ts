import { z } from "zod";

export const checkoutPlanSchema = z.enum(["monthly", "yearly"]);

export type CheckoutPlan = z.infer<typeof checkoutPlanSchema>;

export const checkoutResultSchema = z.enum(["success", "cancelled"]);

export type CheckoutResult = z.infer<typeof checkoutResultSchema>;

// The `?checkout=` search param Stripe's return URLs carry back to /profile
export function parseCheckoutResult(
  value: string | null | undefined,
): CheckoutResult | undefined {
  return checkoutResultSchema.safeParse(value).data;
}
