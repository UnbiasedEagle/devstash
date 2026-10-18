import { ProfileSection } from "@/components/profile/ProfileSection";

export function GitHubOnlyNote() {
  return (
    <ProfileSection title="Password">
      <p className="text-sm text-muted-foreground">
        Your account signs in with GitHub, so there is no password to manage
        here.
      </p>
    </ProfileSection>
  );
}
