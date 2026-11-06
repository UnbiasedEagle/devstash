export function tagHref(name: string): string {
  return `/tags/${encodeURIComponent(name)}`;
}
