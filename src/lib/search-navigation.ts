const COLLECTION_PAGE = /^\/collections\/[^/]+$/;

// Only these pages render the item drawer, and the type page can only show items of its own type
function canShowItem(pathname: string, typeName: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname === "/search" ||
    COLLECTION_PAGE.test(pathname) ||
    pathname === `/items/${typeName.toLowerCase()}`
  );
}

export function resolveItemHref(
  pathname: string,
  currentParams: URLSearchParams,
  item: { id: string; typeName: string },
): string {
  if (!canShowItem(pathname, item.typeName)) {
    return `/dashboard?item=${encodeURIComponent(item.id)}`;
  }
  const params = new URLSearchParams(currentParams);
  params.set("item", item.id);
  return `${pathname}?${params.toString()}`;
}

export function searchResultsHref(query: string): string {
  return `/search?${new URLSearchParams({ q: query }).toString()}`;
}
