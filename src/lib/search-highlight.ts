export interface TextSegment {
  text: string;
  match: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightSegments(
  text: string,
  words: string[],
): TextSegment[] {
  const needles = words.filter(Boolean);
  if (needles.length === 0) return [{ text, match: false }];

  // Longest first so "react" wins over "re" when both match at the same spot
  const alternatives = needles
    .toSorted((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");

  // With one capture group, split puts every match at an odd index
  return text
    .split(new RegExp(`(${alternatives})`, "gi"))
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((segment) => segment.text !== "");
}
