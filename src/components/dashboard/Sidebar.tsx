import Link from "next/link";
import { Folder, Layers, Settings, Star } from "lucide-react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { collections, currentUser, itemTypes, items } from "@/lib/mock-data";

const RECENT_COLLECTION_LIMIT = 4;

function latestUpdate(collectionId: string) {
  return items
    .filter((item) => item.collectionId === collectionId)
    .reduce((latest, item) => (item.updatedAt > latest ? item.updatedAt : latest), "");
}

const favoriteCollections = collections.filter((c) => c.isFavorite);
const recentCollections = collections
  .filter((c) => !c.isFavorite)
  .sort((a, b) => latestUpdate(b.id).localeCompare(latestUpdate(a.id)))
  .slice(0, RECENT_COLLECTION_LIMIT);

const initials = currentUser.name
  .split(" ")
  .map((part) => part[0])
  .join("")
  .slice(0, 2);

function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

const COLLAPSED_INVISIBLE = "md:group-data-[collapsed=true]/sidebar:invisible";

const rowClass =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent";

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
        {favoriteCollections.map((collection) => (
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
        {recentCollections.map((collection) => (
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

      <div className="flex items-center gap-3 border-t border-border px-2.5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {initials}
        </div>
        <div className={`min-w-0 flex-1 ${COLLAPSED_INVISIBLE}`}>
          <p className="truncate text-sm font-medium">{currentUser.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser.email}
          </p>
        </div>
        <Settings className={`size-4 text-muted-foreground ${COLLAPSED_INVISIBLE}`} />
      </div>
    </div>
  );
}
