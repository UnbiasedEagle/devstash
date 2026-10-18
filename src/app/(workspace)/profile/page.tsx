import { Suspense } from "react";
import { connection } from "next/server";
import AccountCard, {
  AccountCardSkeleton,
} from "@/components/profile/AccountCard";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountSection } from "@/components/profile/DeleteAccountSection";
import { EditNameForm } from "@/components/profile/EditNameForm";
import { GitHubOnlyNote } from "@/components/profile/GitHubOnlyNote";
import { SettingsSkeleton } from "@/components/profile/SettingsSkeleton";
import UsageCard, { UsageCardSkeleton } from "@/components/profile/UsageCard";
import { getProfile } from "@/lib/db/profile";
import { getCurrentUser } from "@/lib/db/user";

async function AccountSection() {
  await connection();
  const user = await getCurrentUser();
  const profile = await getProfile(user.id);
  return <AccountCard user={user} profile={profile} />;
}

async function UsageSection() {
  await connection();
  const user = await getCurrentUser();
  const profile = await getProfile(user.id);
  return <UsageCard profile={profile} />;
}

async function SettingsSection() {
  await connection();
  const user = await getCurrentUser();
  const profile = await getProfile(user.id);
  const hasPassword = profile.signInMethods.includes("credential");

  return (
    <>
      <EditNameForm key={user.name} initialName={user.name} />
      {hasPassword ? <ChangePasswordForm /> : <GitHubOnlyNote />}
      <DeleteAccountSection
        email={user.email}
        hasPassword={hasPassword}
        itemCount={profile.itemCount}
        collectionCount={profile.collectionCount}
      />
    </>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Suspense fallback={<AccountCardSkeleton />}>
        <AccountSection />
      </Suspense>
      <Suspense fallback={<UsageCardSkeleton />}>
        <UsageSection />
      </Suspense>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsSection />
      </Suspense>
    </div>
  );
}
