import ItemDetail, { ItemNotFound } from "@/components/items/ItemDetail";
import type { DetailItem } from "@/types/items";

export default async function OpenItemContent({
  itemPromise,
}: {
  itemPromise: Promise<DetailItem | null>;
}) {
  const item = await itemPromise;
  return item ? <ItemDetail item={item} /> : <ItemNotFound />;
}
