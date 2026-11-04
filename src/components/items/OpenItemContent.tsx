import ItemDetail, { ItemNotFound } from "@/components/items/ItemDetail";
import { getCollectionOptions } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/db/user";
import type { DetailItem } from "@/types/items";

export default async function OpenItemContent({
  itemPromise,
}: {
  itemPromise: Promise<DetailItem | null>;
}) {
  const [item, collections] = await Promise.all([
    itemPromise,
    getCurrentUserId().then(getCollectionOptions),
  ]);
  return item ? (
    <ItemDetail item={item} collections={collections} />
  ) : (
    <ItemNotFound />
  );
}
