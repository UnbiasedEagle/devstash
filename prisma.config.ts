import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // The pooled connection can't run migrations, so the CLI uses the direct one.
    url: process.env["DIRECT_URL"],
  },
});
