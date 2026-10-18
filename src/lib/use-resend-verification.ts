"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const COOLDOWN_MS = 60_000;

export function useResendVerification() {
  // Refs guard toast actions, whose closures keep a stale copy of the state below
  const cooldownEndsAtRef = useRef(0);
  const isPendingRef = useRef(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [now, setNow] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const secondsLeft = Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000));
  const isCoolingDown = secondsLeft > 0;

  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [isCoolingDown]);

  function startCooldown() {
    const startedAt = Date.now();
    cooldownEndsAtRef.current = startedAt + COOLDOWN_MS;
    setNow(startedAt);
    setCooldownEndsAt(startedAt + COOLDOWN_MS);
  }

  async function resend(email: string) {
    const remainingMs = cooldownEndsAtRef.current - Date.now();
    if (remainingMs > 0) {
      toast.info(
        `Wait ${Math.ceil(remainingMs / 1000)}s before sending another email`,
      );
      return;
    }
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setIsPending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({ email });
      if (error) {
        toast.error(error.message ?? "Could not send the email");
        return;
      }
      toast.success("Verification email sent");
      startCooldown();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  }

  return { resend, startCooldown, secondsLeft, isPending };
}
