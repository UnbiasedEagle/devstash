"use client";

import Link from "next/link";
import { CheckEmailNotice } from "@/components/auth/CheckEmailNotice";

interface VerifyEmailNoticeProps {
  email: string;
  secondsLeft: number;
  isPending: boolean;
  onResend: () => void;
  onChangeEmail: () => void;
}

export function VerifyEmailNotice({ email, ...actions }: VerifyEmailNoticeProps) {
  return (
    <CheckEmailNotice
      {...actions}
      description={
        <>
          We sent a verification link to{" "}
          <span className="break-all text-foreground">{email}</span>. Open it to
          finish creating your account.
        </>
      }
      footer={
        <>
          Already verified?{" "}
          <Link
            href="/sign-in"
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    />
  );
}
