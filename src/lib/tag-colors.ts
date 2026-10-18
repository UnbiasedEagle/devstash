const KNOWN_TAG_COLORS: Record<string, string> = {
  react: "#61dafb",
  nextjs: "#e5e5e5",
  typescript: "#3b82f6",
  javascript: "#f7df1e",
  python: "#fbbf24",
  node: "#6cc24a",
  css: "#a78bfa",
  tailwind: "#38bdf8",
  html: "#f97316",
  git: "#f05133",
  docker: "#2496ed",
  bash: "#4ade80",
  shell: "#4ade80",
  sql: "#60a5fa",
  database: "#60a5fa",
  prisma: "#5eead4",
  rust: "#fb923c",
  go: "#22d3ee",
  ai: "#c084fc",
  prompt: "#c084fc",
};

const HUE_STEPS = 360;

export function getTagColor(tag: string) {
  const known = KNOWN_TAG_COLORS[tag.toLowerCase()];
  if (known) return known;

  let hash = 0;
  for (const char of tag.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % HUE_STEPS;
  }
  return `oklch(0.78 0.12 ${hash})`;
}
