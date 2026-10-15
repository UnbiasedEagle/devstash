export interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  isFavorite: boolean;
  color: string;
  itemTypeIds: string[];
}

export interface Item {
  id: string;
  title: string;
  description: string;
  itemTypeId: string;
  collectionId: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
}

export const currentUser: User = {
  id: "user-1",
  name: "Demo User",
  email: "demo@example.com",
  isPro: false,
};

export const itemTypes: ItemType[] = [
  { id: "snippet", name: "Snippets", icon: "Code", color: "#3b82f6", count: 24 },
  { id: "prompt", name: "Prompts", icon: "Sparkles", color: "#8b5cf6", count: 18 },
  { id: "command", name: "Commands", icon: "Terminal", color: "#f97316", count: 15 },
  { id: "note", name: "Notes", icon: "StickyNote", color: "#fde047", count: 12 },
  { id: "file", name: "Files", icon: "File", color: "#6b7280", count: 5 },
  { id: "image", name: "Images", icon: "Image", color: "#ec4899", count: 3 },
  { id: "url", name: "Links", icon: "Link", color: "#10b981", count: 8 },
];

export const collections: Collection[] = [
  {
    id: "react-patterns",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    itemCount: 12,
    isFavorite: true,
    color: "#3b82f6",
    itemTypeIds: ["snippet", "note", "url"],
  },
  {
    id: "python-snippets",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    itemCount: 8,
    isFavorite: false,
    color: "#3b82f6",
    itemTypeIds: ["snippet", "note"],
  },
  {
    id: "context-files",
    name: "Context Files",
    description: "AI context files for projects",
    itemCount: 5,
    isFavorite: true,
    color: "#6b7280",
    itemTypeIds: ["file", "note"],
  },
  {
    id: "interview-prep",
    name: "Interview Prep",
    description: "Technical interview preparation",
    itemCount: 24,
    isFavorite: false,
    color: "#fde047",
    itemTypeIds: ["note", "snippet", "url", "prompt"],
  },
  {
    id: "git-commands",
    name: "Git Commands",
    description: "Frequently used git commands",
    itemCount: 15,
    isFavorite: true,
    color: "#f97316",
    itemTypeIds: ["command", "note"],
  },
  {
    id: "ai-prompts",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    itemCount: 18,
    isFavorite: false,
    color: "#8b5cf6",
    itemTypeIds: ["prompt", "snippet", "note"],
  },
];

export const items: Item[] = [
  {
    id: "item-1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    itemTypeId: "snippet",
    collectionId: "react-patterns",
    tags: ["react", "auth", "hooks"],
    isFavorite: true,
    isPinned: true,
    updatedAt: "2026-01-15",
  },
  {
    id: "item-2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    itemTypeId: "snippet",
    collectionId: "react-patterns",
    tags: ["api", "error-handling", "fetch"],
    isFavorite: false,
    isPinned: true,
    updatedAt: "2026-01-12",
  },
  {
    id: "item-3",
    title: "Code Review Prompt",
    description: "Prompt for reviewing pull requests with actionable feedback",
    itemTypeId: "prompt",
    collectionId: "ai-prompts",
    tags: ["review", "ai"],
    isFavorite: false,
    isPinned: false,
    updatedAt: "2026-01-10",
  },
  {
    id: "item-4",
    title: "Undo Last Commit",
    description: "Undo the last commit but keep changes staged",
    itemTypeId: "command",
    collectionId: "git-commands",
    tags: ["git"],
    isFavorite: true,
    isPinned: false,
    updatedAt: "2026-01-08",
  },
  {
    id: "item-5",
    title: "System Design Checklist",
    description: "Key points to cover in a system design interview",
    itemTypeId: "note",
    collectionId: "interview-prep",
    tags: ["interview", "system-design"],
    isFavorite: false,
    isPinned: false,
    updatedAt: "2026-01-05",
  },
];
