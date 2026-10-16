import { items } from "@/lib/mock-data";

export function latestUpdate(collectionId: string) {
  return items
    .filter((item) => item.collectionId === collectionId)
    .reduce((latest, item) => (item.updatedAt > latest ? item.updatedAt : latest), "");
}
