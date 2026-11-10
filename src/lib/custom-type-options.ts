export const CUSTOM_TYPE_ICON_NAMES = [
  "BookOpen",
  "Bookmark",
  "Box",
  "Briefcase",
  "Bug",
  "Database",
  "FileText",
  "Globe",
  "Key",
  "Lightbulb",
  "ListChecks",
  "Package",
  "Palette",
  "Rocket",
  "Settings",
  "Wrench",
] as const;

export type CustomTypeIconName = (typeof CUSTOM_TYPE_ICON_NAMES)[number];

// None of these is one of the seven built-in type colors, so a custom type is never mistaken for a built-in one
export const CUSTOM_TYPE_COLORS = [
  "#ef4444",
  "#14b8a6",
  "#06b6d4",
  "#6366f1",
  "#d946ef",
  "#84cc16",
  "#f43f5e",
  "#a3a3a3",
] as const;

export type CustomTypeColor = (typeof CUSTOM_TYPE_COLORS)[number];

// What a screen reader announces, instead of a component name or a hex code
export const CUSTOM_TYPE_ICON_LABELS: Record<CustomTypeIconName, string> = {
  BookOpen: "Book",
  Bookmark: "Bookmark",
  Box: "Box",
  Briefcase: "Briefcase",
  Bug: "Bug",
  Database: "Database",
  FileText: "Document",
  Globe: "Globe",
  Key: "Key",
  Lightbulb: "Idea",
  ListChecks: "Checklist",
  Package: "Package",
  Palette: "Palette",
  Rocket: "Rocket",
  Settings: "Settings",
  Wrench: "Tool",
};

export const CUSTOM_TYPE_COLOR_NAMES: Record<CustomTypeColor, string> = {
  "#ef4444": "Red",
  "#14b8a6": "Teal",
  "#06b6d4": "Cyan",
  "#6366f1": "Indigo",
  "#d946ef": "Fuchsia",
  "#84cc16": "Lime",
  "#f43f5e": "Rose",
  "#a3a3a3": "Gray",
};

export const MAX_CUSTOM_TYPES = 20;
