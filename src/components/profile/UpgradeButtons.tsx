"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/billing";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Button } from "@/components/ui/button";
import type { CheckoutPlan } from "@/lib/billing-schemas";

const GENERIC_ERROR = "Something went wrong. Try again.";

export function UpgradeButtons() {
  const [pendingPlan, setPendingPlan] = useState<CheckoutPlan | null>(null);

  // Going Back from Stripe can restore this page from the browser cache with the buttons still disabled
  useEffect(() => {
    function resetWhenRestored(event: PageTransitionEvent) {
      if (event.persisted) setPendingPlan(null);
    }
    window.addEventListener("pageshow", resetWhenRestored);
    return () => window.removeEventListener("pageshow", resetWhenRestored);
  }, []);

  async function startCheckout(plan: CheckoutPlan) {
    setPendingPlan(plan);
    try {
      const result = await createCheckoutSession(plan);
      if (!result.success) {
        toast.error(result.error);
        setPendingPlan(null);
        return;
      }
      window.location.assign(result.data.url);
    } catch {
      toast.error(GENERIC_ERROR);
      setPendingPlan(null);
    }
  }

  return (
    <ProfileSection title="Upgrade to Pro">
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={pendingPlan !== null}
          onClick={() => startCheckout("monthly")}
        >
          {pendingPlan === "monthly" ? "Redirecting..." : "$8 per month"}
        </Button>
        <Button
          variant="outline"
          disabled={pendingPlan !== null}
          onClick={() => startCheckout("yearly")}
        >
          {pendingPlan === "yearly" ? "Redirecting..." : "$72 per year"}
        </Button>
      </div>
    </ProfileSection>
  );
}
