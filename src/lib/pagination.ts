export const ITEMS_PER_PAGE = 24;

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? "", 10);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}
