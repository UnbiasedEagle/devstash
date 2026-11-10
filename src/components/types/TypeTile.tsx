import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

// The color is data chosen by the user, so it can't be a Tailwind class
export default function TypeTile({
  icon,
  color,
}: {
  icon: string;
  color: string;
}) {
  const Icon = ITEM_TYPE_ICONS[icon];
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-lg"
      style={{ backgroundColor: `${color}1f` }}
    >
      {Icon && <Icon className="size-4" style={{ color }} />}
    </span>
  );
}
