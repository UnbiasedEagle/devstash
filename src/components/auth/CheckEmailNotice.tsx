"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface CheckEmailNoticeProps {
  description: ReactNode;
  footer: ReactNode;
  secondsLeft: number;
  isPending: boolean;
  onResend: () => void;
  onChangeEmail: () => void;
}

export function CheckEmailNotice({
  description,
  footer,
  secondsLeft,
  isPending,
  onResend,
  onChangeEmail,
}: CheckEmailNoticeProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={isPending || secondsLeft > 0}
          onClick={onResend}
        >
          {secondsLeft > 0 ? `Resend email in ${secondsLeft}s` : "Resend email"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onChangeEmail}
        >
          Use a different email
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}
