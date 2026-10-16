import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Folder, Layers, Settings, Star } from "lucide-react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypeCounts } from "@/lib/db/item-types";
import { getCurrentUser } from "@/lib/db/user";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

const RECENT_COLLECTION_LIMIT = 4;

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

const rowClass =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent";

async function SidebarNav() {
  await connection();
  const user = await getCurrentUser();
  const [itemTypes, collections] = await Promise.all([
    getItemTypeCounts(user.id),
    getSidebarCollections(user.id, RECENT_COLLECTION_LIMIT),
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
              className={rowClass}
            >
              <Icon className="size-4" style={{ color: type.color }} />
              <span className={`flex-1 ${COLLAPSED_INVISIBLE}`}>
                {type.name}
              </span>
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
              <Folder className="size-4 text-muted-foreground" />
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
              <Folder className="size-4 text-muted-foreground" />
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
    <div className="flex items-center gap-3 border-t border-border px-2.5 py-4">
      {children}
    </div>
  );
}

async function SidebarUser() {
  await connection();
  const user = await getCurrentUser();
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <UserAreaShell>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
        {initials}
      </div>
      <div className={`min-w-0 flex-1 ${COLLAPSED_INVISIBLE}`}>
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Settings className={`size-4 text-muted-foreground ${COLLAPSED_INVISIBLE}`} />
    </UserAreaShell>
  );
}

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col">
      <div className="flex h-16 items-center gap-2 px-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 text-white">
          <Layers className="size-5" />
        </div>
        <span className={`text-lg font-semibold ${COLLAPSED_INVISIBLE}`}>
          DevStash
        </span>
      </div>

      <Suspense fallback={<div className="flex-1" />}>
        <SidebarNav />
      </Suspense>
      <Suspense
        fallback={
          <UserAreaShell>
            <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
          </UserAreaShell>
        }
      >
        <SidebarUser />
      </Suspense>
    </div>
  );
}
