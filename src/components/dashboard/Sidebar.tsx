import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, Folder, Layers, Star } from "lucide-react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import MobileAccountCard, {
  MobileAccountCardSkeleton,
} from "@/components/dashboard/MobileAccountCard";
import ProBadge from "@/components/dashboard/ProBadge";
import SignOutButton from "@/components/dashboard/SignOutButton";
import UserMenu from "@/components/dashboard/UserMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypeCounts } from "@/lib/db/item-types";
import { getCurrentUser } from "@/lib/db/user";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { getInitials } from "@/lib/user-initials";

const FAVORITE_COLLECTION_LIMIT = 10;
const RECENT_COLLECTION_LIMIT = 4;
const PRO_TYPE_NAMES = ["file", "image"];

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="px-3 pb-1 pt-3 text-xs font-medium text-muted-foreground">
      {children}
    </h3>
  );
}

function EmptyLabel({ children }: { children: string }) {
  return <p className="px-3 py-2 text-sm text-muted-foreground">{children}</p>;
}

const COLLAPSED_INVISIBLE = "md:group-data-[collapsed=true]/sidebar:invisible";
const COLLAPSED_HIDDEN = "md:group-data-[collapsed=true]/sidebar:hidden";

const rowClass =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent";

const TYPE_SKELETON_ROWS = 7;
const FAVORITE_SKELETON_ROWS = 3;

function RowSkeleton() {
  return (
    <div aria-hidden className={rowClass}>
      <Skeleton className="size-4" />
      <Skeleton className={`h-4 flex-1 ${COLLAPSED_INVISIBLE}`} />
    </div>
  );
}

function SidebarNavSkeleton() {
  return (
    <nav className="flex-1 overflow-x-hidden overflow-y-auto px-2 pb-4">
      <CollapsibleSection title="Types">
        {Array.from({ length: TYPE_SKELETON_ROWS }, (_, index) => (
          <RowSkeleton key={index} />
        ))}
      </CollapsibleSection>

      <div className={`mx-1 mt-3 border-t border-border ${COLLAPSED_INVISIBLE}`} />
      <div className={COLLAPSED_INVISIBLE}>
        <CollapsibleSection title="Collections">
          <SectionLabel>Favorites</SectionLabel>
          {Array.from({ length: FAVORITE_SKELETON_ROWS }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
          <SectionLabel>Recent</SectionLabel>
          {Array.from({ length: RECENT_COLLECTION_LIMIT }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
        </CollapsibleSection>
      </div>
    </nav>
  );
}

function SidebarUserSkeleton() {
  return (
    <UserAreaShell>
      <Skeleton aria-hidden className="size-9 shrink-0 rounded-full" />
      <div
        aria-hidden
        className={`min-w-0 flex-1 space-y-1.5 ${COLLAPSED_INVISIBLE}`}
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </UserAreaShell>
  );
}

async function SidebarNav() {
  await connection();
  const user = await getCurrentUser();
  const [itemTypes, collections] = await Promise.all([
    getItemTypeCounts(user.id),
    getSidebarCollections(
      user.id,
      FAVORITE_COLLECTION_LIMIT,
      RECENT_COLLECTION_LIMIT,
    ),
  ]);

  return (
    <nav className="flex-1 overflow-x-hidden overflow-y-auto px-2 pb-4">
      <CollapsibleSection title="Types">
        {itemTypes.map((type) => {
          const Icon = ITEM_TYPE_ICONS[type.icon];
          return (
            <Link
              key={type.id}
              href={`/items/${type.name.toLowerCase()}`}
              aria-label={type.name}
              className={rowClass}
            >
              <Icon className="size-4" style={{ color: type.color }} />
              <span className={`flex-1 ${COLLAPSED_INVISIBLE}`}>
                {type.name}
              </span>
              {PRO_TYPE_NAMES.includes(type.name.toLowerCase()) && (
                <span className={COLLAPSED_INVISIBLE}>
                  <ProBadge />
                </span>
              )}
              <span className={`text-xs text-muted-foreground ${COLLAPSED_INVISIBLE}`}>
                {type.count}
              </span>
            </Link>
          );
        })}
      </CollapsibleSection>

      <div className={`mx-1 mt-3 border-t border-border ${COLLAPSED_INVISIBLE}`} />
      <div className={COLLAPSED_INVISIBLE}>
        <CollapsibleSection title="Collections">
          <SectionLabel>Favorites</SectionLabel>
          {collections.favorites.length === 0 && (
            <EmptyLabel>No favorites yet</EmptyLabel>
          )}
          {collections.favorites.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className={rowClass}
            >
              <Folder className="size-4" style={{ color: collection.color }} />
              <span className="flex-1">{collection.name}</span>
              <Star className="size-4 fill-yellow-500 text-yellow-500" />
            </Link>
          ))}

          <SectionLabel>Recent</SectionLabel>
          {collections.recent.length === 0 && (
            <EmptyLabel>No recent collections</EmptyLabel>
          )}
          {collections.recent.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className={rowClass}
            >
              <Folder className="size-4" style={{ color: collection.color }} />
              <span className="flex-1">{collection.name}</span>
              <span className="text-xs text-muted-foreground">
                {collection.itemCount}
              </span>
            </Link>
          ))}
        </CollapsibleSection>
      </div>
    </nav>
  );
}

function UserAreaShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-t border-border px-2.5 py-4 max-md:hidden">
      {children}
    </div>
  );
}

async function SidebarUser() {
  await connection();
  const user = await getCurrentUser();

  const avatar = (
    <Avatar className="size-9">
      {user.image && <AvatarImage src={user.image} alt={user.name} />}
      <AvatarFallback className="font-medium text-foreground">
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <UserAreaShell>
      <Link
        href="/profile"
        title="View your profile"
        className={`group/profile -ml-1.5 flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 ${COLLAPSED_HIDDEN}`}
      >
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/profile:translate-x-0.5" />
      </Link>
      <div className="hidden md:group-data-[collapsed=true]/sidebar:block">
        <UserMenu name={user.name} email={user.email}>
          {avatar}
        </UserMenu>
      </div>
      <SignOutButton
        className={`shrink-0 text-muted-foreground max-md:hidden ${COLLAPSED_HIDDEN}`}
      />
    </UserAreaShell>
  );
}

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col">
      <Link
        href="/dashboard"
        aria-label="DevStash dashboard"
        className="flex h-16 items-center gap-2 px-3"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 text-white">
          <Layers className="size-5" />
        </div>
        <span className={`text-lg font-semibold ${COLLAPSED_INVISIBLE}`}>
          DevStash
        </span>
      </Link>

      <Suspense fallback={<MobileAccountCardSkeleton />}>
        <MobileAccountCard />
      </Suspense>
      <Suspense fallback={<SidebarNavSkeleton />}>
        <SidebarNav />
      </Suspense>
      <Suspense fallback={<SidebarUserSkeleton />}>
        <SidebarUser />
      </Suspense>
    </div>
  );
}
