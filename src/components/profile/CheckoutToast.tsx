"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  parseCheckoutResult,
  type CheckoutResult,
} from "@/lib/billing-schemas";

const MESSAGES: Record<CheckoutResult, string> = {
  success: "Payment received, upgrading your account",
  cancelled: "Checkout cancelled",
};

export function CheckoutToast() {
  const router = useRouter();
  const pathname = usePathname();
  const result = parseCheckoutResult(useSearchParams().get("checkout"));

  useEffect(() => {
    if (!result) return;
    toast.info(MESSAGES[result], { id: "checkout-result" });
    router.replace(pathname);
  }, [result, pathname, router]);

  return null;
}
