import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { ContentType, PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_EMAIL = "demo@devstash.io";
const DEMO_PASSWORD = "demo-password-123";
const MINIMAL = process.argv.includes("--minimal");

interface SeedItem {
  title: string;
  description: string;
  type: string;
  contentType: ContentType;
  content?: string;
  url?: string;
  language?: string;
  tags: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
}

interface SeedCollection {
  name: string;
  description: string;
  isFavorite?: boolean;
  items: SeedItem[];
}

const SYSTEM_ITEM_TYPES = [
  { name: "Snippet", icon: "Code", color: "#3b82f6" },
  { name: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "Command", icon: "Terminal", color: "#f97316" },
  { name: "Note", icon: "StickyNote", color: "#fde047" },
  { name: "File", icon: "File", color: "#6b7280" },
  { name: "Image", icon: "Image", color: "#ec4899" },
  { name: "URL", icon: "Link", color: "#10b981" },
];

const COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    items: [
      {
        title: "useAuth Hook",
        description: "Custom authentication hook for React applications",
        type: "Snippet",
        contentType: ContentType.TEXT,
        language: "typescript",
        content: `import { createContext, useContext } from "react";

interface AuthContextValue {
  user: { id: string; email: string } | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}`,
        tags: ["react", "auth", "hooks"],
        isFavorite: true,
        isPinned: true,
      },
      {
        title: "API Error Handling Pattern",
        description: "Fetch wrapper with exponential backoff retry logic",
        type: "Snippet",
        contentType: ContentType.TEXT,
        language: "typescript",
        content: `export async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return response;
    } catch (error) {
      if (attempt === retries) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 250));
  }
  throw new Error(\`Request to \${url} failed after \${retries} retries\`);
}`,
        tags: ["api", "error-handling", "fetch"],
        isPinned: true,
      },
      {
        title: "React Docs: Hooks Reference",
        description: "Official reference for every built-in React hook",
        type: "URL",
        contentType: ContentType.URL,
        url: "https://react.dev/reference/react/hooks",
        tags: ["react", "hooks"],
      },
    ],
  },
  {
    name: "Python Snippets",
    description: "Useful Python code snippets",
    items: [
      {
        title: "Read JSON Lines File",
        description: "Stream a large .jsonl file one record at a time",
        type: "Snippet",
        contentType: ContentType.TEXT,
        language: "python",
        content: `import json
from collections.abc import Iterator
from pathlib import Path


def read_jsonl(path: Path) -> Iterator[dict]:
    with path.open(encoding="utf-8") as file:
        for line in file:
            if line.strip():
                yield json.loads(line)`,
        tags: ["python", "files"],
      },
      {
        title: "Timing Decorator",
        description: "Log how long a function takes to run",
        type: "Snippet",
        contentType: ContentType.TEXT,
        language: "python",
        content: `import time
from functools import wraps


def timed(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(f"{func.__name__} took {time.perf_counter() - start:.3f}s")

    return wrapper`,
        tags: ["python", "decorators"],
      },
    ],
  },
  {
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    items: [
      {
        title: "Project CLAUDE.md Template",
        description: "Starter context file for a new Next.js project",
        type: "Note",
        contentType: ContentType.TEXT,
        content: `# Project

Short description of what this app does.

## Commands

- \`npm run dev\` — start the dev server
- \`npm run build\` — production build
- \`npm run lint\` — lint the codebase

## Conventions

- TypeScript strict mode, no \`any\`
- Server components by default
- Validate all inputs with Zod`,
        tags: ["ai", "context"],
        isFavorite: true,
      },
      {
        title: "Coding Standards Outline",
        description: "Sections worth covering in a coding standards file",
        type: "Note",
        contentType: ContentType.TEXT,
        content: `1. Language and type rules
2. Component and file naming
3. Data fetching and mutation patterns
4. Error handling
5. Styling rules
6. What not to do`,
        tags: ["ai", "context", "standards"],
      },
    ],
  },
  {
    name: "Interview Prep",
    description: "Technical interview preparation",
    items: [
      {
        title: "System Design Checklist",
        description: "Key points to cover in a system design interview",
        type: "Note",
        contentType: ContentType.TEXT,
        content: `- Clarify requirements and scale (users, reads vs writes)
- Sketch the high-level components and data flow
- Pick the data model and storage
- Identify bottlenecks: caching, sharding, queues
- Cover failure modes and monitoring
- Discuss trade-offs out loud`,
        tags: ["interview", "system-design"],
        isPinned: true,
      },
      {
        title: "Debounce Implementation",
        description: "Classic debounce function asked in frontend interviews",
        type: "Snippet",
        contentType: ContentType.TEXT,
        language: "typescript",
        content: `export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}`,
        tags: ["interview", "javascript"],
      },
    ],
  },
  {
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    items: [
      {
        title: "Undo Last Commit",
        description: "Undo the last commit but keep changes staged",
        type: "Command",
        contentType: ContentType.TEXT,
        language: "bash",
        content: "git reset --soft HEAD~1",
        tags: ["git"],
        isFavorite: true,
      },
      {
        title: "Clean Merged Branches",
        description: "Delete local branches that are already merged into main",
        type: "Command",
        contentType: ContentType.TEXT,
        language: "bash",
        content: "git branch --merged main | grep -v '^\\*\\|main' | xargs -r git branch -d",
        tags: ["git", "cleanup"],
      },
    ],
  },
  {
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    items: [
      {
        title: "Code Review Prompt",
        description: "Prompt for reviewing pull requests with actionable feedback",
        type: "Prompt",
        contentType: ContentType.TEXT,
        content: `Review the following diff as a senior engineer. For each issue, give the file and line, explain the risk, and suggest a concrete fix. Focus on correctness, security and edge cases before style. Skip nitpicks. If the change looks good, say so briefly.`,
        tags: ["review", "ai"],
      },
      {
        title: "Explain This Code",
        description: "Prompt for a plain-language walkthrough of unfamiliar code",
        type: "Prompt",
        contentType: ContentType.TEXT,
        content: `Explain what the following code does, step by step, as if to a developer new to this codebase. Start with a one-sentence summary, then cover the main flow, then list anything surprising or fragile.`,
        tags: ["ai", "explain"],
        isFavorite: true,
      },
    ],
  },
];

async function seedItemTypes(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const type of SYSTEM_ITEM_TYPES) {
    // Prisma can't upsert on the partial unique index, so look the row up by hand.
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });
    const saved = existing
      ? await prisma.itemType.update({ where: { id: existing.id }, data: type })
      : await prisma.itemType.create({ data: { ...type, isSystem: true } });
    ids.set(type.name, saved.id);
  }
  return ids;
}

async function seedDemoUser(): Promise<string> {
  // The minimal seed targets production, where deleting the user would cascade to its data.
  const existing = MINIMAL
    ? await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
    : null;
  if (existing) return existing.id;

  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const userId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      name: "Demo User",
      email: DEMO_EMAIL,
      emailVerified: true,
      isPro: false,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await bcrypt.hash(DEMO_PASSWORD, 12),
        },
      },
    },
  });
  return userId;
}

async function seedTags(userId: string): Promise<Map<string, string>> {
  const names = [...new Set(COLLECTIONS.flatMap((c) => c.items.flatMap((i) => i.tags)))];
  await prisma.tag.createMany({ data: names.map((name) => ({ name, userId })) });
  const tags = await prisma.tag.findMany({ where: { userId } });
  return new Map(tags.map((tag) => [tag.name, tag.id]));
}

async function seedCollections(
  userId: string,
  typeIds: Map<string, string>,
  tagIds: Map<string, string>,
): Promise<number> {
  let itemCount = 0;
  for (const collection of COLLECTIONS) {
    await prisma.collection.create({
      data: {
        name: collection.name,
        description: collection.description,
        isFavorite: collection.isFavorite ?? false,
        userId,
        items: {
          create: collection.items.map((item) => ({
            title: item.title,
            description: item.description,
            contentType: item.contentType,
            content: item.content,
            url: item.url,
            language: item.language,
            isFavorite: item.isFavorite ?? false,
            isPinned: item.isPinned ?? false,
            userId,
            itemTypeId: typeIds.get(item.type)!,
            tags: {
              create: item.tags.map((name) => ({ tagId: tagIds.get(name)! })),
            },
          })),
        },
      },
    });
    itemCount += collection.items.length;
  }
  return itemCount;
}

async function main() {
  const typeIds = await seedItemTypes();
  console.log(`Seeded ${typeIds.size} system item types`);

  const userId = await seedDemoUser();
  console.log(`Seeded demo user ${DEMO_EMAIL}`);
  if (MINIMAL) return;

  const tagIds = await seedTags(userId);
  const itemCount = await seedCollections(userId, typeIds, tagIds);
  console.log(
    `Seeded ${COLLECTIONS.length} collections, ${itemCount} items, ${tagIds.size} tags`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
