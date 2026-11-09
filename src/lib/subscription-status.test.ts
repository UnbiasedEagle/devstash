import { describe, expect, it } from "vitest";
import { getSubscriptionAccess } from "@/lib/subscription-status";

describe("getSubscriptionAccess", () => {
  it.each(["active", "trialing"] as const)("grants Pro for %s", (status) => {
    expect(getSubscriptionAccess(status)).toBe("grant");
  });

  it.each(["canceled", "unpaid", "incomplete_expired"] as const)(
    "revokes Pro for %s",
    (status) => {
      expect(getSubscriptionAccess(status)).toBe("revoke");
    },
  );

  it.each(["past_due", "incomplete", "paused"] as const)(
    "keeps the current access while the subscription is %s",
    (status) => {
      expect(getSubscriptionAccess(status)).toBe("keep");
    },
  );
});
