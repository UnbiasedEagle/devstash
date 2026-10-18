import Link from "next/link";
import { connection } from "next/server";
import { User } from "lucide-react";
import SignOutButton from "@/components/dashboard/SignOutButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/db/user";
import { getInitials } from "@/lib/user-initials";

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-3 mb-2 overflow-hidden rounded-xl border border-border bg-card md:hidden">
      {children}
    </div>
  );
}

export function MobileAccountCardSkeleton() {
  return (
    <CardShell>
      <div aria-hidden className="flex items-center gap-3 p-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="h-22 border-t border-border" />
    </CardShell>
  );
}

export default async function MobileAccountCard() {
  await connection();
  const user = await getCurrentUser();

  return (
    <CardShell>
      <div className="flex items-center gap-3 p-3">
        <Avatar className="size-10">
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback className="font-medium text-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="divide-y divide-border border-t border-border">
        <Link
          href="/profile"
          className="flex h-11 items-center gap-3 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <User className="size-4" />
          Profile
        </Link>
        <SignOutButton
          showLabel
          className="h-11 w-full justify-start gap-3 rounded-none px-3 text-muted-foreground hover:text-destructive"
        />
      </div>
    </CardShell>
  );
}
