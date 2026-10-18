import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const SYSTEM_ITEM_TYPES = [
  { name: "Snippet", icon: "Code", color: "#3b82f6" },
  { name: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "Command", icon: "Terminal", color: "#f97316" },
  { name: "Note", icon: "StickyNote", color: "#fde047" },
  { name: "File", icon: "File", color: "#6b7280" },
  { name: "Image", icon: "Image", color: "#ec4899" },
  { name: "URL", icon: "Link", color: "#10b981" },
];

async function seedItemTypes(): Promise<number> {
  for (const type of SYSTEM_ITEM_TYPES) {
    // Prisma can't upsert on the partial unique index, so look the row up by hand.
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });
    if (existing) {
      await prisma.itemType.update({ where: { id: existing.id }, data: type });
    } else {
      await prisma.itemType.create({ data: { ...type, isSystem: true } });
    }
  }
  return SYSTEM_ITEM_TYPES.length;
}

seedItemTypes()
  .then((count) => console.log(`Seeded ${count} system item types`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
