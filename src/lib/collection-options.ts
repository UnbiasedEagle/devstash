import type { CollectionOption } from "@/types/items";

// The list and the item are read separately, so the item's own collection can be missing from it (renamed or removed in between). Without it the select would show "None" while the old id is still what gets saved
export function includeCollection(
  options: CollectionOption[],
  current: CollectionOption | null,
): CollectionOption[] {
  if (!current || options.some(({ id }) => id === current.id)) return options;
  return [...options, current];
}
