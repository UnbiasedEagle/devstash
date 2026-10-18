"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface VerifyEmailNoticeProps {
  email: string;
  secondsLeft: number;
  isPending: boolean;
  onResend: () => void;
  onChangeEmail: () => void;
}

export function VerifyEmailNotice({
  email,
  secondsLeft,
  isPending,
  onResend,
  onChangeEmail,
}: VerifyEmailNoticeProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="break-all text-foreground">{email}</span>. Open it to
          finish creating your account.
        </p>
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
      <p className="text-sm text-muted-foreground">
        Already verified?{" "}
        <Link
          href="/sign-in"
          className="text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
