"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CheckoutPlan } from "@/lib/billing-schemas";
import {
  PRO_MONTHLY_PRICE,
  PRO_YEARLY_PRICE,
  PRO_YEARLY_SAVINGS,
} from "@/lib/plan-limits";
import type { ActionResult } from "@/types/actions";

type PendingAction = CheckoutPlan | "portal";

const GENERIC_ERROR = "Something went wrong. Try again.";

export function PlanCardSkeleton() {
  return (
    // Has the card's id so a /profile#plan link has a target before the card streams in, and the card replaces it in place
    <section
      id="plan"
      aria-hidden
      className="scroll-mt-6 rounded-xl border border-border bg-card p-5"
    >
      <Skeleton className="h-6 w-16" />
      <div className="mt-5 space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-40" />
        </div>
      </div>
    </section>
  );
}

export function PlanCard({ isPro }: { isPro: boolean }) {
  const [pending, setPending] = useState<PendingAction | null>(null);

  // Going Back from Stripe can restore this page from the browser cache with the buttons still disabled
  useEffect(() => {
    function resetWhenRestored(event: PageTransitionEvent) {
      if (event.persisted) setPending(null);
    }
    window.addEventListener("pageshow", resetWhenRestored);
    return () => window.removeEventListener("pageshow", resetWhenRestored);
  }, []);

  async function redirectToStripe(
    action: PendingAction,
    start: () => Promise<ActionResult<{ url: string }>>,
  ) {
    setPending(action);
    try {
      const result = await start();
      if (!result.success) {
        toast.error(result.error);
        setPending(null);
        return;
      }
      window.location.assign(result.data.url);
    } catch {
      toast.error(GENERIC_ERROR);
      setPending(null);
    }
  }

  if (isPro) {
    return (
      <ProfileSection id="plan" title="Plan">
        <div
          aria-busy={pending !== null}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-muted-foreground">
            You are on Pro. Change your card, see invoices or cancel in Stripe.
          </p>
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() => redirectToStripe("portal", createPortalSession)}
          >
            {pending === "portal" ? "Redirecting..." : "Manage billing"}
          </Button>
        </div>
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      id="plan"
      title="Plan"
      description="You are on the free plan. Pro removes the item and collection limits."
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {`Pro costs $${PRO_MONTHLY_PRICE} per month or $${PRO_YEARLY_PRICE} per year, which saves $${PRO_YEARLY_SAVINGS} a year.`}
        </p>
        <div aria-busy={pending !== null} className="flex flex-wrap gap-3">
          <Button
            disabled={pending !== null}
            onClick={() =>
              redirectToStripe("monthly", () =>
                createCheckoutSession("monthly"),
              )
            }
          >
            {pending === "monthly"
              ? "Redirecting..."
              : `Upgrade, $${PRO_MONTHLY_PRICE} per month`}
          </Button>
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() =>
              redirectToStripe("yearly", () => createCheckoutSession("yearly"))
            }
          >
            {pending === "yearly"
              ? "Redirecting..."
              : `Upgrade, $${PRO_YEARLY_PRICE} per year`}
          </Button>
        </div>
      </div>
    </ProfileSection>
  );
}
