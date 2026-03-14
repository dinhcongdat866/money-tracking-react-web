import { defineConfig, type PrismaConfig } from "prisma/config";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

const connectionString =
  (process.env.DIRECT_URL ?? process.env.DATABASE_URL) as string;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: connectionString },
} satisfies PrismaConfig);
