import { Suspense } from "react";
import { GitHubIcon } from "@/components/auth/GitHubIcon";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { OAuthErrorToast } from "@/components/auth/OAuthErrorToast";

export function OAuthSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>
      <OAuthButton
        provider="github"
        label="Continue with GitHub"
        icon={<GitHubIcon />}
      />
      <Suspense>
        <OAuthErrorToast />
      </Suspense>
    </div>
  );
}
