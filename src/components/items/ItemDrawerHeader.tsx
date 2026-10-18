import TagChip from "@/components/items/TagChip";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import type { DrawerPreview } from "@/types/items";

export default function ItemDrawerHeader({
  title,
  description,
  tags,
  itemType,
}: Omit<DrawerPreview, "id">) {
  const Icon = ITEM_TYPE_ICONS[itemType.icon];

  return (
    <>
      <header className="flex flex-col gap-3 pr-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-md"
            style={{ backgroundColor: `${itemType.color}1f` }}
          >
            {Icon && (
              <Icon className="size-4" style={{ color: itemType.color }} />
            )}
          </span>
          {itemType.name}
        </div>
        <SheetTitle className="font-mono">{title}</SheetTitle>
        {description && <SheetDescription>{description}</SheetDescription>}
      </header>

      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </ul>
      )}
    </>
  );
}
